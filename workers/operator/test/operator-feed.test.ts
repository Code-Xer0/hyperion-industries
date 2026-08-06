import { describe, expect, it, vi } from "vitest";
import { createWorker } from "../src/index";
import { baseEnv, executionContext, MockD1, postJson } from "./helpers";

const TOKEN = "founder-command-test-token-with-enough-entropy";
const TOKEN_HASH = "33c6b5ba9e338f8c71a066f95ac989d89e6e7e90bb7cfa3b51e5dab17b2d90e0";
const AUTH_HEADERS = {
  authorization: `Bearer ${TOKEN}`,
  "x-hyprm-consumer": "founder-command-desktop",
};
const FEED_CONTRACT = "hyperion.intake.operator-feed/2.2";
const COMPATIBLE_FEED_CONTRACTS = [
  "hyperion.intake.operator-feed/2.0",
  "hyperion.intake.operator-feed/2.1",
  FEED_CONTRACT,
];

const feedRow = {
  outbox_id: "out_abcdefghijkl",
  intake_id: "int_abcdefghijkl",
  submission_id: "sub_abcdefghijkl",
  proposal_id: "prp_abcdefghijkl",
  revision_hash: "a".repeat(64),
  event_type: "intake.received.v1",
  outbox_state: "held_for_review",
  created_at: "2026-07-13T12:00:00.000Z",
  revision: 1,
  supersedes_submission_id: null,
  form_id: "operator-identity",
  form_version: "1.0.1",
  submitted_at: "2026-07-13T11:59:00.000Z",
  received_at: "2026-07-13T12:00:00.000Z",
  trace_id: "trace_abcdefghijkl",
  identity_json: JSON.stringify({ contact_name: "Sanitized Operator", email: "operator@example.test" }),
  answers_json: JSON.stringify([{ question_id: "goal", value: "Sanitized intake" }]),
  consents_json: JSON.stringify([{ consent_id: "contact", granted: true }]),
  client_context_json: JSON.stringify({ referrer_category: "direct" }),
  receipt_json: JSON.stringify({ status: "received for operator review" }),
  expires_at: "2026-10-11T12:00:00.000Z",
  decision_id: "dec_abcdefghijkl",
  input_revision_hash: "a".repeat(64),
  policy_version: "intake-rules.1.0.1",
  ruleset_version: "intake-rules.1.0.1",
  agent_contract_version: "proposal-only.1",
  analyzer_kind: "deterministic",
  analyzer_id: "hyperion-intake-router",
  analyzer_version: "proposal-only.1",
  minimized_projection_hash: "b".repeat(64),
  proposal_state: "active",
  primary_route: "operator-identity",
  classification: "PROPOSED",
  decision_json: JSON.stringify({ missing_information: [], safety_flags: [] }),
  decision_created_at: "2026-07-13T12:00:00.000Z",
  acknowledgement_template_version: "intake-received/1",
  acknowledgement_content_hash: "c".repeat(64),
  acknowledgement_provider_reference: "email_12345678",
  acknowledgement_delivery_state: "sent",
  acknowledgement_attempted_at: "2026-07-13T12:00:01.000Z",
  acknowledgement_provider_accepted_at: "2026-07-13T12:00:01.000Z",
  acknowledgement_delivered_at: null,
  acknowledgement_failed_at: null,
  acknowledgement_updated_at: "2026-07-13T12:00:01.000Z",
  acknowledgement_error_code: null,
};

const cardFeedRow = {
  outbox_id: "cso_abcdefghijkl",
  proposal_id: "cdp_abcdefghijkl",
  intent_id: "coi_abcdefghijkl",
  revision_hash: "c".repeat(64),
  event_type: "card_studio.proposal_staged.v1",
  outbox_state: "held_for_review",
  created_at: "2026-07-13T12:01:00.000Z",
  project_id: "csp_abcdefghijkl",
  revision_id: "csr_abcdefghijkl",
  product_sku: "card_pvc_standard",
  quantity: 1,
  catalog_version: "card-catalog.2026-07-27",
  eligibility: "instant_checkout_eligible",
  order_status: "proposal_staged",
  proposal_json: JSON.stringify({
    contract_version: "card-design-proposal/1",
    proposal_id: "cdp_abcdefghijkl",
    proof_refs: ["proof_abcdefgh"],
    warnings: [],
    authority: "operator_review_only",
  }),
  proposal_state: "active",
};

function operatorEnv(db: MockD1) {
  return baseEnv({
    DB: db.binding(),
    FOUNDER_COMMAND_PULL_KEY_ID: "fc-intake-test",
    FOUNDER_COMMAND_PULL_TOKEN_SHA256: TOKEN_HASH,
  });
}

describe("Founder Command operator intake feed", () => {
  it("fails closed for missing or invalid service authentication", async () => {
    const db = new MockD1();
    const worker = createWorker();
    const { ctx } = executionContext();
    const missing = await worker.fetch(
      new Request("https://hyperion-industries.dev/api/intake/operator/feed"),
      operatorEnv(db),
      ctx,
    );
    const invalid = await worker.fetch(
      new Request("https://hyperion-industries.dev/api/intake/operator/feed", {
        headers: { ...AUTH_HEADERS, authorization: "Bearer wrong-token" },
      }),
      operatorEnv(db),
      ctx,
    );
    expect(missing.status).toBe(401);
    expect(invalid.status).toBe(401);
    expect(db.statements).toHaveLength(0);
  });

  it("accepts the previous token only inside the bounded rotation overlap", async () => {
    const db = new MockD1().queueAll([]);
    const env = operatorEnv(db);
    env.FOUNDER_COMMAND_PULL_TOKEN_SHA256 = "b".repeat(64);
    env.FOUNDER_COMMAND_PULL_PREVIOUS_TOKEN_SHA256 = TOKEN_HASH;
    env.FOUNDER_COMMAND_PULL_PREVIOUS_UNTIL = "2026-07-13T12:10:00.000Z";
    const worker = createWorker({ now: () => new Date("2026-07-13T12:05:00.000Z") });
    const response = await worker.fetch(
      new Request("https://hyperion-industries.dev/api/intake/operator/feed", { headers: AUTH_HEADERS }),
      env,
      executionContext().ctx,
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ key_id: "fc-intake-test", key_version: "previous" });
  });

  it("advertises a versioned transport-only contract without Founder workflow state", async () => {
    const db = new MockD1().queueFirst({ count: 1 });
    const response = await createWorker().fetch(
      new Request("https://hyperion-industries.dev/api/intake/operator/status", { headers: AUTH_HEADERS }),
      operatorEnv(db),
      executionContext().ctx,
    );
    const body = await response.json<{
      feed_contract: string;
      authority: string;
      transport: Record<string, unknown>;
    }>();

    expect(response.status).toBe(200);
    expect(body.feed_contract).toBe(FEED_CONTRACT);
    expect(body).toMatchObject({ compatible_feed_contracts: COMPATIBLE_FEED_CONTRACTS });
    expect(body.authority).toBe("transport_delivery_only");
    expect(body.transport).toEqual({
      authority: "worker_delivery_outbox",
      source_outbox_state: "held_for_review",
      source_outbox_mutation_allowed: false,
      acknowledgement_scope: "transport_receipt_only",
      business_review_state_included: false,
      replay: "until_transport_acknowledged",
      ordering: ["created_at", "outbox_id"],
      max_page_items: 100,
      compatible_feed_contracts: COMPATIBLE_FEED_CONTRACTS,
    });
    expect(body).not.toHaveProperty("owner");
    expect(body).not.toHaveProperty("sla");
    expect(body).not.toHaveProperty("approval");
    expect(body).not.toHaveProperty("promotion");
  });

  it("returns immutable revisions with normalized and source lane values", async () => {
    const db = new MockD1().queueAll([feedRow]);
    const worker = createWorker();
    const { ctx } = executionContext();
    const response = await worker.fetch(
      new Request("https://hyperion-industries.dev/api/intake/operator/feed?limit=25", { headers: AUTH_HEADERS }),
      operatorEnv(db),
      ctx,
    );
    const body = await response.json<{
      feed_contract: string;
      count: number;
      outbox_mutated: boolean;
      transport: Record<string, unknown>;
      items: Array<{
        feed_contract: string;
        payload_hash: string;
        outbox: { revision_hash: string; state: string; state_scope: string };
        routing: { source_lane: string; canonical_lane: string; proposal_state: string };
        authority: {
          source_outbox_unchanged: boolean;
          acknowledgement_scope: string;
          business_review_state_included: boolean;
        };
        acknowledgement_delivery: {
          state: string;
          template_version: string;
          content_hash: string;
          recipient_included: boolean;
          rendered_content_included: boolean;
        };
      }>;
    }>();
    expect(response.status).toBe(200);
    expect(body.feed_contract).toBe(FEED_CONTRACT);
    expect(body.count).toBe(1);
    expect(body.outbox_mutated).toBe(false);
    expect(body.transport).toMatchObject({
      authority: "worker_delivery_outbox",
      source_outbox_state: "held_for_review",
      source_outbox_mutation_allowed: false,
      acknowledgement_scope: "transport_receipt_only",
      business_review_state_included: false,
    });
    expect(body.items[0]?.feed_contract).toBe(FEED_CONTRACT);
    expect(body.items[0]?.payload_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(body.items[0]?.outbox).toMatchObject({
      revision_hash: feedRow.revision_hash,
      state: "held_for_review",
      state_scope: "worker_delivery_outbox",
    });
    expect(body.items[0]?.routing).toMatchObject({ source_lane: "operator-identity", canonical_lane: "identity", proposal_state: "active" });
    expect(body.items[0]?.authority).toMatchObject({
      source_outbox_unchanged: true,
      acknowledgement_scope: "transport_receipt_only",
      business_review_state_included: false,
    });
    expect(body.items[0]?.acknowledgement_delivery).toEqual({
      scope: "deterministic_intake_receipt",
      template_version: "intake-received/1",
      content_hash: "c".repeat(64),
      provider_reference: "email_12345678",
      state: "sent",
      attempted_at: "2026-07-13T12:00:01.000Z",
      provider_accepted_at: "2026-07-13T12:00:01.000Z",
      delivered_at: null,
      failed_at: null,
      updated_at: "2026-07-13T12:00:01.000Z",
      error_code: null,
      recipient_included: false,
      rendered_content_included: false,
    });
    expect(body.items[0]).not.toHaveProperty("owner");
    expect(body.items[0]).not.toHaveProperty("sla");
    expect(body.items[0]).not.toHaveProperty("review_state");
    expect(body.items[0]).not.toHaveProperty("approval");
    expect(body.items[0]).not.toHaveProperty("promotion");
    expect(JSON.stringify(body.transport)).not.toContain("operator@example.test");
    expect(JSON.stringify(body.transport)).not.toContain("Sanitized intake");
    expect(JSON.stringify(body.items[0]?.acknowledgement_delivery)).not.toContain("operator@example.test");
    expect(db.statements.every((statement) => !/UPDATE\s+intake_outbox/i.test(statement.sql))).toBe(true);
  });

  it("down-negotiates feed and acknowledgement hashes for 2.0 and 2.1 consumers", async () => {
    for (const legacyContract of COMPATIBLE_FEED_CONTRACTS.slice(0, 2)) {
      const db = new MockD1().queueAll([feedRow]);
      const headers = { ...AUTH_HEADERS, "x-hyperion-feed-contract": legacyContract };
      const worker = createWorker({
        now: () => new Date("2026-07-13T12:05:00.000Z"),
        randomUUID: () => "12345678-1234-4234-8234-123456789abc",
      });
      const feedResponse = await worker.fetch(
        new Request("https://hyperion-industries.dev/api/intake/operator/feed", { headers }),
        operatorEnv(db),
        executionContext().ctx,
      );
      const feed = await feedResponse.json<{
        feed_contract: string;
        latest_feed_contract: string;
        items: Array<Record<string, unknown> & { payload_hash: string }>;
      }>();

      expect(feed.feed_contract).toBe(legacyContract);
      expect(feed.latest_feed_contract).toBe(FEED_CONTRACT);
      expect(feed.items[0]?.feed_contract).toBe(legacyContract);
      expect(feed.items[0]).not.toHaveProperty("acknowledgement_delivery");

      db.queueFirst(feedRow);
      const acknowledgement = await worker.fetch(
        postJson("/api/intake/operator/ack", {
          deliveries: [{
            outbox_id: feedRow.outbox_id,
            revision_hash: feedRow.revision_hash,
            payload_hash: feed.items[0]?.payload_hash,
            local_receipt_id: `local_${legacyContract.endsWith("2.0") ? "20" : "21"}_123456`,
            outcome: "received",
            accepted_business_truth: false,
          }],
        }, headers),
        operatorEnv(db),
        executionContext().ctx,
      );
      expect(acknowledgement.status).toBe(200);
      expect(await acknowledgement.json()).toMatchObject({
        feed_contract: legacyContract,
        latest_feed_contract: FEED_CONTRACT,
        outbox_mutated: false,
      });
    }
  });

  it("rejects unsupported feed contract negotiation before reading D1", async () => {
    const db = new MockD1();
    const response = await createWorker().fetch(
      new Request("https://hyperion-industries.dev/api/intake/operator/feed", {
        headers: { ...AUTH_HEADERS, "x-hyperion-feed-contract": "hyperion.intake.operator-feed/9.9" },
      }),
      operatorEnv(db),
      executionContext().ctx,
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code: "unsupported_feed_contract" } });
    expect(db.statements).toHaveLength(0);
  });

  it("keeps feed pages bounded by the contract limit", async () => {
    const db = new MockD1();
    const response = await createWorker().fetch(
      new Request("https://hyperion-industries.dev/api/intake/operator/feed?limit=101", { headers: AUTH_HEADERS }),
      operatorEnv(db),
      executionContext().ctx,
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code: "invalid_limit" } });
    expect(db.statements).toHaveLength(0);
  });

  it("acknowledges delivery idempotently without changing the business outbox", async () => {
    const db = new MockD1().queueAll([feedRow]);
    const worker = createWorker({
      now: () => new Date("2026-07-13T12:05:00.000Z"),
      randomUUID: () => "12345678-1234-4234-8234-123456789abc",
    });
    const { ctx } = executionContext();
    const feedResponse = await worker.fetch(
      new Request("https://hyperion-industries.dev/api/intake/operator/feed", { headers: AUTH_HEADERS }),
      operatorEnv(db),
      ctx,
    );
    const feed = await feedResponse.json<{ items: Array<{ payload_hash: string }> }>();
    db.queueFirst(feedRow);
    const response = await worker.fetch(
      postJson("/api/intake/operator/ack", {
        deliveries: [{
          outbox_id: feedRow.outbox_id,
          revision_hash: feedRow.revision_hash,
          payload_hash: feed.items[0]?.payload_hash,
          local_receipt_id: "local_12345678",
          outcome: "received",
          accepted_business_truth: false,
        }],
      }, AUTH_HEADERS),
      operatorEnv(db),
      ctx,
    );
    const body = await response.json<{
      feed_contract: string;
      acknowledged: Array<{ outbox_id: string; local_receipt_id: string }>;
      outbox_mutated: boolean;
      transport: Record<string, unknown>;
    }>();
    expect(response.status).toBe(200);
    expect(body.feed_contract).toBe(FEED_CONTRACT);
    expect(body).toMatchObject({ compatible_feed_contracts: COMPATIBLE_FEED_CONTRACTS });
    expect(body.acknowledged).toEqual([{ outbox_id: feedRow.outbox_id, revision_hash: feedRow.revision_hash, local_receipt_id: "local_12345678", outcome: "received" }]);
    expect(body.outbox_mutated).toBe(false);
    expect(db.batches[0]?.some((statement) => statement.sql.includes("ON CONFLICT(consumer_id, outbox_id)"))).toBe(true);
    expect(body.transport).toEqual({
      authority: "consumer_delivery_receipt",
      acknowledgement_scope: "transport_receipt_only",
      accepted_business_truth: false,
      source_outbox_mutation_allowed: false,
      business_review_state_included: false,
    });
    expect(db.batches[0]?.some((statement) => statement.sql.includes("INSERT INTO intake_consumer_receipts"))).toBe(true);
    expect(db.statements.every((statement) => !/UPDATE\s+intake_consumer_receipts/i.test(statement.sql))).toBe(true);
    expect(db.statements.every((statement) => !/UPDATE\s+intake_outbox/i.test(statement.sql))).toBe(true);
  });

  it("delivers minimized Card Studio proposals and records receipts without mutating their source outbox", async () => {
    const db = new MockD1().queueAll([], [cardFeedRow]);
    const worker = createWorker({
      now: () => new Date("2026-07-13T12:05:00.000Z"),
      randomUUID: () => "12345678-1234-4234-8234-123456789abc",
    });
    const response = await worker.fetch(
      new Request("https://hyperion-industries.dev/api/intake/operator/feed", { headers: AUTH_HEADERS }),
      operatorEnv(db),
      executionContext().ctx,
    );
    const feed = await response.json<{
      items: Array<{
        source_kind: string;
        payload_hash: string;
        card_studio: { intent_id: string; artifact_policy: string; binary_artifacts: unknown[] };
        authority: { checkout_created: boolean; source_outbox_unchanged: boolean };
      }>;
    }>();
    expect(response.status).toBe(200);
    expect(feed.items[0]).toMatchObject({
      source_kind: "card_studio",
      card_studio: {
        intent_id: cardFeedRow.intent_id,
        artifact_policy: "opaque_references_only",
        binary_artifacts: [],
      },
      authority: { checkout_created: false, source_outbox_unchanged: true },
    });

    db.queueFirst(null, cardFeedRow);
    const ack = await worker.fetch(
      postJson("/api/intake/operator/ack", {
        deliveries: [{
          outbox_id: cardFeedRow.outbox_id,
          revision_hash: cardFeedRow.revision_hash,
          payload_hash: feed.items[0]?.payload_hash,
          local_receipt_id: "local_card_1234",
          outcome: "received",
          accepted_business_truth: false,
        }],
      }, AUTH_HEADERS),
      operatorEnv(db),
      executionContext().ctx,
    );
    expect(ack.status).toBe(200);
    const sql = db.batches.at(-1)?.map((statement) => statement.sql).join("\n") ?? "";
    expect(sql).toContain("INSERT INTO card_studio_consumer_receipts");
    expect(sql).not.toMatch(/UPDATE\s+card_studio_proposal_outbox/i);
    expect(db.statements.every((statement) => !/UPDATE\s+(?:intake_outbox|card_studio_proposal_outbox)/i.test(statement.sql))).toBe(true);
  });

  it("rejects a quarantined conflict that claims accepted business truth", async () => {
    const db = new MockD1();
    const response = await createWorker().fetch(
      postJson("/api/intake/operator/ack", {
        deliveries: [{
          outbox_id: feedRow.outbox_id,
          revision_hash: feedRow.revision_hash,
          payload_hash: "c".repeat(64),
          local_receipt_id: "local_12345678",
          outcome: "conflict_quarantined",
          accepted_business_truth: true,
        }],
      }, AUTH_HEADERS),
      operatorEnv(db),
      executionContext().ctx,
    );
    expect(response.status).toBe(400);
    expect(db.batch).not.toHaveBeenCalled();
  });

  it("keeps credentials and intake payloads out of request logs", async () => {
    const db = new MockD1().queueAll([]);
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const worker = createWorker();
    const { ctx } = executionContext();
    await worker.fetch(
      new Request("https://hyperion-industries.dev/api/intake/operator/feed", { headers: AUTH_HEADERS }),
      operatorEnv(db),
      ctx,
    );
    const logs = info.mock.calls.flat().join("\n");
    expect(logs).not.toContain(TOKEN);
    expect(logs).not.toContain("operator@example.test");
    expect(logs).not.toContain("Sanitized intake");
  });
});
