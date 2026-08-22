import { HttpError, jsonResponse, readJsonBody, rejectUnknownFields, requireObject } from "./http";
import { authorizeOperator, constantTimeEqual, sha256 } from "./operator-auth";
import type { Env, RuntimeDependencies } from "./types";

const MAX_FEED_LIMIT = 100;
const ACK_MAX_BODY_BYTES = 64 * 1024;
const OPERATOR_FEED_CONTRACT = "hyperion.intake.operator-feed/2.2";
const COMPATIBLE_FEED_CONTRACTS = [
  "hyperion.intake.operator-feed/2.0",
  "hyperion.intake.operator-feed/2.1",
  OPERATOR_FEED_CONTRACT,
] as const;
type FeedContract = typeof COMPATIBLE_FEED_CONTRACTS[number];
const OUTBOX_PATTERN = /^(?:out|cso)_[A-Za-z0-9_-]{12,64}$/;
const RECEIPT_PATTERN = /^[A-Za-z0-9_-]{8,160}$/;
const HASH_PATTERN = /^[a-f0-9]{64}$/;

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
  acknowledgement_template_version: string | null;
  acknowledgement_content_hash: string | null;
  acknowledgement_provider_reference: string | null;
  acknowledgement_delivery_state: string | null;
  acknowledgement_attempted_at: string | null;
  acknowledgement_provider_accepted_at: string | null;
  acknowledgement_delivered_at: string | null;
  acknowledgement_failed_at: string | null;
  acknowledgement_updated_at: string | null;
  acknowledgement_error_code: string | null;
}

interface CardFeedRow {
  outbox_id: string;
  proposal_id: string;
  intent_id: string;
  revision_hash: string;
  event_type: string;
  outbox_state: string;
  created_at: string;
  project_id: string;
  revision_id: string;
  product_sku: string;
  quantity: number;
  catalog_version: string;
  eligibility: string;
  order_status: string;
  proposal_json: string;
  proposal_state: string;
}

interface AckItem {
  outbox_id: string;
  revision_hash: string;
  payload_hash: string;
  local_receipt_id: string;
  outcome: "received" | "duplicate" | "conflict_quarantined" | "rejected";
  accepted_business_truth: boolean;
}

interface IntakeQueueHealthRow {
  count: number | string | null;
  oldest_pending_at: string | null;
  newest_pending_at: string | null;
  acknowledgement_delivered: number | string | null;
  acknowledgement_in_flight: number | string | null;
  acknowledgement_failed: number | string | null;
  acknowledgement_missing: number | string | null;
}

interface CardQueueHealthRow {
  count: number | string | null;
  oldest_pending_at: string | null;
  newest_pending_at: string | null;
}

interface LaneQueueHealthRow {
  lane: string;
  count: number | string | null;
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
    compatible_feed_contracts: COMPATIBLE_FEED_CONTRACTS,
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

function canonicalLane(value: string): string {
  return value === "operator-identity" ? "identity" : value === "relationships" ? "relationship" : value;
}

function earlier(left: string | null, right: string | null): string | null {
  if (!left) return right;
  if (!right) return left;
  return left.localeCompare(right) <= 0 ? left : right;
}

function later(left: string | null, right: string | null): string | null {
  if (!left) return right;
  if (!right) return left;
  return left.localeCompare(right) >= 0 ? left : right;
}

async function queueHealth(db: D1Database, consumerId: string, now: Date): Promise<Record<string, unknown>> {
  const [intake, cards, laneResult] = await Promise.all([
    db.prepare(
      `SELECT COUNT(*) AS count, MIN(o.created_at) AS oldest_pending_at, MAX(o.created_at) AS newest_pending_at,
              SUM(CASE WHEN a.delivery_state = 'delivered' THEN 1 ELSE 0 END) AS acknowledgement_delivered,
              SUM(CASE WHEN a.delivery_state IN ('pending', 'sent') THEN 1 ELSE 0 END) AS acknowledgement_in_flight,
              SUM(CASE WHEN a.delivery_state IN ('failed', 'bounced') THEN 1 ELSE 0 END) AS acknowledgement_failed,
              SUM(CASE WHEN a.delivery_state IS NULL THEN 1 ELSE 0 END) AS acknowledgement_missing
         FROM intake_outbox o
         LEFT JOIN intake_consumer_receipts r ON r.outbox_id = o.outbox_id AND r.consumer_id = ?
         LEFT JOIN intake_acknowledgement_deliveries a ON a.submission_id = o.submission_id
        WHERE o.state = 'held_for_review' AND r.outbox_id IS NULL`,
    ).bind(consumerId).first<IntakeQueueHealthRow>(),
    db.prepare(
      `SELECT COUNT(*) AS count, MIN(o.created_at) AS oldest_pending_at, MAX(o.created_at) AS newest_pending_at
         FROM card_studio_proposal_outbox o
         LEFT JOIN card_studio_consumer_receipts r ON r.outbox_id = o.outbox_id AND r.consumer_id = ?
        WHERE o.state = 'held_for_review' AND r.outbox_id IS NULL`,
    ).bind(consumerId).first<CardQueueHealthRow>(),
    db.prepare(
      `SELECT d.primary_route AS lane, COUNT(*) AS count
         FROM intake_outbox o
         JOIN intake_routing_decisions d ON d.submission_id = o.submission_id
         LEFT JOIN intake_consumer_receipts r ON r.outbox_id = o.outbox_id AND r.consumer_id = ?
        WHERE o.state = 'held_for_review' AND r.outbox_id IS NULL
        GROUP BY d.primary_route`,
    ).bind(consumerId).all<LaneQueueHealthRow>(),
  ]);
  const intakeCount = Number(intake?.count ?? 0);
  const cardCount = Number(cards?.count ?? 0);
  const oldestPendingAt = earlier(intake?.oldest_pending_at ?? null, cards?.oldest_pending_at ?? null);
  const newestPendingAt = later(intake?.newest_pending_at ?? null, cards?.newest_pending_at ?? null);
  const oldestTimestamp = oldestPendingAt ? Date.parse(oldestPendingAt) : Number.NaN;
  const pendingByLane: Record<string, number> = {};
  for (const row of laneResult.results ?? []) {
    const lane = canonicalLane(String(row.lane || "general"));
    pendingByLane[lane] = (pendingByLane[lane] ?? 0) + Number(row.count ?? 0);
  }

  return {
    generated_at: now.toISOString(),
    pending_total: intakeCount + cardCount,
    pending_by_source: { intake: intakeCount, card_studio: cardCount },
    pending_by_lane: pendingByLane,
    oldest_pending_at: oldestPendingAt,
    newest_pending_at: newestPendingAt,
    oldest_pending_age_seconds: Number.isFinite(oldestTimestamp)
      ? Math.max(0, Math.floor((now.getTime() - oldestTimestamp) / 1000))
      : null,
    visitor_acknowledgement: {
      delivered: Number(intake?.acknowledgement_delivered ?? 0),
      in_flight: Number(intake?.acknowledgement_in_flight ?? 0),
      failed: Number(intake?.acknowledgement_failed ?? 0),
      missing_or_not_configured: Number(intake?.acknowledgement_missing ?? 0),
    },
    authority: "transport_observation_only",
  };
}

function requestedFeedContract(request: Request): FeedContract {
  const requested = request.headers.get("x-hyperion-feed-contract")?.trim();
  if (!requested) return OPERATOR_FEED_CONTRACT;
  if (!COMPATIBLE_FEED_CONTRACTS.includes(requested as FeedContract)) {
    throw new HttpError(400, "unsupported_feed_contract", "Requested operator feed contract is not supported.");
  }
  return requested as FeedContract;
}
function requireDb(env: Env): D1Database {
  if (!env.DB) throw new HttpError(503, "operator_feed_unavailable", "Operator intake feed is not configured.");
  return env.DB;
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

function bounded(value: string | null, maximum: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized && normalized.length <= maximum ? normalized : null;
}

function acknowledgementDelivery(row: FeedRow): Record<string, unknown> {
  const state = bounded(row.acknowledgement_delivery_state, 32);
  if (!state || !["pending", "sent", "delivered", "bounced", "failed"].includes(state)) {
    return {
      scope: "deterministic_intake_receipt",
      state: "not_recorded",
      recipient_included: false,
      rendered_content_included: false,
    };
  }
  const contentHash = bounded(row.acknowledgement_content_hash, 64);
  return {
    scope: "deterministic_intake_receipt",
    template_version: bounded(row.acknowledgement_template_version, 80),
    content_hash: contentHash && HASH_PATTERN.test(contentHash) ? contentHash : null,
    provider_reference: bounded(row.acknowledgement_provider_reference, 200),
    state,
    attempted_at: bounded(row.acknowledgement_attempted_at, 40),
    provider_accepted_at: bounded(row.acknowledgement_provider_accepted_at, 40),
    delivered_at: bounded(row.acknowledgement_delivered_at, 40),
    failed_at: bounded(row.acknowledgement_failed_at, 40),
    updated_at: bounded(row.acknowledgement_updated_at, 40),
    error_code: bounded(row.acknowledgement_error_code, 80),
    recipient_included: false,
    rendered_content_included: false,
  };
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

async function envelope(
  row: FeedRow,
  feedContract: FeedContract = OPERATOR_FEED_CONTRACT,
): Promise<Record<string, unknown>> {
  const sourceLane = row.primary_route;
  const normalizedLane = canonicalLane(sourceLane);
  const body: Record<string, unknown> = {
    feed_contract: feedContract,
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
      canonical_lane: normalizedLane,
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
  if (feedContract === OPERATOR_FEED_CONTRACT) {
    body.acknowledgement_delivery = acknowledgementDelivery(row);
  }
  return { ...body, payload_hash: await sha256(JSON.stringify(stable(body))) };
}

async function cardEnvelope(row: CardFeedRow, siteOrigin = ""): Promise<Record<string, unknown>> {
  const proposal = parseJson(row.proposal_json, {});
  const body: Record<string, unknown> = {
    source_kind: "card_studio",
    outbox: {
      outbox_id: row.outbox_id,
      proposal_id: row.proposal_id,
      revision_hash: row.revision_hash,
      event_type: row.event_type,
      state: row.outbox_state,
      created_at: row.created_at,
    },
    card_studio: {
      intent_id: row.intent_id,
      project_id: row.project_id,
      revision_id: row.revision_id,
      product_sku: row.product_sku,
      quantity: row.quantity,
      catalog_version: row.catalog_version,
      eligibility: row.eligibility,
      order_status: row.order_status,
      proposal_state: row.proposal_state,
      proposal,
      source_link: /^https:\/\/[^/]+$/i.test(siteOrigin) ? `${siteOrigin}/card-studio` : "",
      binary_artifacts: [],
      artifact_policy: "opaque_references_only",
    },
    authority: {
      data_classification: "client_confidential",
      authority_class: "proposal",
      source_outbox_unchanged: true,
      checkout_created: false,
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
             d.decision_json, d.created_at AS decision_created_at,
             a.template_version AS acknowledgement_template_version,
             a.content_hash AS acknowledgement_content_hash,
             a.provider_reference AS acknowledgement_provider_reference,
             a.delivery_state AS acknowledgement_delivery_state,
             a.attempted_at AS acknowledgement_attempted_at,
             a.provider_accepted_at AS acknowledgement_provider_accepted_at,
             a.delivered_at AS acknowledgement_delivered_at,
             a.failed_at AS acknowledgement_failed_at,
             a.updated_at AS acknowledgement_updated_at,
             a.error_code AS acknowledgement_error_code
       FROM intake_outbox o
       JOIN intake_submissions s ON s.submission_id = o.submission_id
       JOIN intake_routing_decisions d ON d.submission_id = o.submission_id
       LEFT JOIN intake_acknowledgement_deliveries a ON a.submission_id = o.submission_id
       LEFT JOIN intake_consumer_receipts r ON r.outbox_id = o.outbox_id AND r.consumer_id = ?
      WHERE o.state = 'held_for_review' AND r.outbox_id IS NULL
        AND (o.created_at > ? OR (o.created_at = ? AND o.outbox_id > ?))
      ORDER BY o.created_at ASC, o.outbox_id ASC
      LIMIT ?`,
  ).bind(consumerId, cursor[0], cursor[0], cursor[1], limit).all<FeedRow>();
  return result.results ?? [];
}

async function cardFeedRows(db: D1Database, consumerId: string, cursor: [string, string], limit: number): Promise<CardFeedRow[]> {
  const result = await db.prepare(
    `SELECT x.outbox_id, x.proposal_id, x.intent_id, x.revision_hash, x.event_type,
            x.state AS outbox_state, x.created_at,
            o.project_id, o.revision_id, o.product_sku, o.quantity, o.catalog_version,
            o.eligibility, o.status AS order_status,
            p.proposal_json, p.state AS proposal_state
       FROM card_studio_proposal_outbox x
       JOIN card_studio_order_intents o ON o.intent_id = x.intent_id
       JOIN card_studio_design_proposals p ON p.proposal_id = x.proposal_id
       LEFT JOIN card_studio_consumer_receipts r ON r.outbox_id = x.outbox_id AND r.consumer_id = ?
      WHERE x.state = 'held_for_review' AND r.outbox_id IS NULL
        AND (x.created_at > ? OR (x.created_at = ? AND x.outbox_id > ?))
      ORDER BY x.created_at ASC, x.outbox_id ASC
      LIMIT ?`,
  ).bind(consumerId, cursor[0], cursor[0], cursor[1], limit).all<CardFeedRow>();
  return result.results ?? [];
}

export async function handleOperatorStatus(request: Request, env: Env, deps: RuntimeDependencies): Promise<Response> {
  const authorization = await authorizeOperator(request, env, deps.now());
  const feedContract = requestedFeedContract(request);
  const { consumerId } = authorization;
  const db = requireDb(env);
  const health = await queueHealth(db, consumerId, deps.now());
  return jsonResponse({
    feed_contract: feedContract,
    latest_feed_contract: OPERATOR_FEED_CONTRACT,
    compatible_feed_contracts: COMPATIBLE_FEED_CONTRACTS,
    service: "hyperion-site-intake",
    status: "ready",
    consumer_id: consumerId,
    key_id: authorization.keyId,
    key_version: authorization.keyVersion,
    pending: health.pending_total,
    pending_by_source: health.pending_by_source,
    queue_health: health,
    authority: "transport_delivery_only",
    outbox_mutation_allowed: false,
    transport: feedTransportMetadata(),
  });
}

export async function handleOperatorFeed(request: Request, env: Env, deps: RuntimeDependencies): Promise<Response> {
  const authorization = await authorizeOperator(request, env, deps.now());
  const feedContract = requestedFeedContract(request);
  const { consumerId } = authorization;
  const db = requireDb(env);
  const url = new URL(request.url);
  const requestedLimit = Number(url.searchParams.get("limit") ?? 50);
  if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > MAX_FEED_LIMIT) {
    throw new HttpError(400, "invalid_limit", `Feed limit must be between 1 and ${MAX_FEED_LIMIT}.`);
  }
  const cursor = decodeCursor(url.searchParams.get("cursor"));
  const [intakeRows, cardRows] = await Promise.all([
    feedRows(db, consumerId, cursor, requestedLimit + 1),
    cardFeedRows(db, consumerId, cursor, requestedLimit + 1),
  ]);
  const rows = [...intakeRows, ...cardRows]
    .sort((left, right) => left.created_at.localeCompare(right.created_at) || left.outbox_id.localeCompare(right.outbox_id))
    .slice(0, requestedLimit);
  const items = await Promise.all(rows.map((row) => "intake_id" in row
    ? envelope(row, feedContract)
    : cardEnvelope(row, env.SITE_ORIGIN)));
  const health = await queueHealth(db, consumerId, deps.now());
  const last = rows.at(-1);
  return jsonResponse({
    feed_contract: feedContract,
    latest_feed_contract: OPERATOR_FEED_CONTRACT,
    compatible_feed_contracts: COMPATIBLE_FEED_CONTRACTS,
    consumer_id: consumerId,
    key_id: authorization.keyId,
    key_version: authorization.keyVersion,
    items,
    count: items.length,
    next_cursor: last ? encodeCursor(last.created_at, last.outbox_id) : url.searchParams.get("cursor") ?? "",
    has_more: intakeRows.length + cardRows.length > rows.length,
    outbox_mutated: false,
    queue_health: health,
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
  const authorization = await authorizeOperator(request, env, deps.now());
  const feedContract = requestedFeedContract(request);
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
               d.decision_json, d.created_at AS decision_created_at,
               a.template_version AS acknowledgement_template_version,
               a.content_hash AS acknowledgement_content_hash,
               a.provider_reference AS acknowledgement_provider_reference,
               a.delivery_state AS acknowledgement_delivery_state,
               a.attempted_at AS acknowledgement_attempted_at,
               a.provider_accepted_at AS acknowledgement_provider_accepted_at,
               a.delivered_at AS acknowledgement_delivered_at,
               a.failed_at AS acknowledgement_failed_at,
               a.updated_at AS acknowledgement_updated_at,
               a.error_code AS acknowledgement_error_code
         FROM intake_outbox o JOIN intake_submissions s ON s.submission_id = o.submission_id
         JOIN intake_routing_decisions d ON d.submission_id = o.submission_id
         LEFT JOIN intake_acknowledgement_deliveries a ON a.submission_id = o.submission_id
        WHERE o.outbox_id = ? AND o.state = 'held_for_review' LIMIT 1`,
    ).bind(delivery.outbox_id).first<FeedRow>();
    const cardRow = row ? null : await db.prepare(
      `SELECT x.outbox_id, x.proposal_id, x.intent_id, x.revision_hash, x.event_type,
              x.state AS outbox_state, x.created_at,
              o.project_id, o.revision_id, o.product_sku, o.quantity, o.catalog_version,
              o.eligibility, o.status AS order_status,
              p.proposal_json, p.state AS proposal_state
         FROM card_studio_proposal_outbox x
         JOIN card_studio_order_intents o ON o.intent_id = x.intent_id
         JOIN card_studio_design_proposals p ON p.proposal_id = x.proposal_id
        WHERE x.outbox_id = ? AND x.state = 'held_for_review' LIMIT 1`,
    ).bind(delivery.outbox_id).first<CardFeedRow>();
    const sourceRow = row ?? cardRow;
    if (!sourceRow) throw new HttpError(404, "delivery_not_found", "Delivery record was not found.");
    if (!constantTimeEqual(sourceRow.revision_hash, delivery.revision_hash)) {
      throw new HttpError(409, "revision_hash_conflict", "Delivery revision hash does not match.");
    }
    const expected = String((row
      ? await envelope(row, feedContract)
      : await cardEnvelope(cardRow as CardFeedRow, env.SITE_ORIGIN)).payload_hash);
    if (!constantTimeEqual(expected, delivery.payload_hash)) throw new HttpError(409, "payload_hash_conflict", "Delivery payload hash does not match.");
    if (row) {
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
    } else if (cardRow) {
      statements.push(
        db.prepare(
          `INSERT INTO card_studio_consumer_receipts
           (consumer_id, outbox_id, intent_id, revision_hash, payload_hash, local_receipt_id,
            outcome, accepted_business_truth, first_seen_at, acknowledged_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(consumer_id, outbox_id) DO UPDATE SET
             revision_hash = excluded.revision_hash, payload_hash = excluded.payload_hash,
             local_receipt_id = excluded.local_receipt_id, outcome = excluded.outcome,
             accepted_business_truth = excluded.accepted_business_truth, acknowledged_at = excluded.acknowledged_at`,
        ).bind(
          consumerId, delivery.outbox_id, cardRow.intent_id, delivery.revision_hash, delivery.payload_hash,
          delivery.local_receipt_id, delivery.outcome, delivery.accepted_business_truth ? 1 : 0, at, at,
        ),
        db.prepare(
          `INSERT INTO card_studio_audit_events
           (audit_id, project_id, intent_id, proposal_id, event_type, actor_class, request_id, created_at)
           VALUES (?, ?, ?, ?, 'consumer_delivery_acknowledged', 'service', ?, ?)`,
        ).bind(
          `csaud_${deps.randomUUID().replaceAll("-", "")}`, cardRow.project_id, cardRow.intent_id,
          cardRow.proposal_id, consumerId, at,
        ),
      );
    }
  }
  await db.batch(statements);
  return jsonResponse({
    feed_contract: feedContract,
    latest_feed_contract: OPERATOR_FEED_CONTRACT,
    compatible_feed_contracts: COMPATIBLE_FEED_CONTRACTS,
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
