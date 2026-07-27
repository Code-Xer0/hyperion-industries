import { describe, expect, it, vi } from "vitest";
import { evaluateCardEligibility } from "../src/card-studio";
import { createWorker } from "../src/index";
import { baseEnv, executionContext, MockD1, postJson } from "./helpers";
import { designFixture, orderFixture } from "./card-fixtures";

const UUID = "12345678-1234-4234-8234-123456789abc";
const SESSION = "css_12345678123442348234123456789abc";
const PROJECT = "csp_abcdefghijkl";
const REVISION = "csr_abcdefghijkl";
const TOKEN = "founder-command-test-token-with-enough-entropy";
const TOKEN_HASH = "33c6b5ba9e338f8c71a066f95ac989d89e6e7e90bb7cfa3b51e5dab17b2d90e0";

async function digest(value: string): Promise<string> {
  const result = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(result), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function projectRow(overrides: Record<string, unknown> = {}) {
  return {
    project_id: PROJECT,
    account_ref: "acct_abcdefgh",
    session_hash: await digest(SESSION),
    status: "draft",
    latest_revision: 0,
    updated_at: "2026-07-27T12:00:00.000Z",
    ...overrides,
  };
}

function cardEnv(db: MockD1) {
  return baseEnv({
    DB: db.binding(),
    CARD_STUDIO_RATE_LIMITER: { limit: vi.fn(async () => ({ success: true })) },
    CARD_STUDIO_INVITE_REQUIRED: "false",
  });
}

function cardRequest(path: string, value: unknown, idempotency?: string): Request {
  return postJson(path, value, {
    "x-card-session": SESSION,
    ...(idempotency ? { "idempotency-key": idempotency } : {}),
  });
}

function worker() {
  return createWorker({
    randomUUID: () => UUID,
    now: () => new Date("2026-07-27T12:00:00.000Z"),
  });
}

describe("Card Studio public order spine", () => {
  it("returns the versioned nonbinding catalog", async () => {
    const response = await worker().fetch(
      new Request("https://hyperion-industries.dev/api/card-studio/catalog"),
      baseEnv(),
      executionContext().ctx,
    );
    const body = await response.json<Record<string, unknown>>();
    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      contract_version: "card-catalog/1",
      release_state: "invite_only",
      authority: "catalog_estimate_only",
      checkout_created: false,
    });
  });

  it("creates a private project session without exposing the stored hash", async () => {
    const db = new MockD1();
    const response = await worker().fetch(
      postJson("/api/card-studio/projects", { account_ref: "acct_abcdefgh" }),
      cardEnv(db),
      executionContext().ctx,
    );
    const body = await response.json<{
      project: { project_id: string };
      session_token: string;
      session_token_returned_once: boolean;
    }>();
    expect(response.status).toBe(201);
    expect(body.project.project_id).toMatch(/^csp_/);
    expect(body.session_token).toMatch(/^css_/);
    expect(body.session_token_returned_once).toBe(true);
    expect(JSON.stringify(body)).not.toContain("session_hash");
    expect(db.batches[0]?.some((statement) => statement.sql.includes("INSERT INTO card_studio_projects"))).toBe(true);
  });

  it("stores immutable declarative design revisions", async () => {
    const db = new MockD1().queueFirst(await projectRow());
    const response = await worker().fetch(
      cardRequest(`/api/card-studio/projects/${PROJECT}/revisions`, designFixture({ project_id: PROJECT })),
      cardEnv(db),
      executionContext().ctx,
    );
    const body = await response.json<{ revision: { revision_id: string; revision: number; revision_hash: string } }>();
    expect(response.status).toBe(201);
    expect(body.revision.revision_id).toMatch(/^csr_/);
    expect(body.revision.revision).toBe(1);
    expect(body.revision.revision_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(db.batches[0]?.some((statement) => statement.sql.includes("INSERT INTO card_studio_design_revisions"))).toBe(true);
  });

  it("routes preflight-safe fixed SKUs to the eligible lane and everything uncertain to review", () => {
    const fixed = orderFixture() as Parameters<typeof evaluateCardEligibility>[0];
    const cleanDesign = designFixture() as Parameters<typeof evaluateCardEligibility>[1];
    expect(evaluateCardEligibility(fixed, cleanDesign)).toMatchObject({
      outcome: "instant_checkout_eligible",
      reasons: [],
      subtotalAmount: 3900,
    });
    expect(evaluateCardEligibility(
      { ...fixed, quantity: 40 },
      { ...cleanDesign, template_id: "blank_guarded", asset_refs: ["csa_abcdefghijkl"] },
    )).toMatchObject({ outcome: "review_required" });
    expect(evaluateCardEligibility(
      { ...fixed, product_sku: "card_team_custom" },
      { ...cleanDesign, product_sku: "card_team_custom" },
    ).reasons).toContain("sku_requires_proposal");
  });

  it("atomically stages an order, proposal, immutable outbox event, and no checkout", async () => {
    const design = designFixture({ project_id: PROJECT });
    const revisionHash = await digest(JSON.stringify(design));
    const revisionRow = {
      revision_id: REVISION,
      project_id: PROJECT,
      revision: 1,
      document_json: JSON.stringify(design),
      document_hash: revisionHash,
      created_at: "2026-07-27T12:00:00.000Z",
    };
    const db = new MockD1().queueFirst(await projectRow({ latest_revision: 1 }), null, null, revisionRow);
    const response = await worker().fetch(
      cardRequest(
        `/api/card-studio/projects/${PROJECT}/submit`,
        orderFixture({ project_id: PROJECT, revision_id: REVISION }),
        "card-submit-abcdefghijkl",
      ),
      cardEnv(db),
      executionContext().ctx,
    );
    const body = await response.json<{ receipt: { eligibility: string; not_a_quote: boolean; checkout_created: boolean } }>();
    expect(response.status).toBe(201);
    expect(body.receipt).toMatchObject({
      eligibility: "instant_checkout_eligible",
      not_a_quote: true,
      checkout_created: false,
    });
    const sql = db.batches[0]?.map((statement) => statement.sql).join("\n") ?? "";
    expect(sql).toContain("INSERT INTO card_studio_order_intents");
    expect(sql).toContain("INSERT INTO card_studio_design_proposals");
    expect(sql).toContain("INSERT INTO card_studio_proposal_outbox");
    expect(sql).toContain("'held_for_review'");
    expect(sql).not.toMatch(/UPDATE\s+card_studio_proposal_outbox/i);
  });

  it("returns an idempotent receipt without creating a second proposal", async () => {
    const receipt = { intent_id: "coi_existingrecord", status: "received for operator review" };
    const db = new MockD1().queueFirst(
      await projectRow(),
      { intent_id: "coi_existingrecord", payload_hash: "a".repeat(64), receipt_json: JSON.stringify(receipt) },
    );
    const response = await worker().fetch(
      cardRequest(
        `/api/card-studio/projects/${PROJECT}/submit`,
        orderFixture({ project_id: PROJECT, revision_id: REVISION }),
        "card-submit-duplicate-key",
      ),
      cardEnv(db),
      executionContext().ctx,
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ duplicate: true, receipt });
    expect(db.batch).not.toHaveBeenCalled();
  });

  it("quarantines conflicting intent identifiers and never emits another outbox event", async () => {
    const db = new MockD1().queueFirst(
      await projectRow(),
      null,
      { intent_id: "coi_abcdefghijkl", payload_hash: "f".repeat(64), receipt_json: "{}" },
    );
    const response = await worker().fetch(
      cardRequest(
        `/api/card-studio/projects/${PROJECT}/submit`,
        orderFixture({ project_id: PROJECT, revision_id: REVISION }),
        "card-submit-conflict-key",
      ),
      cardEnv(db),
      executionContext().ctx,
    );
    expect(response.status).toBe(409);
    const sql = db.batches[0]?.map((statement) => statement.sql).join("\n") ?? "";
    expect(sql).toContain("INSERT INTO card_studio_revision_conflicts");
    expect(sql).not.toContain("card_studio_proposal_outbox");
  });

  it("fails closed for upload metadata when quarantine or scanning is unavailable", async () => {
    const db = new MockD1().queueFirst(await projectRow());
    const response = await worker().fetch(
      cardRequest("/api/card-studio/uploads/sessions", {
        contract_version: "card-upload-session/1",
        project_id: PROJECT,
        filename: "mark.png",
        content_type: "image/png",
        byte_length: 1024,
        sha256: "a".repeat(64),
      }),
      cardEnv(db),
      executionContext().ctx,
    );
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: { code: "secure_upload_unavailable" } });
    expect(db.statements.every((statement) => !statement.sql.includes("card_studio_upload_sessions"))).toBe(true);
  });

  it("rejects arbitrary binary bodies from Card Studio intake endpoints", async () => {
    const request = new Request("https://hyperion-industries.dev/api/card-studio/uploads/sessions", {
      method: "POST",
      headers: {
        "content-type": "application/octet-stream",
        origin: "https://hyperion-industries.dev",
        "sec-fetch-site": "same-origin",
      },
      body: new Uint8Array([1, 2, 3]),
    });
    const response = await worker().fetch(request, cardEnv(new MockD1()), executionContext().ctx);
    expect(response.status).toBe(415);
  });
});

describe("Card Studio operator decisions", () => {
  function operatorEnv(db: MockD1) {
    return {
      ...cardEnv(db),
      FOUNDER_COMMAND_PULL_KEY_ID: "fc-card-test",
      FOUNDER_COMMAND_PULL_TOKEN_SHA256: TOKEN_HASH,
    };
  }

  function commandRequest(decision: string) {
    return postJson("/api/card-studio/operator/decisions", {
      contract_version: "card-order-command/1",
      command_id: "coc_abcdefghijkl",
      proposal_id: "cdp_abcdefghijkl",
      intent_id: "coi_abcdefghijkl",
      revision_hash: "a".repeat(64),
      decision,
      reason_code: "operator_reviewed",
      issued_at: "2026-07-27T12:00:00.000Z",
    }, {
      authorization: `Bearer ${TOKEN}`,
      "x-hyprm-consumer": "founder-command-desktop",
    });
  }

  it("stages checkout only through an authenticated revision-bound command", async () => {
    const db = new MockD1().queueFirst(null, {
      proposal_id: "cdp_abcdefghijkl",
      intent_id: "coi_abcdefghijkl",
      revision_hash: "a".repeat(64),
      eligibility: "instant_checkout_eligible",
      proposal_state: "active",
    });
    const response = await worker().fetch(
      commandRequest("release_checkout"),
      operatorEnv(db),
      executionContext().ctx,
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      checkout_projection_staged: true,
      shopify_network_called: false,
      source_outbox_mutated: false,
    });
    const sql = db.batches[0]?.map((statement) => statement.sql).join("\n") ?? "";
    expect(sql).toContain("INSERT INTO card_studio_order_commands");
    expect(sql).toContain("UPDATE card_studio_checkout_projections");
    expect(sql).not.toMatch(/UPDATE\s+card_studio_proposal_outbox/i);
  });

  it("rejects checkout release for review-required proposals", async () => {
    const db = new MockD1().queueFirst(null, {
      proposal_id: "cdp_abcdefghijkl",
      intent_id: "coi_abcdefghijkl",
      revision_hash: "a".repeat(64),
      eligibility: "review_required",
      proposal_state: "active",
    });
    const response = await worker().fetch(
      commandRequest("release_checkout"),
      operatorEnv(db),
      executionContext().ctx,
    );
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: { code: "checkout_not_eligible" } });
    expect(db.batch).not.toHaveBeenCalled();
  });

  it("requires service authentication for operator mutation", async () => {
    const response = await worker().fetch(
      postJson("/api/card-studio/operator/decisions", {
        contract_version: "card-order-command/1",
      }),
      cardEnv(new MockD1()),
      executionContext().ctx,
    );
    expect(response.status).toBe(401);
  });
});
