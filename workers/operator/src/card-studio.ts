import Ajv2020, { type ValidateFunction } from "ajv/dist/2020";
import { CARD_CATALOG, cardCatalogItem } from "../../../shared/card-studio/catalog";
import { BUILTIN_CARD_ASSET_IDS } from "../../../shared/card-studio/studio-catalog";
import designSchema from "../../../shared/card-studio/contracts/card-design-document.v1.schema.json";
import proposalSchema from "../../../shared/card-studio/contracts/card-design-proposal.v1.schema.json";
import orderIntentSchema from "../../../shared/card-studio/contracts/card-order-intent.v1.schema.json";
import orderCommandSchema from "../../../shared/card-studio/contracts/card-order-command.v1.schema.json";
import uploadSessionSchema from "../../../shared/card-studio/contracts/card-upload-session.v1.schema.json";
import { enforceRateLimit, HttpError, jsonResponse, readJsonBody, rejectUnknownFields, requireObject } from "./http";
import { authorizeOperator, constantTimeEqual, sha256 } from "./operator-auth";
import { createShopifyCart, shopifyCheckoutReady, verifyShopifyWebhook } from "./shopify";
import type { Env, RuntimeDependencies } from "./types";

const BODY_LIMIT = 256 * 1024;
const SESSION_PATTERN = /^css_[A-Za-z0-9_-]{24,80}$/;
const ACCOUNT_PATTERN = /^acct_[A-Za-z0-9_-]{8,80}$/;
const PROJECT_PATTERN = /^csp_[A-Za-z0-9_-]{12,64}$/;
const REVISION_PATTERN = /^csr_[A-Za-z0-9_-]{12,64}$/;
const INTENT_PATTERN = /^coi_[A-Za-z0-9_-]{12,64}$/;
const IDEMPOTENCY_MIN = 16;
const IDEMPOTENCY_MAX = 200;
const UPLOAD_TTL_MS = 15 * 60 * 1000;

const ajv = new Ajv2020({
  allErrors: true,
  strict: false,
  formats: {
    "date-time": /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/,
    uri: /^(?:https:\/\/|mailto:|tel:)[^\s]+$/i,
  },
});
const validateDesign = ajv.compile(designSchema);
const validateOrderIntent = ajv.compile(orderIntentSchema);
const validateProposal = ajv.compile(proposalSchema);
const validateOrderCommand = ajv.compile(orderCommandSchema);
const validateUploadSession = ajv.compile(uploadSessionSchema);

interface ProjectRow {
  project_id: string;
  account_ref: string;
  session_hash: string;
  status: string;
  latest_revision: number;
  updated_at: string;
}

interface RevisionRow {
  revision_id: string;
  project_id: string;
  revision: number;
  document_json: string;
  document_hash: string;
  created_at: string;
}

interface ExistingIntentRow {
  intent_id: string;
  payload_hash: string;
  receipt_json: string;
}

interface ProposalDecisionRow {
  proposal_id: string;
  intent_id: string;
  revision_hash: string;
  eligibility: "instant_checkout_eligible" | "review_required";
  proposal_state: string;
}

type DesignDocument = {
  contract_version: "card-design-document/1";
  document_id: string;
  project_id: string;
  revision: number;
  template_id: string;
  product_sku: string;
  asset_refs: string[];
  preflight: { state: "not_run" | "passed" | "warnings" | "failed"; warnings: string[]; renderer_version: string };
  [key: string]: unknown;
};

type UploadAssetRow = {
  asset_ref: string;
  project_id: string;
  scan_state: "pending_upload" | "quarantined" | "passed" | "rejected" | "expired";
};

type OrderIntent = {
  contract_version: "card-order-intent/1";
  intent_id: string;
  project_id: string;
  revision_id: string;
  product_sku: string;
  quantity: number;
  proof_approved: boolean;
  proof_refs: string[];
  consent: { terms_version: string; privacy_version: string; approved_at: string };
  contact_ref?: string;
};

type OrderCommand = {
  contract_version: "card-order-command/1";
  command_id: string;
  proposal_id: string;
  intent_id: string;
  revision_hash: string;
  decision: "request_changes" | "approve_proof" | "release_checkout" | "hold" | "decline";
  reason_code: string;
  issued_at: string;
};

function requireDb(env: Env): D1Database {
  if (!env.DB) throw new HttpError(503, "card_studio_storage_unavailable", "Card Studio storage is not configured.");
  return env.DB;
}

function generatedId(prefix: string, deps: RuntimeDependencies): string {
  return `${prefix}_${deps.randomUUID().replaceAll("-", "")}`;
}

function canonical(value: unknown): string {
  const stable = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(stable);
    if (!item || typeof item !== "object") return item;
    return Object.fromEntries(Object.entries(item as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, stable(child)]));
  };
  return JSON.stringify(stable(value));
}

function validationError(validate: ValidateFunction): never {
  const details = (validate.errors ?? []).slice(0, 5)
    .map((error) => `${error.instancePath || "/"} ${error.message}`)
    .join("; ");
  throw new HttpError(400, "schema_rejected", `Card Studio contract validation failed: ${details}`);
}

function designElementAssetRefs(design: DesignDocument): string[] {
  const artboards = Array.isArray(design.artboards) ? design.artboards : [];
  return artboards.flatMap((artboard) => {
    const elements = artboard && typeof artboard === "object" && Array.isArray((artboard as { elements?: unknown[] }).elements)
      ? (artboard as { elements: Array<{ asset_ref?: unknown }> }).elements
      : [];
    return elements
      .map((element) => typeof element?.asset_ref === "string" ? element.asset_ref : "")
      .filter(Boolean);
  });
}

async function validateDesignAssetReferences(db: D1Database, projectId: string, design: DesignDocument): Promise<void> {
  const declared = new Set(design.asset_refs);
  const used = designElementAssetRefs(design);
  if (used.some((assetRef) => !declared.has(assetRef))) {
    throw new HttpError(400, "asset_reference_undeclared", "Every placed artifact must be declared in asset_refs.");
  }

  const uploadedRefs = design.asset_refs.filter((assetRef) => !BUILTIN_CARD_ASSET_IDS.has(assetRef));
  if (!uploadedRefs.length) return;
  const rows = await Promise.all(uploadedRefs.map((assetRef) => db.prepare(
    `SELECT asset_ref, project_id, scan_state
       FROM card_studio_upload_sessions
      WHERE asset_ref = ? AND project_id = ? LIMIT 1`,
  ).bind(assetRef, projectId).first<UploadAssetRow>()));
  if (rows.some((row) => !row)) {
    throw new HttpError(400, "asset_reference_unknown", "The design references an unknown or tampered artifact.");
  }
  if (rows.some((row) => row?.scan_state !== "passed")) {
    throw new HttpError(409, "asset_scan_required", "Uploaded artwork must pass quarantine scanning before it can enter a design revision.");
  }
}

function parseJson<T>(value: string): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    throw new HttpError(503, "stored_contract_invalid", "Stored Card Studio data failed integrity checks.");
  }
}

async function requireProjectSession(request: Request, db: D1Database, projectId: string): Promise<ProjectRow> {
  const token = request.headers.get("x-card-session")?.trim() ?? "";
  if (!SESSION_PATTERN.test(token)) throw new HttpError(401, "card_session_required", "A valid Card Studio project session is required.");
  const project = await db.prepare(
    "SELECT project_id, account_ref, session_hash, status, latest_revision, updated_at FROM card_studio_projects WHERE project_id = ? LIMIT 1",
  ).bind(projectId).first<ProjectRow>();
  if (!project || !constantTimeEqual(project.session_hash, await sha256(token))) {
    throw new HttpError(404, "card_project_not_found", "Card Studio project was not found.");
  }
  return project;
}

function idempotencyKey(request: Request): string {
  const value = request.headers.get("idempotency-key")?.trim() ?? "";
  if (value.length < IDEMPOTENCY_MIN || value.length > IDEMPOTENCY_MAX) {
    throw new HttpError(400, "idempotency_key_required", "A valid Idempotency-Key header is required.");
  }
  return value;
}

export function handleCardCatalog(): Response {
  return jsonResponse({
    ...CARD_CATALOG,
    authority: "catalog_estimate_only",
    checkout_created: false,
  }, 200, { "cache-control": "public, max-age=300, stale-while-revalidate=600" });
}

export async function handleProjectCreate(
  request: Request,
  env: Env,
  deps: RuntimeDependencies,
): Promise<Response> {
  await enforceRateLimit(env.CARD_STUDIO_RATE_LIMITER, request, "card-studio-project");
  const db = requireDb(env);
  const body = requireObject(await readJsonBody(request, 16 * 1024));
  rejectUnknownFields(body, ["account_ref", "invite_token"]);
  const accountRef = String(body.account_ref ?? "");
  const inviteToken = String(body.invite_token ?? "");
  if (!ACCOUNT_PATTERN.test(accountRef)) throw new HttpError(400, "account_ref_invalid", "A valid account reference is required.");

  let inviteId: string | null = null;
  if (env.CARD_STUDIO_INVITE_REQUIRED !== "false") {
    if (inviteToken.length < 24 || inviteToken.length > 200) {
      throw new HttpError(403, "invite_required", "A valid Card Studio invitation is required.");
    }
    const invite = await db.prepare(
      `SELECT invite_id, assigned_account_ref, expires_at
         FROM card_studio_invites
        WHERE token_hash = ? AND status = 'issued' LIMIT 1`,
    ).bind(await sha256(inviteToken)).first<{ invite_id: string; assigned_account_ref: string | null; expires_at: string }>();
    if (!invite || Date.parse(invite.expires_at) <= deps.now().getTime()
      || (invite.assigned_account_ref && invite.assigned_account_ref !== accountRef)) {
      throw new HttpError(403, "invite_invalid", "The Card Studio invitation is invalid or expired.");
    }
    inviteId = invite.invite_id;
  }

  const projectId = generatedId("csp", deps);
  const sessionToken = generatedId("css", deps);
  const now = deps.now().toISOString();
  const statements = [
    db.prepare(
      `INSERT INTO card_studio_accounts (account_ref, external_customer_ref, status, created_at, updated_at)
       VALUES (?, NULL, 'invited', ?, ?)
       ON CONFLICT(account_ref) DO UPDATE SET updated_at = excluded.updated_at`,
    ).bind(accountRef, now, now),
    db.prepare(
      `INSERT INTO card_studio_projects
       (project_id, account_ref, invite_id, session_hash, status, latest_revision, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'draft', 0, ?, ?)`,
    ).bind(projectId, accountRef, inviteId, await sha256(sessionToken), now, now),
    db.prepare(
      `INSERT INTO card_studio_audit_events
       (audit_id, project_id, intent_id, proposal_id, event_type, actor_class, request_id, created_at)
       VALUES (?, ?, NULL, NULL, 'project_created', 'client', NULL, ?)`,
    ).bind(generatedId("csaud", deps), projectId, now),
  ];
  if (inviteId) {
    statements.push(db.prepare(
      `UPDATE card_studio_invites SET status = 'consumed', consumed_at = ?
       WHERE invite_id = ? AND status = 'issued'`,
    ).bind(now, inviteId));
  }
  try {
    await db.batch(statements);
  } catch {
    throw new HttpError(409, "project_create_conflict", "The project could not be created. The invitation may already be in use.");
  }
  return jsonResponse({
    ok: true,
    project: { project_id: projectId, account_ref: accountRef, status: "draft", latest_revision: 0, updated_at: now },
    session_token: sessionToken,
    session_token_returned_once: true,
  }, 201);
}

export async function handleProjectRead(request: Request, env: Env, projectId: string): Promise<Response> {
  if (!PROJECT_PATTERN.test(projectId)) throw new HttpError(404, "card_project_not_found", "Card Studio project was not found.");
  const db = requireDb(env);
  const project = await requireProjectSession(request, db, projectId);
  const revision = project.latest_revision > 0
    ? await db.prepare(
      `SELECT revision_id, project_id, revision, document_json, document_hash, created_at
         FROM card_studio_design_revisions WHERE project_id = ? AND revision = ? LIMIT 1`,
    ).bind(projectId, project.latest_revision).first<RevisionRow>()
    : null;
  return jsonResponse({
    ok: true,
    project: {
      project_id: project.project_id,
      account_ref: project.account_ref,
      status: project.status,
      latest_revision: project.latest_revision,
      updated_at: project.updated_at,
    },
    design_revision: revision ? {
      revision_id: revision.revision_id,
      revision: revision.revision,
      revision_hash: revision.document_hash,
      document: parseJson<unknown>(revision.document_json),
      created_at: revision.created_at,
    } : null,
  });
}

export async function handleRevisionCreate(
  request: Request,
  env: Env,
  projectId: string,
  deps: RuntimeDependencies,
): Promise<Response> {
  await enforceRateLimit(env.CARD_STUDIO_RATE_LIMITER, request, "card-studio-revision");
  if (!PROJECT_PATTERN.test(projectId)) throw new HttpError(404, "card_project_not_found", "Card Studio project was not found.");
  const db = requireDb(env);
  const project = await requireProjectSession(request, db, projectId);
  const document = await readJsonBody(request, BODY_LIMIT);
  if (!validateDesign(document)) validationError(validateDesign);
  const design = document as DesignDocument;
  const expectedRevision = project.latest_revision + 1;
  if (design.project_id !== projectId || design.revision !== expectedRevision) {
    throw new HttpError(409, "design_revision_conflict", `The next immutable design revision must be ${expectedRevision}.`);
  }
  if (!cardCatalogItem(design.product_sku)) throw new HttpError(400, "catalog_sku_unknown", "The design references an unknown catalog SKU.");
  await validateDesignAssetReferences(db, projectId, design);

  const revisionId = generatedId("csr", deps);
  const hash = await sha256(canonical(design));
  const now = deps.now().toISOString();
  const prior = project.latest_revision > 0
    ? await db.prepare(
      "SELECT revision_id FROM card_studio_design_revisions WHERE project_id = ? AND revision = ? LIMIT 1",
    ).bind(projectId, project.latest_revision).first<{ revision_id: string }>()
    : null;
  try {
    await db.batch([
      db.prepare(
        `INSERT INTO card_studio_design_revisions
         (revision_id, project_id, revision, supersedes_revision_id, document_json, document_hash, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).bind(revisionId, projectId, expectedRevision, prior?.revision_id ?? null, canonical(design), hash, now),
      db.prepare(
        `UPDATE card_studio_projects SET latest_revision = ?, updated_at = ?
         WHERE project_id = ? AND latest_revision = ?`,
      ).bind(expectedRevision, now, projectId, project.latest_revision),
      db.prepare(
        `INSERT INTO card_studio_audit_events
         (audit_id, project_id, intent_id, proposal_id, event_type, actor_class, request_id, created_at)
         VALUES (?, ?, NULL, NULL, 'design_revision_created', 'client', NULL, ?)`,
      ).bind(generatedId("csaud", deps), projectId, now),
    ]);
  } catch {
    throw new HttpError(409, "design_revision_conflict", "The project changed in another session.");
  }
  return jsonResponse({
    ok: true,
    revision: { revision_id: revisionId, project_id: projectId, revision: expectedRevision, revision_hash: hash, created_at: now },
  }, 201);
}

export interface CardEligibility {
  outcome: "instant_checkout_eligible" | "review_required";
  reasons: string[];
  unitAmount: number | null;
  subtotalAmount: number | null;
}

export function evaluateCardEligibility(intent: OrderIntent, design: DesignDocument): CardEligibility {
  const item = cardCatalogItem(intent.product_sku);
  const reasons: string[] = [];
  if (!item) reasons.push("catalog_sku_unknown");
  if (item?.checkout_mode !== "fixed_checkout") reasons.push("sku_requires_proposal");
  if (item && (intent.quantity < item.minimum_quantity || intent.quantity > item.maximum_quantity)) reasons.push("quantity_outside_standard_range");
  if (design.product_sku !== intent.product_sku) reasons.push("design_sku_mismatch");
  if (design.template_id === "blank_guarded") reasons.push("blank_template_requires_review");
  if (!intent.proof_approved) reasons.push("proof_not_approved");
  if (design.preflight.state !== "passed" || design.preflight.warnings.length > 0) reasons.push("preflight_not_clear");
  if (design.asset_refs.some((assetRef) => !BUILTIN_CARD_ASSET_IDS.has(assetRef))) reasons.push("artwork_requires_scan_review");
  const unitAmount = item?.unit_amount ?? null;
  return {
    outcome: reasons.length === 0 ? "instant_checkout_eligible" : "review_required",
    reasons,
    unitAmount,
    subtotalAmount: unitAmount === null ? null : unitAmount * intent.quantity,
  };
}

export async function handleOrderSubmit(
  request: Request,
  env: Env,
  projectId: string,
  requestId: string,
  deps: RuntimeDependencies,
): Promise<Response> {
  await enforceRateLimit(env.CARD_STUDIO_RATE_LIMITER, request, "card-studio-submit");
  if (!PROJECT_PATTERN.test(projectId)) throw new HttpError(404, "card_project_not_found", "Card Studio project was not found.");
  const db = requireDb(env);
  await requireProjectSession(request, db, projectId);
  const keyHash = await sha256(idempotencyKey(request));
  const duplicate = await db.prepare(
    "SELECT intent_id, payload_hash, receipt_json FROM card_studio_order_intents WHERE idempotency_key_hash = ? LIMIT 1",
  ).bind(keyHash).first<ExistingIntentRow>();
  if (duplicate) return jsonResponse({ ok: true, receipt: parseJson(duplicate.receipt_json), duplicate: true });

  const value = await readJsonBody(request, 64 * 1024);
  if (!validateOrderIntent(value)) validationError(validateOrderIntent);
  const intent = value as OrderIntent;
  if (intent.project_id !== projectId || !INTENT_PATTERN.test(intent.intent_id) || !REVISION_PATTERN.test(intent.revision_id)) {
    throw new HttpError(400, "order_intent_invalid", "The order intent does not match this project.");
  }
  const payloadHash = await sha256(canonical(intent));
  const existing = await db.prepare(
    "SELECT intent_id, payload_hash, receipt_json FROM card_studio_order_intents WHERE intent_id = ? LIMIT 1",
  ).bind(intent.intent_id).first<ExistingIntentRow>();
  if (existing) {
    if (constantTimeEqual(existing.payload_hash, payloadHash)) {
      return jsonResponse({ ok: true, receipt: parseJson(existing.receipt_json), duplicate: true });
    }
    const now = deps.now().toISOString();
    try {
      await db.batch([
        db.prepare(
          `INSERT INTO card_studio_revision_conflicts
           (conflict_id, intent_id, existing_hash, received_hash, state, request_id, created_at)
           VALUES (?, ?, ?, ?, 'quarantined', ?, ?)`,
        ).bind(generatedId("csc", deps), intent.intent_id, existing.payload_hash, payloadHash, requestId, now),
        db.prepare(
          `INSERT INTO card_studio_audit_events
           (audit_id, project_id, intent_id, proposal_id, event_type, actor_class, request_id, created_at)
           VALUES (?, ?, ?, NULL, 'intent_conflict_quarantined', 'system', ?, ?)`,
        ).bind(generatedId("csaud", deps), projectId, intent.intent_id, requestId, now),
      ]);
    } catch {
      throw new HttpError(503, "conflict_storage_unavailable", "The conflicting order intent could not be quarantined.");
    }
    throw new HttpError(409, "order_intent_conflict_quarantined", "A conflicting order intent was quarantined for operator review.");
  }

  const revision = await db.prepare(
    `SELECT revision_id, project_id, revision, document_json, document_hash, created_at
       FROM card_studio_design_revisions WHERE revision_id = ? AND project_id = ? LIMIT 1`,
  ).bind(intent.revision_id, projectId).first<RevisionRow>();
  if (!revision) throw new HttpError(409, "design_revision_not_found", "The immutable design revision could not be verified.");
  const design = parseJson<DesignDocument>(revision.document_json);
  if (!validateDesign(design)) throw new HttpError(503, "stored_contract_invalid", "Stored Card Studio design failed integrity checks.");
  const eligibility = evaluateCardEligibility(intent, design);
  const proposalId = generatedId("cdp", deps);
  const outboxId = generatedId("cso", deps);
  const projectionId = generatedId("cop", deps);
  const now = deps.now().toISOString();
  const proposal = {
    contract_version: "card-design-proposal/1",
    proposal_id: proposalId,
    intent_id: intent.intent_id,
    project_id: projectId,
    revision_id: intent.revision_id,
    revision_hash: revision.document_hash,
    catalog_version: CARD_CATALOG.catalog_version,
    product_sku: intent.product_sku,
    quantity: intent.quantity,
    eligibility: eligibility.outcome,
    estimate: {
      currency: "USD",
      unit_amount: eligibility.unitAmount,
      subtotal_amount: eligibility.subtotalAmount,
      binding: false,
    },
    warnings: eligibility.reasons,
    proof_refs: intent.proof_refs,
    authority: "operator_review_only",
    created_at: now,
  };
  const receipt = {
    intent_id: intent.intent_id,
    proposal_id: proposalId,
    project_id: projectId,
    revision_id: intent.revision_id,
    revision_hash: revision.document_hash,
    status: eligibility.outcome === "instant_checkout_eligible" ? "proposal staged; checkout eligible" : "received for operator review",
    eligibility: eligibility.outcome,
    not_a_quote: true,
    checkout_created: false,
    created_at: now,
  };
  if (!validateProposal(proposal)) {
    throw new HttpError(500, "proposal_contract_invalid", "The server-generated Card Studio proposal failed integrity checks.");
  }
  const projection = {
    contract_version: "commerce-order-projection/1",
    projection_id: projectionId,
    intent_id: intent.intent_id,
    provider: "shopify",
    provider_order_ref: null,
    provider_checkout_ref: null,
    status: "not_created",
    updated_at: now,
  };
  const orderStatus = eligibility.outcome === "instant_checkout_eligible" ? "proposal_staged" : "review_required";
  try {
    await db.batch([
      db.prepare(
        `INSERT INTO card_studio_order_intents
         (intent_id, project_id, revision_id, product_sku, quantity, catalog_version, eligibility, status,
          payload_hash, idempotency_key_hash, receipt_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        intent.intent_id, projectId, intent.revision_id, intent.product_sku, intent.quantity,
        CARD_CATALOG.catalog_version, eligibility.outcome, orderStatus, payloadHash, keyHash,
        JSON.stringify(receipt), now, now,
      ),
      db.prepare(
        `INSERT INTO card_studio_design_proposals
         (proposal_id, intent_id, revision_hash, proposal_json, state, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'active', ?, ?)`,
      ).bind(proposalId, intent.intent_id, revision.document_hash, JSON.stringify(proposal), now, now),
      db.prepare(
        `INSERT INTO card_studio_proposal_outbox
         (outbox_id, proposal_id, intent_id, revision_hash, event_type, state, created_at)
         VALUES (?, ?, ?, ?, 'card_studio.proposal_staged.v1', 'held_for_review', ?)`,
      ).bind(outboxId, proposalId, intent.intent_id, revision.document_hash, now),
      db.prepare(
        `INSERT INTO card_studio_checkout_projections
         (projection_id, intent_id, provider, provider_order_ref, provider_checkout_ref, status, projection_json, updated_at)
         VALUES (?, ?, 'shopify', NULL, NULL, 'not_created', ?, ?)`,
      ).bind(projectionId, intent.intent_id, JSON.stringify(projection), now),
      db.prepare(
        `UPDATE card_studio_projects SET status = ?, updated_at = ? WHERE project_id = ?`,
      ).bind(eligibility.outcome === "instant_checkout_eligible" ? "submitted" : "review_required", now, projectId),
      db.prepare(
        `INSERT INTO card_studio_audit_events
         (audit_id, project_id, intent_id, proposal_id, event_type, actor_class, request_id, created_at)
         VALUES (?, ?, ?, ?, 'proposal_staged', 'client', ?, ?)`,
      ).bind(generatedId("csaud", deps), projectId, intent.intent_id, proposalId, requestId, now),
    ]);
  } catch {
    const raced = await db.prepare(
      "SELECT intent_id, payload_hash, receipt_json FROM card_studio_order_intents WHERE idempotency_key_hash = ? LIMIT 1",
    ).bind(keyHash).first<ExistingIntentRow>();
    if (raced) return jsonResponse({ ok: true, receipt: parseJson(raced.receipt_json), duplicate: true });
    const racedIntent = await db.prepare(
      "SELECT intent_id, payload_hash, receipt_json FROM card_studio_order_intents WHERE intent_id = ? LIMIT 1",
    ).bind(intent.intent_id).first<ExistingIntentRow>();
    if (racedIntent && !constantTimeEqual(racedIntent.payload_hash, payloadHash)) {
      try {
        await db.batch([
          db.prepare(
            `INSERT INTO card_studio_revision_conflicts
             (conflict_id, intent_id, existing_hash, received_hash, state, request_id, created_at)
             VALUES (?, ?, ?, ?, 'quarantined', ?, ?)`,
          ).bind(generatedId("csc", deps), intent.intent_id, racedIntent.payload_hash, payloadHash, requestId, now),
          db.prepare(
            `INSERT INTO card_studio_audit_events
             (audit_id, project_id, intent_id, proposal_id, event_type, actor_class, request_id, created_at)
             VALUES (?, ?, ?, NULL, 'intent_conflict_quarantined', 'system', ?, ?)`,
          ).bind(generatedId("csaud", deps), projectId, intent.intent_id, requestId, now),
        ]);
      } catch {
        throw new HttpError(503, "conflict_storage_unavailable", "The raced order conflict could not be quarantined.");
      }
      throw new HttpError(409, "order_intent_conflict_quarantined", "A raced order conflict was quarantined for operator review.");
    }
    throw new HttpError(503, "order_storage_unavailable", "The Card Studio proposal could not be stored atomically.");
  }
  return jsonResponse({ ok: true, receipt, duplicate: false }, 201);
}

export async function handleOrderStatus(request: Request, env: Env, intentId: string): Promise<Response> {
  if (!INTENT_PATTERN.test(intentId)) throw new HttpError(404, "card_order_not_found", "Card Studio order was not found.");
  const db = requireDb(env);
  const row = await db.prepare(
    `SELECT o.intent_id, o.project_id, o.revision_id, o.product_sku, o.quantity, o.catalog_version,
            o.eligibility, o.status, o.receipt_json, o.updated_at,
            p.proposal_id, p.state AS proposal_state,
            c.projection_id, c.status AS checkout_status, c.provider_checkout_ref, c.projection_json
       FROM card_studio_order_intents o
       JOIN card_studio_design_proposals p ON p.intent_id = o.intent_id
       LEFT JOIN card_studio_checkout_projections c ON c.intent_id = o.intent_id
      WHERE o.intent_id = ? LIMIT 1`,
  ).bind(intentId).first<Record<string, unknown>>();
  if (!row) throw new HttpError(404, "card_order_not_found", "Card Studio order was not found.");
  await requireProjectSession(request, db, String(row.project_id));
  return jsonResponse({
    ok: true,
    order: {
      intent_id: row.intent_id,
      project_id: row.project_id,
      revision_id: row.revision_id,
      product_sku: row.product_sku,
      quantity: row.quantity,
      catalog_version: row.catalog_version,
      eligibility: row.eligibility,
      status: row.status,
      proposal_id: row.proposal_id,
      proposal_state: row.proposal_state,
      checkout_projection: row.projection_id ? {
        projection_id: row.projection_id,
        status: row.checkout_status,
        checkout_url: row.checkout_status === "checkout_pending"
          ? (parseJson<{ checkout_url?: string }>(String(row.projection_json ?? "{}")).checkout_url ?? null)
          : null,
      } : null,
      updated_at: row.updated_at,
    },
  });
}

export async function handleUploadSession(
  request: Request,
  env: Env,
  deps: RuntimeDependencies,
): Promise<Response> {
  await enforceRateLimit(env.CARD_STUDIO_RATE_LIMITER, request, "card-studio-upload-session");
  const db = requireDb(env);
  const value = await readJsonBody(request, 32 * 1024);
  if (!validateUploadSession(value)) validationError(validateUploadSession);
  const metadata = value as {
    project_id: string;
    filename: string;
    content_type: string;
    byte_length: number;
    sha256: string;
  };
  await requireProjectSession(request, db, metadata.project_id);
  if (!env.CARD_STUDIO_ASSETS || !env.CARD_STUDIO_UPLOAD_SCANNER) {
    throw new HttpError(503, "secure_upload_unavailable", "Secure artwork quarantine and scanning are not configured.");
  }
  const uploadId = generatedId("csu", deps);
  const assetRef = generatedId("csa", deps);
  const now = deps.now();
  const expiresAt = new Date(now.getTime() + UPLOAD_TTL_MS).toISOString();
  let brokerResponse: Response;
  try {
    brokerResponse = await env.CARD_STUDIO_UPLOAD_SCANNER.fetch("https://card-studio-upload.internal/sessions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        upload_id: uploadId,
        asset_ref: assetRef,
        project_id: metadata.project_id,
        filename: metadata.filename,
        content_type: metadata.content_type,
        byte_length: metadata.byte_length,
        sha256: metadata.sha256,
        expires_at: expiresAt,
      }),
    });
  } catch {
    throw new HttpError(503, "secure_upload_unavailable", "Secure artwork quarantine broker is unavailable.");
  }
  if (!brokerResponse.ok) throw new HttpError(503, "secure_upload_unavailable", "Secure artwork quarantine broker rejected the session.");
  const broker = requireObject(await brokerResponse.json());
  rejectUnknownFields(broker, ["session_ref", "upload_url", "expires_at"]);
  const sessionRef = String(broker.session_ref ?? "");
  const uploadUrl = String(broker.upload_url ?? "");
  if (!/^[A-Za-z0-9_-]{8,160}$/.test(sessionRef)) throw new HttpError(503, "secure_upload_invalid", "Upload broker returned an invalid session.");
  let parsedUploadUrl: URL;
  try {
    parsedUploadUrl = new URL(uploadUrl);
  } catch {
    throw new HttpError(503, "secure_upload_invalid", "Upload broker returned an invalid target.");
  }
  if (parsedUploadUrl.protocol !== "https:") throw new HttpError(503, "secure_upload_invalid", "Upload target must use HTTPS.");
  await db.prepare(
    `INSERT INTO card_studio_upload_sessions
     (upload_id, project_id, asset_ref, object_key, filename, content_type, byte_length,
      expected_sha256, scan_state, broker_session_ref, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending_upload', ?, ?, ?)`,
  ).bind(
    uploadId, metadata.project_id, assetRef, `quarantine/${metadata.project_id}/${assetRef}`,
    metadata.filename, metadata.content_type, metadata.byte_length, metadata.sha256,
    sessionRef, now.toISOString(), expiresAt,
  ).run();
  return jsonResponse({
    ok: true,
    upload: {
      upload_id: uploadId,
      asset_ref: assetRef,
      state: "pending_upload",
      upload_url: parsedUploadUrl.toString(),
      expires_at: expiresAt,
      binary_accepted_by_intake: false,
    },
  }, 201);
}

export async function handleCardOperatorStatus(
  request: Request,
  env: Env,
  deps: RuntimeDependencies,
): Promise<Response> {
  const authorization = await authorizeOperator(request, env, deps.now());
  const db = requireDb(env);
  const pending = await db.prepare(
    `SELECT COUNT(*) AS count FROM card_studio_proposal_outbox o
      LEFT JOIN card_studio_consumer_receipts r ON r.outbox_id = o.outbox_id AND r.consumer_id = ?
      WHERE o.state = 'held_for_review' AND r.outbox_id IS NULL`,
  ).bind(authorization.consumerId).first<{ count: number }>();
  return jsonResponse({
    service: "hyperion-card-studio",
    status: "ready",
    consumer_id: authorization.consumerId,
    pending: Number(pending?.count ?? 0),
    authority: "operator_review_only",
    source_outbox_mutation_allowed: false,
    shopify_network_enabled: shopifyCheckoutReady(env),
  });
}

function decisionStates(decision: OrderCommand["decision"]): { proposal: string; order: string; project: string } {
  if (decision === "request_changes") return { proposal: "changes_requested", order: "changes_requested", project: "review_required" };
  if (decision === "approve_proof") return { proposal: "proof_approved", order: "proposal_approved", project: "submitted" };
  if (decision === "release_checkout") return { proposal: "checkout_released", order: "checkout_pending", project: "checkout_pending" };
  if (decision === "hold") return { proposal: "held", order: "held", project: "review_required" };
  return { proposal: "declined", order: "declined", project: "cancelled" };
}

export async function handleCardOperatorDecision(
  request: Request,
  env: Env,
  requestId: string,
  deps: RuntimeDependencies,
): Promise<Response> {
  const authorization = await authorizeOperator(request, env, deps.now());
  const db = requireDb(env);
  const value = await readJsonBody(request, 32 * 1024);
  if (!validateOrderCommand(value)) validationError(validateOrderCommand);
  const command = value as OrderCommand;
  const commandHash = await sha256(canonical(command));
  const duplicate = await db.prepare(
    "SELECT command_hash FROM card_studio_order_commands WHERE command_id = ? LIMIT 1",
  ).bind(command.command_id).first<{ command_hash: string }>();
  if (duplicate) {
    if (!constantTimeEqual(duplicate.command_hash, commandHash)) {
      throw new HttpError(409, "operator_command_conflict", "The operator command identifier is bound to different content.");
    }
    return jsonResponse({ ok: true, duplicate: true, command_id: command.command_id, source_outbox_mutated: false });
  }
  const proposal = await db.prepare(
    `SELECT p.proposal_id, p.intent_id, p.revision_hash, o.eligibility, p.state AS proposal_state
       FROM card_studio_design_proposals p
       JOIN card_studio_order_intents o ON o.intent_id = p.intent_id
      WHERE p.proposal_id = ? AND p.intent_id = ? LIMIT 1`,
  ).bind(command.proposal_id, command.intent_id).first<ProposalDecisionRow>();
  if (!proposal) throw new HttpError(404, "card_proposal_not_found", "Card Studio proposal was not found.");
  if (!constantTimeEqual(proposal.revision_hash, command.revision_hash)) {
    throw new HttpError(409, "proposal_revision_conflict", "The operator command does not match the proposal revision.");
  }
  if (command.decision === "release_checkout" && proposal.eligibility !== "instant_checkout_eligible") {
    throw new HttpError(409, "checkout_not_eligible", "This proposal requires review and cannot enter the fixed-SKU checkout lane.");
  }
  const states = decisionStates(command.decision);
  const now = deps.now().toISOString();
  const statements = [
    db.prepare(
      `INSERT INTO card_studio_order_commands
       (command_id, proposal_id, intent_id, revision_hash, command_hash, decision, reason_code,
        consumer_id, issued_at, applied_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      command.command_id, command.proposal_id, command.intent_id, command.revision_hash, commandHash,
      command.decision, command.reason_code, authorization.consumerId, command.issued_at, now,
    ),
    db.prepare(
      "UPDATE card_studio_design_proposals SET state = ?, updated_at = ? WHERE proposal_id = ?",
    ).bind(states.proposal, now, command.proposal_id),
    db.prepare(
      "UPDATE card_studio_order_intents SET status = ?, updated_at = ? WHERE intent_id = ?",
    ).bind(states.order, now, command.intent_id),
    db.prepare(
      `UPDATE card_studio_projects SET status = ?, updated_at = ?
       WHERE project_id = (SELECT project_id FROM card_studio_order_intents WHERE intent_id = ?)`,
    ).bind(states.project, now, command.intent_id),
    db.prepare(
      `INSERT INTO card_studio_audit_events
       (audit_id, project_id, intent_id, proposal_id, event_type, actor_class, request_id, created_at)
       VALUES (?, NULL, ?, ?, ?, 'operator', ?, ?)`,
    ).bind(generatedId("csaud", deps), command.intent_id, command.proposal_id, `operator_${command.decision}`, requestId, now),
  ];
  if (command.decision === "release_checkout") {
    statements.push(db.prepare(
      `UPDATE card_studio_checkout_projections
       SET status = 'staged',
           projection_json = json_set(projection_json, '$.status', 'staged', '$.updated_at', ?),
           updated_at = ?
       WHERE intent_id = ?`,
    ).bind(now, now, command.intent_id));
  }
  await db.batch(statements);
  return jsonResponse({
    ok: true,
    duplicate: false,
    command_id: command.command_id,
    proposal_state: states.proposal,
    order_status: states.order,
    checkout_projection_staged: command.decision === "release_checkout",
    shopify_network_called: false,
    source_outbox_mutated: false,
  });
}

export async function handleCardOperatorCheckout(
  request: Request,
  env: Env,
  requestId: string,
  deps: RuntimeDependencies,
): Promise<Response> {
  const authorization = await authorizeOperator(request, env, deps.now());
  const db = requireDb(env);
  const body = requireObject(await readJsonBody(request, 8 * 1024));
  rejectUnknownFields(body, ["intent_id"]);
  const intentId = String(body.intent_id ?? "");
  if (!INTENT_PATTERN.test(intentId)) throw new HttpError(400, "intent_id_invalid", "A valid Card Studio intent is required.");

  const row = await db.prepare(
    `SELECT o.intent_id, o.product_sku, o.quantity, o.status AS order_status,
            c.projection_id, c.status AS projection_status, c.provider_checkout_ref, c.projection_json
       FROM card_studio_order_intents o
       JOIN card_studio_checkout_projections c ON c.intent_id = o.intent_id
      WHERE o.intent_id = ? LIMIT 1`,
  ).bind(intentId).first<{
    intent_id: string;
    product_sku: string;
    quantity: number;
    order_status: string;
    projection_id: string;
    projection_status: string;
    provider_checkout_ref: string | null;
    projection_json: string;
  }>();
  if (!row) throw new HttpError(404, "card_order_not_found", "Card Studio order was not found.");
  if (row.projection_status === "checkout_pending" && row.provider_checkout_ref) {
    const existing = parseJson<{ checkout_url?: string }>(row.projection_json);
    return jsonResponse({
      ok: true,
      duplicate: true,
      intent_id: intentId,
      provider_checkout_ref: row.provider_checkout_ref,
      checkout_url: existing.checkout_url ?? null,
      operator: authorization.consumerId,
    });
  }
  if (row.order_status !== "checkout_pending" || row.projection_status !== "staged") {
    throw new HttpError(409, "checkout_not_released", "Founder Command must release an eligible proposal before provider checkout can be created.");
  }

  const existingAttempt = await db.prepare(
    `SELECT attempt_id, state, provider_checkout_ref, checkout_url
       FROM card_studio_checkout_attempts WHERE intent_id = ? LIMIT 1`,
  ).bind(intentId).first<{
    attempt_id: string;
    state: string;
    provider_checkout_ref: string | null;
    checkout_url: string | null;
  }>();
  if (existingAttempt?.state === "applied" && existingAttempt.provider_checkout_ref) {
    return jsonResponse({
      ok: true,
      duplicate: true,
      intent_id: intentId,
      provider_checkout_ref: existingAttempt.provider_checkout_ref,
      checkout_url: existingAttempt.checkout_url,
      operator: authorization.consumerId,
    });
  }
  if (existingAttempt) {
    throw new HttpError(409, "checkout_attempt_requires_reconciliation", "A prior provider attempt is unresolved; reconcile it before retrying.");
  }

  const now = deps.now().toISOString();
  const attemptId = generatedId("cpa", deps);
  const requestHash = await sha256(canonical({
    intent_id: intentId,
    product_sku: row.product_sku,
    quantity: row.quantity,
    projection_id: row.projection_id,
  }));
  await db.prepare(
    `INSERT INTO card_studio_checkout_attempts
     (attempt_id, intent_id, projection_id, state, request_hash, provider_checkout_ref,
      checkout_url, error_code, created_at, updated_at)
     VALUES (?, ?, ?, 'reserved', ?, NULL, NULL, NULL, ?, ?)`,
  ).bind(attemptId, intentId, row.projection_id, requestHash, now, now).run();

  let cart;
  try {
    cart = await createShopifyCart(env, deps, {
      intentId,
      productSku: row.product_sku,
      quantity: Number(row.quantity),
    });
  } catch (error) {
    const code = error instanceof HttpError ? error.code : "shopify_network_ambiguous";
    if (code === "shopify_not_configured" || code === "shopify_variant_unmapped") {
      await db.prepare("DELETE FROM card_studio_checkout_attempts WHERE attempt_id = ? AND state = 'reserved'")
        .bind(attemptId).run();
    } else {
      await db.prepare(
        `UPDATE card_studio_checkout_attempts
            SET state = 'ambiguous', error_code = ?, updated_at = ?
          WHERE attempt_id = ?`,
      ).bind(code, deps.now().toISOString(), attemptId).run();
    }
    throw error;
  }

  const appliedAt = deps.now().toISOString();
  const nextProjection = {
    ...parseJson<Record<string, unknown>>(row.projection_json),
    provider_checkout_ref: cart.cartId,
    checkout_url: cart.checkoutUrl,
    status: "checkout_pending",
    updated_at: appliedAt,
  };
  await db.batch([
    db.prepare(
      `UPDATE card_studio_checkout_attempts
          SET state = 'applied', provider_checkout_ref = ?, checkout_url = ?, updated_at = ?
        WHERE attempt_id = ? AND state = 'reserved'`,
    ).bind(cart.cartId, cart.checkoutUrl, appliedAt, attemptId),
    db.prepare(
      `UPDATE card_studio_checkout_projections
          SET provider_checkout_ref = ?, status = 'checkout_pending', projection_json = ?, updated_at = ?
        WHERE projection_id = ? AND status = 'staged'`,
    ).bind(cart.cartId, JSON.stringify(nextProjection), appliedAt, row.projection_id),
    db.prepare(
      `INSERT INTO card_studio_audit_events
       (audit_id, project_id, intent_id, proposal_id, event_type, actor_class, request_id, created_at)
       VALUES (?, NULL, ?, NULL, 'shopify_checkout_created', 'service', ?, ?)`,
    ).bind(generatedId("csaud", deps), intentId, requestId, appliedAt),
  ]);
  return jsonResponse({
    ok: true,
    duplicate: false,
    intent_id: intentId,
    provider_checkout_ref: cart.cartId,
    checkout_url: cart.checkoutUrl,
    operator: authorization.consumerId,
    source_outbox_mutated: false,
  }, 201);
}

function webhookIntentId(value: Record<string, unknown>): string | null {
  const attributes = [
    ...(Array.isArray(value.note_attributes) ? value.note_attributes : []),
    ...(Array.isArray(value.custom_attributes) ? value.custom_attributes : []),
  ];
  for (const item of attributes) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const key = String(record.name ?? record.key ?? "");
    const candidate = String(record.value ?? "");
    if (key === "hyperion_intent_id" && INTENT_PATTERN.test(candidate)) return candidate;
  }
  return null;
}

async function sha256Bytes(value: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", value);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function handleCardShopifyWebhook(
  request: Request,
  env: Env,
  deps: RuntimeDependencies,
): Promise<Response> {
  const db = requireDb(env);
  const declared = Number(request.headers.get("content-length") || "0");
  if (!Number.isFinite(declared) || declared > 512 * 1024) {
    throw new HttpError(413, "webhook_too_large", "Shopify webhook exceeds the allowed size.");
  }
  const raw = await request.arrayBuffer();
  if (raw.byteLength === 0 || raw.byteLength > 512 * 1024) {
    throw new HttpError(413, "webhook_too_large", "Shopify webhook exceeds the allowed size.");
  }
  const signature = request.headers.get("x-shopify-hmac-sha256")?.trim() ?? "";
  const secret = env.CARD_STUDIO_SHOPIFY_WEBHOOK_SECRET?.trim() ?? "";
  if (!await verifyShopifyWebhook(raw, signature, secret)) {
    throw new HttpError(401, "shopify_webhook_invalid", "Shopify webhook signature validation failed.");
  }
  const eventId = request.headers.get("x-shopify-webhook-id")?.trim() ?? "";
  const topic = request.headers.get("x-shopify-topic")?.trim().toLowerCase() ?? "";
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(eventId) || !/^[a-z_]+\/[a-z_]+$/.test(topic)) {
    throw new HttpError(400, "shopify_webhook_headers_invalid", "Shopify webhook headers are invalid.");
  }
  const bodyHash = await sha256Bytes(raw);
  const prior = await db.prepare(
    `SELECT body_sha256, state FROM card_studio_webhook_receipts
      WHERE provider = 'shopify' AND event_id = ? LIMIT 1`,
  ).bind(eventId).first<{ body_sha256: string; state: string }>();
  if (prior) {
    if (constantTimeEqual(prior.body_sha256, bodyHash)) {
      return jsonResponse({ ok: true, duplicate: true, state: prior.state });
    }
    await db.prepare(
      `UPDATE card_studio_webhook_receipts SET state = 'conflict_quarantined'
        WHERE provider = 'shopify' AND event_id = ?`,
    ).bind(eventId).run();
    throw new HttpError(409, "shopify_webhook_conflict", "A conflicting Shopify event was quarantined.");
  }

  const now = deps.now().toISOString();
  let payload: Record<string, unknown>;
  try {
    const decoded = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(raw)) as unknown;
    payload = requireObject(decoded);
  } catch {
    await db.prepare(
      `INSERT INTO card_studio_webhook_receipts
       (provider, event_id, topic, body_sha256, state, received_at, applied_at)
       VALUES ('shopify', ?, ?, ?, 'rejected', ?, NULL)`,
    ).bind(eventId, topic, bodyHash, now).run();
    throw new HttpError(400, "shopify_webhook_json_invalid", "Shopify webhook payload is invalid.");
  }
  const intentId = webhookIntentId(payload);
  const projection = intentId
    ? await db.prepare(
      `SELECT projection_id, intent_id FROM card_studio_checkout_projections
        WHERE intent_id = ? LIMIT 1`,
    ).bind(intentId).first<{ projection_id: string; intent_id: string }>()
    : null;
  if (!intentId || !projection) {
    await db.prepare(
      `INSERT INTO card_studio_webhook_receipts
       (provider, event_id, topic, body_sha256, state, received_at, applied_at)
       VALUES ('shopify', ?, ?, ?, 'rejected', ?, NULL)`,
    ).bind(eventId, topic, bodyHash, now).run();
    return jsonResponse({ ok: true, applied: false, reason: "unmatched_intent" });
  }

  const financial = String(payload.financial_status ?? "").toLowerCase();
  const fulfillment = String(payload.fulfillment_status ?? "").toLowerCase();
  const nextStatus = topic === "refunds/create" ? "refunded"
    : topic === "orders/cancelled" ? "cancelled"
      : topic === "fulfillments/create" || ["fulfilled", "partial"].includes(fulfillment) ? "shipped"
        : ["paid", "partially_paid"].includes(financial) ? "paid"
          : "checkout_pending";
  const orderStatus = nextStatus === "shipped" ? "shipped"
    : nextStatus === "paid" ? "paid"
      : nextStatus === "refunded" ? "refunded"
        : nextStatus === "cancelled" ? "cancelled"
          : "checkout_pending";
  const projectStatus = orderStatus === "shipped" ? "production"
    : orderStatus === "paid" ? "paid"
      : ["refunded", "cancelled"].includes(orderStatus) ? "cancelled"
        : "checkout_pending";
  const providerOrderRef = payload.admin_graphql_api_id
    ? String(payload.admin_graphql_api_id)
    : payload.id ? `gid://shopify/Order/${String(payload.id)}` : null;
  await db.batch([
    db.prepare(
      `INSERT INTO card_studio_webhook_receipts
       (provider, event_id, topic, body_sha256, state, received_at, applied_at)
       VALUES ('shopify', ?, ?, ?, 'applied', ?, ?)`,
    ).bind(eventId, topic, bodyHash, now, now),
    db.prepare(
      `UPDATE card_studio_checkout_projections
          SET provider_order_ref = COALESCE(?, provider_order_ref), status = ?,
              projection_json = json_set(projection_json, '$.status', ?, '$.provider_order_ref', ?, '$.updated_at', ?),
              updated_at = ?
        WHERE projection_id = ?`,
    ).bind(providerOrderRef, nextStatus, nextStatus, providerOrderRef, now, now, projection.projection_id),
    db.prepare(
      "UPDATE card_studio_order_intents SET status = ?, updated_at = ? WHERE intent_id = ?",
    ).bind(orderStatus, now, intentId),
    db.prepare(
      `UPDATE card_studio_projects SET status = ?, updated_at = ?
        WHERE project_id = (SELECT project_id FROM card_studio_order_intents WHERE intent_id = ?)`,
    ).bind(projectStatus, now, intentId),
    db.prepare(
      `INSERT INTO card_studio_audit_events
       (audit_id, project_id, intent_id, proposal_id, event_type, actor_class, request_id, created_at)
       VALUES (?, NULL, ?, NULL, ?, 'service', ?, ?)`,
    ).bind(generatedId("csaud", deps), intentId, `shopify_${topic.replace("/", "_")}`, eventId, now),
  ]);
  return jsonResponse({ ok: true, applied: true, intent_id: intentId, status: nextStatus });
}
