import Ajv2020 from "ajv/dist/2020";
import submissionSchema from "../../../shared/intake/contracts/schemas/intake-submission.schema.json";
import {
  deriveForgeBuildCandidatesProjection,
  type ForgeBuildCandidatesProjection,
  type ForgeRequirementsProjection,
} from "../../../shared/intake/forge-build-candidates.js";
import {
  CONTRACT_VERSION,
  evaluateRoute,
  isLaneId,
  LANES,
  publicContractManifest,
  type AnswerMap,
  type LaneId,
} from "../../../shared/intake/model";
import {
  INTAKE_COOKIE_DAYS,
  INTAKE_COOKIE_NAME,
  INTAKE_DRAFT_MAX_BODY_BYTES,
  INTAKE_IDENTIFIED_DRAFT_DAYS,
  INTAKE_MAGIC_LINK_MINUTES,
  INTAKE_MAX_BODY_BYTES,
  INTAKE_PUBLIC_COPY_DAYS,
} from "./constants";
import {
  enforceRateLimit,
  enforceRateLimitKey,
  HttpError,
  isEmailAddress,
  jsonResponse,
  readJsonBody,
  rejectUnknownFields,
  requireObject,
} from "./http";
import { logMetadata } from "./log";
import type { Env, RuntimeDependencies } from "./types";

const ajv = new Ajv2020({ allErrors: true, strict: false });
ajv.addFormat("date-time", (value: string) => Number.isFinite(Date.parse(value)));
ajv.addFormat("email", (value: string) => isEmailAddress(value));
ajv.addFormat("uri", (value: string) => {
  try { new URL(value); return true; } catch { return false; }
});
const validateSubmissionSchema = ajv.compile(submissionSchema);

const DAY_MS = 24 * 60 * 60 * 1_000;
const DRAFT_ID = /^drf_[A-Za-z0-9_-]{12,64}$/;
const TOKEN = /^[A-Za-z0-9_-]{32,200}$/;

interface GrantRow {
  id: string;
  email_hash: string;
  draft_id: string;
  expires_at: string;
  consumed_at: string | null;
  session_expires_at: string | null;
}

interface DraftRow {
  id: string;
  owner_hash: string;
  lane: LaneId;
  form_version: string;
  payload_json: string;
  version: number;
  updated_at: string;
  expires_at: string;
}

interface DuplicateRow { receipt_json: string }
interface ExistingSubmissionRow extends DuplicateRow { payload_hash: string }

interface SubmissionShape {
  intake_id: string;
  session_id: string;
  submission_id: string;
  revision: number;
  supersedes_submission_id?: string | null;
  form_id: string;
  form_version: string;
  submitted_at: string;
  trace_id: string;
  client_reviewed: true;
  identity?: {
    contact_name?: string | null;
    email?: string | null;
    phone?: string | null;
    organization?: string | null;
    organization_domain?: string | null;
    existing_client_reference?: string | null;
  };
  answers: Array<{
    question_id: string;
    value: unknown;
    display_value?: string | null;
    answered_at: string;
    source: "client" | "prefill" | "operator_correction";
    data_classification?: "public" | "client_confidential" | "restricted";
  }>;
  artifacts: unknown[];
  consents: Array<{ consent_id: string; notice_version: string; granted: boolean; recorded_at: string }>;
  client_context?: Record<string, unknown>;
}

export interface IntakePurgeResult {
  grants: number;
  drafts: number;
  submissions: number;
}

function requireDb(env: Env): D1Database {
  if (!env.DB) throw new HttpError(503, "intake_storage_unavailable", "Intake storage is unavailable.");
  return env.DB;
}

function id(prefix: string, deps: RuntimeDependencies): string {
  return `${prefix}_${deps.randomUUID().replace(/-/g, "")}`;
}

function token(deps: RuntimeDependencies): string {
  return `${deps.randomUUID().replace(/-/g, "")}${deps.randomUUID().replace(/-/g, "")}`;
}

export async function hashText(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

function cookieValue(request: Request, name: string): string | null {
  const cookie = request.headers.get("cookie") ?? "";
  for (const pair of cookie.split(";")) {
    const [key, ...rest] = pair.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

function responseCookie(name: string, value: string): string {
  return `${name}=${encodeURIComponent(value)}; Path=/api/intake; Max-Age=${INTAKE_COOKIE_DAYS * 86400}; Secure; HttpOnly; SameSite=None`;
}

function cleanString(value: unknown, maximum: number): string | null {
  if (typeof value !== "string") return null;
  const result = value.replace(/\r\n?/g, "\n").trim();
  return result && result.length <= maximum ? result : null;
}

function routeForForm(formId: string): LaneId {
  if (formId === "forge-build-profile") return "forge";
  if (formId === "forge-configurator") return "forge";
  if (formId === "pandora-readiness") return "pandora";
  if (formId === "continuity-assessment") return "continuity";
  if (formId === "relationship") return "relationships";
  return isLaneId(formId) ? formId : "general";
}

function answersToMap(answers: SubmissionShape["answers"]): AnswerMap {
  const mapped: AnswerMap = {};
  for (const answer of answers) {
    const value = answer.value;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null ||
      (Array.isArray(value) && value.every((item) => typeof item === "string"))) {
      mapped[answer.question_id] = value as AnswerMap[string];
    }
  }
  return mapped;
}

function normalizeSubmission(value: unknown): SubmissionShape {
  const raw = requireObject(value) as unknown as SubmissionShape;
  const answers = Array.isArray(raw.answers)
    ? raw.answers.map((answer) => ({
        ...answer,
        data_classification: (answer?.data_classification === "restricted" ? "restricted" : "client_confidential") as
          "restricted" | "client_confidential",
      }))
    : raw.answers;
  return { ...raw, answers };
}

async function validateForgeBuildCandidatesProjection(submission: SubmissionShape): Promise<void> {
  if (submission.form_id !== "forge-configurator") return;
  const context = submission.client_context ?? {};
  const guideBundleHash = context.guide_bundle_hash;
  const requirements = context.guide_requirements_projection as ForgeRequirementsProjection | undefined;
  const submitted = context.guide_build_candidates_projection as ForgeBuildCandidatesProjection | undefined;
  if (typeof guideBundleHash !== "string" || !requirements || !submitted ||
    submitted.guide_bundle_hash !== guideBundleHash) {
    throw new HttpError(400, "forge_build_projection_mismatch", "The Forge build guidance projection could not be verified.");
  }
  try {
    const expected = await deriveForgeBuildCandidatesProjection({
      guide_bundle_hash: guideBundleHash,
      requirements_projection: requirements,
      generated_at: submitted.generated_at,
      preferred_candidate_id: submitted.preferred_candidate_id,
    });
    if (canonicalJson(expected) !== canonicalJson(submitted)) {
      throw new Error("projection content mismatch");
    }
  } catch {
    throw new HttpError(400, "forge_build_projection_mismatch", "The Forge build guidance projection could not be verified.");
  }
}

function validateContactPatch(submission: SubmissionShape): void {
  const name = cleanString(submission.identity?.contact_name, 200);
  const email = cleanString(submission.identity?.email, 320)?.toLowerCase();
  if (!name || !email || !isEmailAddress(email)) {
    throw new HttpError(400, "contact_required", "Name and a valid email address are required.");
  }
  if (submission.artifacts.length !== 0) {
    throw new HttpError(400, "uploads_not_accepted", "Public intake does not accept files or binary evidence.");
  }
  const processConsent = submission.consents.find((item) => item.consent_id === "process_intake");
  if (!processConsent?.granted) {
    throw new HttpError(400, "consent_required", "Consent to process this intake is required.");
  }
  if (submission.consents.some((item) => item.consent_id === "marketing")) {
    throw new HttpError(400, "marketing_consent_not_collected", "Marketing consent is not collected by this intake.");
  }
  if (submission.revision > 1 && !submission.supersedes_submission_id) {
    throw new HttpError(400, "superseding_revision_required", "Corrections must identify the submission they supersede.");
  }
}

async function authorizeDraft(request: Request, env: Env, draftId: string, now: Date): Promise<GrantRow> {
  const db = requireDb(env);
  const cookieName = env.INTAKE_COOKIE_NAME?.trim() || INTAKE_COOKIE_NAME;
  const session = cookieValue(request, cookieName);
  if (!session || !TOKEN.test(session)) throw new HttpError(401, "resume_required", "A valid resume session is required.");
  const row = await db.prepare(
    `SELECT id, email_hash, draft_id, expires_at, consumed_at, session_expires_at
     FROM intake_magic_link_grants WHERE session_hash = ? LIMIT 1`,
  ).bind(await hashText(session)).first<GrantRow>();
  if (!row || row.draft_id !== draftId || !row.session_expires_at || Date.parse(row.session_expires_at) <= now.getTime()) {
    throw new HttpError(403, "draft_access_denied", "This draft is not available to the current resume session.");
  }
  return row;
}

export function handleIntakeStatus(env: Env): Response {
  const manifest = publicContractManifest();
  return jsonResponse({
    ok: true,
    ...manifest,
    readiness: {
      evaluation: "ready",
      storage: env.DB && env.INTAKE_SUBMISSION_RATE_LIMITER ? "ready" : "configuration_required",
      resume: env.DB && env.INTAKE_RESUME_RATE_LIMITER && env.RESEND_API_KEY?.trim() && isEmailAddress(env.INTAKE_RESUME_FROM?.trim())
        ? "ready" : "configuration_required",
    },
    retention: { anonymous_draft_days: 14, identified_draft_days: 30, public_copy_days: 90 },
  });
}

export async function handleIntakeEvaluate(request: Request): Promise<Response> {
  const body = requireObject(await readJsonBody(request, INTAKE_MAX_BODY_BYTES));
  rejectUnknownFields(body, ["lane", "answers", "automated_classification"]);
  if (!isLaneId(body.lane)) throw new HttpError(400, "invalid_lane", "A supported intake lane is required.");
  if (!body.answers || typeof body.answers !== "object" || Array.isArray(body.answers)) {
    throw new HttpError(400, "invalid_answers", "answers must be an object.");
  }
  const serialized = JSON.stringify(body.answers);
  if (serialized.length > 100_000) throw new HttpError(413, "answers_too_large", "Answers exceed the evaluation limit.");
  const decision = evaluateRoute({
    lane: body.lane,
    answers: body.answers as AnswerMap,
    automatedClassification: body.automated_classification !== false,
  });
  return jsonResponse({ ok: true, decision });
}

export async function handleResumeRequest(
  request: Request,
  env: Env,
  requestId: string,
  deps: RuntimeDependencies,
): Promise<Response> {
  await enforceRateLimit(env.INTAKE_RESUME_RATE_LIMITER, request, "intake-resume-ip");
  const body = requireObject(await readJsonBody(request, 8 * 1024));
  rejectUnknownFields(body, ["email", "draft_id"]);
  const email = cleanString(body.email, 320)?.toLowerCase();
  const draftId = cleanString(body.draft_id, 80);
  const neutral = () => jsonResponse({ ok: true, status: "accepted", message: "If the address can receive mail, a resume link will be sent." }, 202);
  if (!email || !isEmailAddress(email) || !draftId || !DRAFT_ID.test(draftId)) return neutral();

  const db = requireDb(env);
  const resendKey = env.RESEND_API_KEY?.trim();
  const sender = env.INTAKE_RESUME_FROM?.trim();
  const origin = env.SITE_ORIGIN?.trim();
  if (!resendKey || !sender || !isEmailAddress(sender) || !origin) {
    throw new HttpError(503, "resume_configuration_required", "Resume email is not configured.");
  }
  const emailHash = await hashText(email);
  await enforceRateLimitKey(env.INTAKE_RESUME_RATE_LIMITER, `email:${emailHash}`);

  const rawToken = token(deps);
  const tokenHash = await hashText(rawToken);
  const now = deps.now();
  const grantId = id("grt", deps);
  const expires = new Date(now.getTime() + INTAKE_MAGIC_LINK_MINUTES * 60_000);
  await db.prepare(
    `INSERT INTO intake_magic_link_grants
      (id, email_hash, token_hash, draft_id, created_at, expires_at, delivery_status)
     VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
  ).bind(grantId, emailHash, tokenHash, draftId, now.toISOString(), expires.toISOString()).run();

  const url = `${origin.replace(/\/$/, "")}/intake/resume#token=${rawToken}`;
  let delivered = false;
  try {
    const response = await deps.fetcher("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${resendKey}`,
        "content-type": "application/json",
        "idempotency-key": grantId,
      },
      body: JSON.stringify({
        from: `Hyperion Intake <${sender}>`, to: [email], subject: "Resume your Hyperion signal",
        text: `Resume your Hyperion signal using this one-time link. It expires in 15 minutes.\n\n${url}\n\nThis email contains no intake answers.`,
      }),
    });
    delivered = response.ok;
  } catch {
    delivered = false;
  }
  await db.prepare("UPDATE intake_magic_link_grants SET delivery_status = ? WHERE id = ?")
    .bind(delivered ? "sent" : "failed", grantId).run();
  logMetadata("intake_resume_requested", {
    request_id: requestId, route: "/api/intake/resume/request", status: 202,
    notification: delivered ? "sent" : "notification_pending",
  });
  return neutral();
}

export async function handleResumeExchange(
  request: Request,
  env: Env,
  deps: RuntimeDependencies,
): Promise<Response> {
  const db = requireDb(env);
  const body = requireObject(await readJsonBody(request, 8 * 1024));
  rejectUnknownFields(body, ["token"]);
  const rawToken = cleanString(body.token, 200);
  if (!rawToken || !TOKEN.test(rawToken)) throw new HttpError(400, "invalid_resume_token", "The resume link is invalid or expired.");
  const tokenHash = await hashText(rawToken);
  const row = await db.prepare(
    `SELECT id, email_hash, draft_id, expires_at, consumed_at, session_expires_at
     FROM intake_magic_link_grants WHERE token_hash = ? LIMIT 1`,
  ).bind(tokenHash).first<GrantRow>();
  const now = deps.now();
  if (!row || row.consumed_at || Date.parse(row.expires_at) <= now.getTime()) {
    throw new HttpError(400, "invalid_resume_token", "The resume link is invalid or expired.");
  }
  const rawSession = token(deps);
  const sessionHash = await hashText(rawSession);
  const sessionExpires = new Date(now.getTime() + INTAKE_COOKIE_DAYS * DAY_MS);
  const result = await db.prepare(
    `UPDATE intake_magic_link_grants SET consumed_at = ?, session_hash = ?, session_expires_at = ?
     WHERE id = ? AND consumed_at IS NULL`,
  ).bind(now.toISOString(), sessionHash, sessionExpires.toISOString(), row.id).run();
  if ((result.meta.changes ?? 0) !== 1) throw new HttpError(400, "invalid_resume_token", "The resume link is invalid or expired.");
  const cookieName = env.INTAKE_COOKIE_NAME?.trim() || INTAKE_COOKIE_NAME;
  return jsonResponse({ ok: true, draft_id: row.draft_id, expires_at: sessionExpires.toISOString() }, 200, {
    "set-cookie": responseCookie(cookieName, rawSession),
  });
}

export async function handleDraft(
  request: Request,
  env: Env,
  draftId: string,
  deps: RuntimeDependencies,
): Promise<Response> {
  if (!DRAFT_ID.test(draftId)) throw new HttpError(404, "draft_not_found", "Draft not found.");
  const db = requireDb(env);
  const now = deps.now();
  const grant = await authorizeDraft(request, env, draftId, now);
  const existing = await db.prepare(
    "SELECT id, owner_hash, lane, form_version, payload_json, version, updated_at, expires_at FROM intake_drafts WHERE id = ? LIMIT 1",
  ).bind(draftId).first<DraftRow>();

  if (request.method === "GET") {
    if (!existing || existing.owner_hash !== grant.email_hash) throw new HttpError(404, "draft_not_found", "Draft not found.");
    return jsonResponse({ ok: true, draft: { ...JSON.parse(existing.payload_json), id: existing.id, version: existing.version, updated_at: existing.updated_at } });
  }

  if (request.method === "DELETE") {
    if (!existing || existing.owner_hash !== grant.email_hash) throw new HttpError(404, "draft_not_found", "Draft not found.");
    await db.prepare("DELETE FROM intake_drafts WHERE id = ? AND owner_hash = ?").bind(draftId, grant.email_hash).run();
    return new Response(null, { status: 204 });
  }

  const body = requireObject(await readJsonBody(request, INTAKE_DRAFT_MAX_BODY_BYTES));
  rejectUnknownFields(body, ["lane", "form_version", "answers", "identity", "consents", "effects_mode", "expected_version"]);
  if (!isLaneId(body.lane) || typeof body.form_version !== "string" || body.form_version !== CONTRACT_VERSION) {
    throw new HttpError(400, "invalid_draft", "Draft lane or form version is invalid.");
  }
  const expectedVersion = Number(body.expected_version);
  if (!Number.isInteger(expectedVersion) || expectedVersion < 0) throw new HttpError(400, "invalid_draft", "expected_version is invalid.");
  const payload = JSON.stringify({
    lane: body.lane, form_version: body.form_version, answers: body.answers ?? {}, identity: body.identity ?? {},
    consents: body.consents ?? {}, effects_mode: body.effects_mode ?? "full",
  });
  const expires = new Date(now.getTime() + INTAKE_IDENTIFIED_DRAFT_DAYS * DAY_MS).toISOString();
  if (!existing) {
    if (expectedVersion !== 0) throw new HttpError(409, "draft_conflict", "The draft changed in another session.");
    await db.prepare(
      `INSERT INTO intake_drafts (id, owner_hash, lane, form_version, payload_json, version, created_at, updated_at, expires_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)`,
    ).bind(draftId, grant.email_hash, body.lane, body.form_version, payload, now.toISOString(), now.toISOString(), expires).run();
    return jsonResponse({ ok: true, id: draftId, version: 1, updated_at: now.toISOString() }, 201);
  }
  if (existing.owner_hash !== grant.email_hash) throw new HttpError(403, "draft_access_denied", "Draft access denied.");
  const result = await db.prepare(
    `UPDATE intake_drafts SET lane = ?, form_version = ?, payload_json = ?, version = version + 1, updated_at = ?, expires_at = ?
     WHERE id = ? AND owner_hash = ? AND version = ?`,
  ).bind(body.lane, body.form_version, payload, now.toISOString(), expires, draftId, grant.email_hash, expectedVersion).run();
  if ((result.meta.changes ?? 0) !== 1) throw new HttpError(409, "draft_conflict", "The draft changed in another session.");
  return jsonResponse({ ok: true, id: draftId, version: expectedVersion + 1, updated_at: now.toISOString() });
}

export async function handleSubmission(
  request: Request,
  env: Env,
  requestId: string,
  deps: RuntimeDependencies,
): Promise<Response> {
  await enforceRateLimit(env.INTAKE_SUBMISSION_RATE_LIMITER, request, "intake-submission");
  const db = requireDb(env);
  const idempotencyKey = request.headers.get("idempotency-key")?.trim();
  if (!idempotencyKey || idempotencyKey.length < 16 || idempotencyKey.length > 200) {
    throw new HttpError(400, "idempotency_key_required", "A valid Idempotency-Key header is required.");
  }
  const idempotencyHash = await hashText(idempotencyKey);
  const duplicate = await db.prepare("SELECT receipt_json FROM intake_submissions WHERE idempotency_key_hash = ? LIMIT 1")
    .bind(idempotencyHash).first<DuplicateRow>();
  if (duplicate) return jsonResponse({ ok: true, receipt: JSON.parse(duplicate.receipt_json), duplicate: true }, 200);

  const submission = normalizeSubmission(await readJsonBody(request, INTAKE_MAX_BODY_BYTES));
  if (!validateSubmissionSchema(submission)) {
    const details = (validateSubmissionSchema.errors ?? []).slice(0, 5).map((error) => `${error.instancePath || "/"} ${error.message}`);
    throw new HttpError(400, "schema_rejected", `Submission failed schema validation: ${details.join("; ")}`);
  }
  validateContactPatch(submission);
  await validateForgeBuildCandidatesProjection(submission);
  const now = deps.now();
  const payloadHash = await hashText(canonicalJson(submission));
  const existingSubmission = await db.prepare(
    "SELECT payload_hash, receipt_json FROM intake_submissions WHERE submission_id = ? LIMIT 1",
  ).bind(submission.submission_id).first<ExistingSubmissionRow>();
  if (existingSubmission) {
    if (existingSubmission.payload_hash === payloadHash) {
      return jsonResponse({ ok: true, receipt: JSON.parse(existingSubmission.receipt_json), duplicate: true }, 200);
    }
    const conflictId = id("col", deps);
    const auditId = id("aud", deps);
    try {
      await db.batch([
        db.prepare(
          `INSERT INTO intake_revision_conflicts
           (conflict_id, intake_id, submission_id, existing_hash, received_hash, state, request_id, created_at)
           VALUES (?, ?, ?, ?, ?, 'quarantined', ?, ?)`,
        ).bind(
          conflictId, submission.intake_id, submission.submission_id, existingSubmission.payload_hash,
          payloadHash, requestId, now.toISOString(),
        ),
        db.prepare(
          `INSERT INTO intake_audit_events
           (audit_id, intake_id, submission_id, event_type, actor_class, request_id, created_at)
           VALUES (?, ?, ?, 'revision_collision_quarantined', 'system', ?, ?)`,
        ).bind(auditId, submission.intake_id, submission.submission_id, requestId, now.toISOString()),
      ]);
    } catch {
      throw new HttpError(503, "revision_collision_storage_unavailable", "The conflicting revision could not be quarantined.");
    }
    throw new HttpError(409, "revision_collision_quarantined", "A conflicting revision was durably quarantined for operator review.");
  }
  const lane = routeForForm(submission.form_id);
  const automated = submission.consents.find((item) => item.consent_id === "automated_classification")?.granted !== false;
  const answerProjection = answersToMap(submission.answers);
  const decision = evaluateRoute({ lane, answers: answerProjection, automatedClassification: automated });
  if (submission.revision > 1) {
    const prior = await db.prepare(
      "SELECT submission_id FROM intake_submissions WHERE submission_id = ? AND intake_id = ? LIMIT 1",
    ).bind(submission.supersedes_submission_id, submission.intake_id).first<{ submission_id: string }>();
    if (!prior) throw new HttpError(409, "superseded_submission_not_found", "The superseded submission could not be verified.");
  }

  const expires = new Date(now.getTime() + INTAKE_PUBLIC_COPY_DAYS * DAY_MS).toISOString();
  const decisionId = id("dec", deps);
  const proposalId = id("prp", deps);
  const outboxId = id("out", deps);
  const auditId = id("aud", deps);
  const minimizedProjectionHash = await hashText(canonicalJson({ lane, answers: answerProjection }));
  const receipt = {
    receipt_id: id("rcp", deps),
    intake_id: submission.intake_id,
    submission_id: submission.submission_id,
    reference: submission.submission_id.slice(-12).toUpperCase(),
    status: "received for operator review",
    primary_route: decision.primary_route,
    classification: decision.classification,
    revision: submission.revision,
    revision_hash: payloadHash,
    received_at: now.toISOString(),
  };

  const statements = [
    db.prepare(
      `INSERT INTO intake_submissions
       (submission_id, intake_id, session_id, revision, supersedes_submission_id, form_id, form_version,
        submitted_at, received_at, trace_id, identity_json, answers_json, consents_json, client_context_json,
        client_reviewed, payload_hash, idempotency_key_hash, receipt_json, retention_basis, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, NULL, ?)`,
    ).bind(
      submission.submission_id, submission.intake_id, submission.session_id, submission.revision,
      submission.supersedes_submission_id ?? null, submission.form_id, submission.form_version,
      submission.submitted_at, now.toISOString(), submission.trace_id, JSON.stringify(submission.identity ?? {}),
      JSON.stringify(submission.answers), JSON.stringify(submission.consents), JSON.stringify(submission.client_context ?? {}),
      payloadHash, idempotencyHash, JSON.stringify(receipt), expires,
    ),
    db.prepare(
      `INSERT INTO intake_routing_decisions
       (decision_id, proposal_id, intake_id, submission_id, ruleset_version, policy_version,
        agent_contract_version, input_revision_hash, minimized_projection_hash, analyzer_kind,
        analyzer_id, analyzer_version, proposal_state, primary_route, classification, decision_json,
        client_reviewed, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'deterministic', 'hyperion-intake-router', ?, 'active', ?, ?, ?, 1, ?)`,
    ).bind(
      decisionId, proposalId, submission.intake_id, submission.submission_id, decision.ruleset_version,
      decision.ruleset_version, decision.agent_contract_version, payloadHash, minimizedProjectionHash,
      decision.agent_contract_version, decision.primary_route, decision.classification, JSON.stringify(decision), now.toISOString(),
    ),
    db.prepare(
      `INSERT INTO intake_outbox
       (outbox_id, intake_id, submission_id, proposal_id, revision_hash, event_type, state, attempts, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'intake.received.v1', 'held_for_review', 0, ?, ?)`,
    ).bind(
      outboxId, submission.intake_id, submission.submission_id, proposalId, payloadHash,
      now.toISOString(), now.toISOString(),
    ),
    db.prepare(
      `INSERT INTO intake_audit_events
       (audit_id, intake_id, submission_id, event_type, actor_class, request_id, created_at)
       VALUES (?, ?, ?, 'submission_received', 'client', ?, ?)`,
    ).bind(auditId, submission.intake_id, submission.submission_id, requestId, now.toISOString()),
  ];
  try {
    await db.batch(statements);
  } catch {
    const racedDuplicate = await db.prepare("SELECT receipt_json FROM intake_submissions WHERE idempotency_key_hash = ? LIMIT 1")
      .bind(idempotencyHash).first<DuplicateRow>();
    if (racedDuplicate) return jsonResponse({ ok: true, receipt: JSON.parse(racedDuplicate.receipt_json), duplicate: true }, 200);
    throw new HttpError(503, "submission_storage_unavailable", "The submission could not be stored atomically.");
  }
  logMetadata("intake_submitted", {
    request_id: requestId, route: "/api/intake/submissions", status: 201,
    classification: decision.classification, primary_route: decision.primary_route, outbox_state: "held_for_review",
  });
  return jsonResponse({ ok: true, receipt, duplicate: false }, 201);
}

export async function purgeExpiredIntake(db: D1Database, now: Date): Promise<IntakePurgeResult> {
  const at = now.toISOString();
  const results = await db.batch([
    db.prepare("DELETE FROM intake_magic_link_grants WHERE expires_at <= ? OR consumed_at IS NOT NULL").bind(at),
    db.prepare("DELETE FROM intake_drafts WHERE expires_at <= ?").bind(at),
    db.prepare("DELETE FROM intake_audit_events WHERE submission_id IN (SELECT submission_id FROM intake_submissions WHERE expires_at <= ? AND retention_basis IS NULL)").bind(at),
    db.prepare("DELETE FROM intake_consumer_receipts WHERE submission_id IN (SELECT submission_id FROM intake_submissions WHERE expires_at <= ? AND retention_basis IS NULL)").bind(at),
    db.prepare("DELETE FROM intake_revision_conflicts WHERE submission_id IN (SELECT submission_id FROM intake_submissions WHERE expires_at <= ? AND retention_basis IS NULL)").bind(at),
    db.prepare("DELETE FROM intake_outbox WHERE submission_id IN (SELECT submission_id FROM intake_submissions WHERE expires_at <= ? AND retention_basis IS NULL)").bind(at),
    db.prepare("DELETE FROM intake_routing_decisions WHERE submission_id IN (SELECT submission_id FROM intake_submissions WHERE expires_at <= ? AND retention_basis IS NULL)").bind(at),
    db.prepare("DELETE FROM intake_submissions WHERE expires_at <= ? AND retention_basis IS NULL").bind(at),
  ]);
  return {
    grants: results[0]?.meta.changes ?? 0,
    drafts: results[1]?.meta.changes ?? 0,
    submissions: results[7]?.meta.changes ?? 0,
  };
}

export function laneDefinition(lane: LaneId) {
  return LANES[lane];
}
