import { enforceRateLimitKey, HttpError, jsonResponse, readJsonBody, rejectUnknownFields, requireObject } from "./http";
import { logMetadata } from "./log";
import type { Env, RuntimeDependencies } from "./types";

const MAX_FEED_LIMIT = 100;
const ACK_MAX_BODY_BYTES = 64 * 1024;
const OPERATOR_FEED_CONTRACT = "hyperion.intake.operator-feed/2.0";
const CONSUMER_PATTERN = /^[a-z0-9][a-z0-9._-]{2,63}$/i;
const OUTBOX_PATTERN = /^out_[A-Za-z0-9_-]{12,64}$/;
const RECEIPT_PATTERN = /^[A-Za-z0-9_-]{8,160}$/;
const HASH_PATTERN = /^[a-f0-9]{64}$/;
const KEY_ID_PATTERN = /^[A-Za-z0-9._-]{3,80}$/;

interface FeedRow {
  outbox_id: string;
  intake_id: string;
  submission_id: string;
  proposal_id: string;
  revision_hash: string;
  event_type: string;
  outbox_state: string;
  created_at: string;
  revision: number;
  supersedes_submission_id: string | null;
  form_id: string;
  form_version: string;
  submitted_at: string;
  received_at: string;
  trace_id: string;
  identity_json: string;
  answers_json: string;
  consents_json: string;
  client_context_json: string;
  receipt_json: string;
  expires_at: string;
  decision_id: string;
  input_revision_hash: string;
  policy_version: string;
  analyzer_kind: "deterministic" | "nest";
  analyzer_id: string;
  analyzer_version: string;
  minimized_projection_hash: string;
  proposal_state: string;
  ruleset_version: string;
  agent_contract_version: string;
  primary_route: string;
  classification: string;
  decision_json: string;
  decision_created_at: string;
}

interface AckItem {
  outbox_id: string;
  revision_hash: string;
  payload_hash: string;
  local_receipt_id: string;
  outcome: "received" | "duplicate" | "conflict_quarantined" | "rejected";
  accepted_business_truth: boolean;
}

interface OperatorAuthorization {
  consumerId: string;
  keyId: string;
  keyVersion: "current" | "previous";
}

function feedTransportMetadata(): Record<string, unknown> {
  return {
    authority: "worker_delivery_outbox",
    source_outbox_state: "held_for_review",
    source_outbox_mutation_allowed: false,
    acknowledgement_scope: "transport_receipt_only",
    business_review_state_included: false,
    replay: "until_transport_acknowledged",
    ordering: ["created_at", "outbox_id"],
    max_page_items: MAX_FEED_LIMIT,
  };
}

function acknowledgementTransportMetadata(): Record<string, unknown> {
  return {
    authority: "consumer_delivery_receipt",
    acknowledgement_scope: "transport_receipt_only",
    accepted_business_truth: false,
    source_outbox_mutation_allowed: false,
    business_review_state_included: false,
  };
}

function requireDb(env: Env): D1Database {
  if (!env.DB) throw new HttpError(503, "operator_feed_unavailable", "Operator intake feed is not configured.");
  return env.DB;
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => [key, stable(item)]));
}

function parseJson(value: string, fallback: unknown): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return fallback;
  }
}

function bearer(request: Request): string {
  const authorization = request.headers.get("authorization")?.trim() ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? "";
}

function consumer(request: Request): string {
  const value = request.headers.get("x-hyprm-consumer")?.trim() ?? "";
  if (!CONSUMER_PATTERN.test(value)) throw new HttpError(400, "consumer_required", "A valid consumer identifier is required.");
  return value;
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return mismatch === 0;
}

async function authorize(request: Request, env: Env, now: Date): Promise<OperatorAuthorization> {
  const keyId = env.FOUNDER_COMMAND_PULL_KEY_ID?.trim() ?? "";
  const current = env.FOUNDER_COMMAND_PULL_TOKEN_SHA256?.trim().toLowerCase() ?? "";
  const previous = env.FOUNDER_COMMAND_PULL_PREVIOUS_TOKEN_SHA256?.trim().toLowerCase() ?? "";
  const previousUntil = Date.parse(env.FOUNDER_COMMAND_PULL_PREVIOUS_UNTIL?.trim() ?? "");
  const supplied = bearer(request);
  const suppliedHash = supplied ? await sha256(supplied) : "0".repeat(64);
  const currentMatch = HASH_PATTERN.test(current) && constantTimeEqual(suppliedHash, current);
  const previousMatch = HASH_PATTERN.test(previous) && Number.isFinite(previousUntil) && previousUntil > now.getTime() &&
    constantTimeEqual(suppliedHash, previous);
  if (!KEY_ID_PATTERN.test(keyId) || !supplied || (!currentMatch && !previousMatch)) {
    throw new HttpError(401, "operator_auth_required", "Operator feed authentication failed.", { "www-authenticate": "Bearer" });
  }
  const consumerId = consumer(request);
  await enforceRateLimitKey(env.INTAKE_OPERATOR_RATE_LIMITER, consumerId, "operator-feed");
  const keyVersion = currentMatch ? "current" : "previous";
  logMetadata("operator_auth", { auth_key_version: `${keyId}:${keyVersion}` });
  return { consumerId, keyId, keyVersion };
}

function encodeCursor(createdAt: string, outboxId: string): string {
  const bytes = new TextEncoder().encode(JSON.stringify([createdAt, outboxId]));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

function decodeCursor(value: string | null): [string, string] {
  if (!value) return ["", ""];
  try {
    const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as unknown;
    if (!Array.isArray(parsed) || parsed.length !== 2 || parsed.some((item) => typeof item !== "string")) throw new Error("bad cursor");
    return [parsed[0] as string, parsed[1] as string];
  } catch {
    throw new HttpError(400, "invalid_cursor", "The intake feed cursor is invalid.");
  }
}

async function envelope(row: FeedRow): Promise<Record<string, unknown>> {
  const sourceLane = row.primary_route;
  const canonicalLane = sourceLane === "operator-identity" ? "identity" : sourceLane === "relationships" ? "relationship" : sourceLane;
  const body: Record<string, unknown> = {
    feed_contract: OPERATOR_FEED_CONTRACT,
    outbox: {
      outbox_id: row.outbox_id,
      proposal_id: row.proposal_id,
      revision_hash: row.revision_hash,
      event_type: row.event_type,
      state: row.outbox_state,
      state_scope: "worker_delivery_outbox",
      created_at: row.created_at,
    },
    submission: {
      intake_id: row.intake_id,
      submission_id: row.submission_id,
      revision: row.revision,
      supersedes_submission_id: row.supersedes_submission_id,
      form_id: row.form_id,
      form_version: row.form_version,
      submitted_at: row.submitted_at,
      received_at: row.received_at,
      trace_id: row.trace_id,
      identity: parseJson(row.identity_json, {}),
      answers: parseJson(row.answers_json, []),
      consents: parseJson(row.consents_json, []),
      client_context: parseJson(row.client_context_json, {}),
      artifacts: [],
      artifact_policy: "public_uploads_excluded",
      expires_at: row.expires_at,
    },
    routing: {
      decision_id: row.decision_id,
      proposal_id: row.proposal_id,
      input_revision_hash: row.input_revision_hash,
      ruleset_version: row.ruleset_version,
      policy_version: row.policy_version,
      agent_contract_version: row.agent_contract_version,
      analyzer_kind: row.analyzer_kind,
      analyzer_id: row.analyzer_id,
      analyzer_version: row.analyzer_version,
      minimized_projection_hash: row.minimized_projection_hash,
      proposal_state: row.proposal_state,
      source_lane: sourceLane,
      canonical_lane: canonicalLane,
      classification: row.classification,
      created_at: row.decision_created_at,
      decision: parseJson(row.decision_json, {}),
    },
    receipt: parseJson(row.receipt_json, {}),
    authority: {
      data_classification: "client_confidential",
      authority_class: "proposal",
      source_outbox_unchanged: true,
      acknowledgement_scope: "transport_receipt_only",
      business_review_state_included: false,
    },
  };
  return { ...body, payload_hash: await sha256(JSON.stringify(stable(body))) };
}

async function feedRows(db: D1Database, consumerId: string, cursor: [string, string], limit: number): Promise<FeedRow[]> {
  const result = await db.prepare(
    `SELECT o.outbox_id, o.intake_id, o.submission_id, o.proposal_id, o.revision_hash,
            o.event_type, o.state AS outbox_state, o.created_at,
            s.revision, s.supersedes_submission_id, s.form_id, s.form_version, s.submitted_at, s.received_at,
            s.trace_id, s.identity_json, s.answers_json, s.consents_json, s.client_context_json, s.receipt_json, s.expires_at,
            d.decision_id, d.input_revision_hash, d.policy_version, d.ruleset_version, d.agent_contract_version,
            d.analyzer_kind, d.analyzer_id, d.analyzer_version, d.minimized_projection_hash, d.proposal_state,
            d.primary_route, d.classification,
            d.decision_json, d.created_at AS decision_created_at
       FROM intake_outbox o
       JOIN intake_submissions s ON s.submission_id = o.submission_id
       JOIN intake_routing_decisions d ON d.submission_id = o.submission_id
       LEFT JOIN intake_consumer_receipts r ON r.outbox_id = o.outbox_id AND r.consumer_id = ?
      WHERE o.state = 'held_for_review' AND r.outbox_id IS NULL
        AND (o.created_at > ? OR (o.created_at = ? AND o.outbox_id > ?))
      ORDER BY o.created_at ASC, o.outbox_id ASC
      LIMIT ?`,
  ).bind(consumerId, cursor[0], cursor[0], cursor[1], limit).all<FeedRow>();
  return result.results ?? [];
}

export async function handleOperatorStatus(request: Request, env: Env, deps: RuntimeDependencies): Promise<Response> {
  const authorization = await authorize(request, env, deps.now());
  const { consumerId } = authorization;
  const db = requireDb(env);
  const pending = await db.prepare(
    `SELECT COUNT(*) AS count FROM intake_outbox o
       LEFT JOIN intake_consumer_receipts r ON r.outbox_id = o.outbox_id AND r.consumer_id = ?
      WHERE o.state = 'held_for_review' AND r.outbox_id IS NULL`,
  ).bind(consumerId).first<{ count: number }>();
  return jsonResponse({
    feed_contract: OPERATOR_FEED_CONTRACT,
    service: "hyperion-site-intake",
    status: "ready",
    consumer_id: consumerId,
    key_id: authorization.keyId,
    key_version: authorization.keyVersion,
    pending: Number(pending?.count ?? 0),
    authority: "transport_delivery_only",
    outbox_mutation_allowed: false,
    transport: feedTransportMetadata(),
  });
}

export async function handleOperatorFeed(request: Request, env: Env, deps: RuntimeDependencies): Promise<Response> {
  const authorization = await authorize(request, env, deps.now());
  const { consumerId } = authorization;
  const db = requireDb(env);
  const url = new URL(request.url);
  const requestedLimit = Number(url.searchParams.get("limit") ?? 50);
  if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > MAX_FEED_LIMIT) {
    throw new HttpError(400, "invalid_limit", `Feed limit must be between 1 and ${MAX_FEED_LIMIT}.`);
  }
  const rows = await feedRows(db, consumerId, decodeCursor(url.searchParams.get("cursor")), requestedLimit);
  const items = await Promise.all(rows.map(envelope));
  const last = rows.at(-1);
  return jsonResponse({
    feed_contract: OPERATOR_FEED_CONTRACT,
    consumer_id: consumerId,
    key_id: authorization.keyId,
    key_version: authorization.keyVersion,
    items,
    count: items.length,
    next_cursor: last ? encodeCursor(last.created_at, last.outbox_id) : url.searchParams.get("cursor") ?? "",
    has_more: rows.length === requestedLimit,
    outbox_mutated: false,
    transport: feedTransportMetadata(),
  });
}

function parseAckItem(value: unknown): AckItem {
  const item = requireObject(value);
  rejectUnknownFields(item, ["outbox_id", "revision_hash", "payload_hash", "local_receipt_id", "outcome", "accepted_business_truth"]);
  const outboxId = String(item.outbox_id ?? "");
  const revisionHash = String(item.revision_hash ?? "").toLowerCase();
  const payloadHash = String(item.payload_hash ?? "").toLowerCase();
  const localReceiptId = String(item.local_receipt_id ?? "");
  const outcome = String(item.outcome ?? "");
  const acceptedBusinessTruth = item.accepted_business_truth;
  if (!OUTBOX_PATTERN.test(outboxId) || !HASH_PATTERN.test(revisionHash) || !HASH_PATTERN.test(payloadHash) ||
    !RECEIPT_PATTERN.test(localReceiptId) || !["received", "duplicate", "conflict_quarantined", "rejected"].includes(outcome) ||
    typeof acceptedBusinessTruth !== "boolean" || (outcome === "conflict_quarantined" && acceptedBusinessTruth)) {
    throw new HttpError(400, "invalid_acknowledgement", "Delivery acknowledgement is invalid.");
  }
  return {
    outbox_id: outboxId,
    revision_hash: revisionHash,
    payload_hash: payloadHash,
    local_receipt_id: localReceiptId,
    outcome: outcome as AckItem["outcome"],
    accepted_business_truth: acceptedBusinessTruth,
  };
}

export async function handleOperatorAck(request: Request, env: Env, deps: RuntimeDependencies): Promise<Response> {
  const authorization = await authorize(request, env, deps.now());
  const { consumerId } = authorization;
  const db = requireDb(env);
  const body = requireObject(await readJsonBody(request, ACK_MAX_BODY_BYTES));
  rejectUnknownFields(body, ["deliveries"]);
  if (!Array.isArray(body.deliveries) || body.deliveries.length < 1 || body.deliveries.length > MAX_FEED_LIMIT) {
    throw new HttpError(400, "invalid_acknowledgement", "One to 100 delivery acknowledgements are required.");
  }
  const deliveries = body.deliveries.map(parseAckItem);
  const at = deps.now().toISOString();
  const statements: D1PreparedStatement[] = [];
  for (const delivery of deliveries) {
    const row = await db.prepare(
      `SELECT o.outbox_id, o.intake_id, o.submission_id, o.proposal_id, o.revision_hash,
              o.event_type, o.state AS outbox_state, o.created_at,
              s.revision, s.supersedes_submission_id, s.form_id, s.form_version, s.submitted_at, s.received_at,
              s.trace_id, s.identity_json, s.answers_json, s.consents_json, s.client_context_json, s.receipt_json, s.expires_at,
              d.decision_id, d.input_revision_hash, d.policy_version, d.ruleset_version, d.agent_contract_version,
              d.analyzer_kind, d.analyzer_id, d.analyzer_version, d.minimized_projection_hash, d.proposal_state,
              d.primary_route, d.classification,
              d.decision_json, d.created_at AS decision_created_at
         FROM intake_outbox o JOIN intake_submissions s ON s.submission_id = o.submission_id
         JOIN intake_routing_decisions d ON d.submission_id = o.submission_id
        WHERE o.outbox_id = ? AND o.state = 'held_for_review' LIMIT 1`,
    ).bind(delivery.outbox_id).first<FeedRow>();
    if (!row) throw new HttpError(404, "delivery_not_found", "Delivery record was not found.");
    if (!constantTimeEqual(row.revision_hash, delivery.revision_hash)) {
      throw new HttpError(409, "revision_hash_conflict", "Delivery revision hash does not match.");
    }
    const expected = String((await envelope(row)).payload_hash);
    if (!constantTimeEqual(expected, delivery.payload_hash)) throw new HttpError(409, "payload_hash_conflict", "Delivery payload hash does not match.");
    statements.push(
      db.prepare(
        `INSERT INTO intake_consumer_receipts
         (consumer_id, outbox_id, submission_id, revision_hash, payload_hash, local_receipt_id,
          outcome, accepted_business_truth, first_seen_at, acknowledged_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(consumer_id, outbox_id) DO UPDATE SET
           revision_hash = excluded.revision_hash, payload_hash = excluded.payload_hash,
           local_receipt_id = excluded.local_receipt_id, outcome = excluded.outcome,
           accepted_business_truth = excluded.accepted_business_truth, acknowledged_at = excluded.acknowledged_at`,
      ).bind(
        consumerId, delivery.outbox_id, row.submission_id, delivery.revision_hash, delivery.payload_hash,
        delivery.local_receipt_id, delivery.outcome, delivery.accepted_business_truth ? 1 : 0, at, at,
      ),
      db.prepare(
        `INSERT INTO intake_audit_events
         (audit_id, intake_id, submission_id, event_type, actor_class, request_id, created_at)
         VALUES (?, ?, ?, 'consumer_delivery_acknowledged', 'service', ?, ?)`,
      ).bind(`aud_${deps.randomUUID().replaceAll("-", "")}`, row.intake_id, row.submission_id, consumerId, at),
    );
  }
  await db.batch(statements);
  return jsonResponse({
    feed_contract: OPERATOR_FEED_CONTRACT,
    acknowledged: deliveries.map((delivery) => ({
      outbox_id: delivery.outbox_id,
      revision_hash: delivery.revision_hash,
      local_receipt_id: delivery.local_receipt_id,
      outcome: delivery.outcome,
    })),
    outbox_mutated: false,
    transport: acknowledgementTransportMetadata(),
    key_id: authorization.keyId,
    key_version: authorization.keyVersion,
  });
}
