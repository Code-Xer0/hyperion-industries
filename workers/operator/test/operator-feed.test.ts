import { describe, expect, it, vi } from "vitest";
import { createWorker } from "../src/index";
import { baseEnv, executionContext, MockD1, postJson } from "./helpers";

const TOKEN = "founder-command-test-token-with-enough-entropy";
const TOKEN_HASH = "33c6b5ba9e338f8c71a066f95ac989d89e6e7e90bb7cfa3b51e5dab17b2d90e0";
const AUTH_HEADERS = {
  authorization: `Bearer ${TOKEN}`,
  "x-hyprm-consumer": "founder-command-desktop",
};

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
      count: number;
      outbox_mutated: boolean;
      items: Array<{ payload_hash: string; outbox: { revision_hash: string }; routing: { source_lane: string; canonical_lane: string; proposal_state: string }; authority: { source_outbox_unchanged: boolean } }>;
    }>();
    expect(response.status).toBe(200);
    expect(body.count).toBe(1);
    expect(body.outbox_mutated).toBe(false);
    expect(body.items[0]?.payload_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(body.items[0]?.outbox.revision_hash).toBe(feedRow.revision_hash);
    expect(body.items[0]?.routing).toMatchObject({ source_lane: "operator-identity", canonical_lane: "identity", proposal_state: "active" });
    expect(body.items[0]?.authority.source_outbox_unchanged).toBe(true);
    expect(db.statements.every((statement) => !/UPDATE\s+intake_outbox/i.test(statement.sql))).toBe(true);
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
    const body = await response.json<{ acknowledged: Array<{ outbox_id: string; local_receipt_id: string }>; outbox_mutated: boolean }>();
    expect(response.status).toBe(200);
    expect(body.acknowledged).toEqual([{ outbox_id: feedRow.outbox_id, revision_hash: feedRow.revision_hash, local_receipt_id: "local_12345678", outcome: "received" }]);
    expect(body.outbox_mutated).toBe(false);
    expect(db.batches[0]?.some((statement) => statement.sql.includes("ON CONFLICT(consumer_id, outbox_id)"))).toBe(true);
    expect(db.statements.every((statement) => !/UPDATE\s+intake_outbox/i.test(statement.sql))).toBe(true);
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
