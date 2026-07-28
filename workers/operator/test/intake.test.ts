import { describe, expect, it, vi } from "vitest";
import {
  deriveForgeBuildCandidatesProjection,
  sha256CanonicalDocument,
} from "../../../shared/intake/forge-build-candidates.js";
import { createWorker } from "../src/index";
import { purgeExpiredIntake } from "../src/intake";
import type { Env, RateLimitBinding } from "../src/types";
import { allowRateLimit, baseEnv, executionContext, MockD1, postJson } from "./helpers";

const fixedNow = new Date("2026-07-13T12:00:00.000Z");
const uuid = "12345678-1234-4234-8234-123456789abc";

function worker(fetcher: typeof fetch = vi.fn(async () => new Response(JSON.stringify({ id: "email_1" }), { status: 200 }))) {
  return createWorker({ now: () => fixedNow, randomUUID: () => uuid, fetcher });
}

function requestJson(path: string, method: string, value: unknown, headers: HeadersInit = {}): Request {
  const requestHeaders = new Headers({
    "content-type": "application/json",
    origin: "https://hyperion-industries.dev",
    "sec-fetch-site": "same-origin",
    "cf-connecting-ip": "203.0.113.10",
    "user-agent": "intake-worker-test",
  });
  new Headers(headers).forEach((headerValue, headerName) => requestHeaders.set(headerName, headerValue));
  if (method === "GET") {
    return new Request(`https://hyperion-industries.dev${path}`, { method, headers: requestHeaders });
  }
  return new Request(`https://hyperion-industries.dev${path}`, {
    method,
    headers: requestHeaders,
    body: JSON.stringify(value),
  });
}

// Flexible fixture builder: individual rejection tests intentionally mutate schema shapes.
function validSubmission(formId: string, answers: Record<string, unknown> = {}): any {
  const at = fixedNow.toISOString();
  return {
    intake_id: "int_abcdefghijkl",
    session_id: "ses_abcdefghijkl",
    submission_id: `sub_${formId.replace(/[^a-z]/g, "").padEnd(12, "x")}`,
    revision: 1,
    supersedes_submission_id: null,
    form_id: formId,
    form_version: "1.0.1",
    locale: "en-US",
    submitted_at: at,
    trace_id: "trace-abcdefghijkl",
    client_reviewed: true,
    identity: { contact_name: "A Client", email: "client@example.com", organization: null, phone: null },
    answers: Object.entries({ signal_summary: "A clear operating signal", ...answers }).map(([question_id, value]) => ({
      question_id, value, answered_at: at, source: "client", data_classification: "public",
    })),
    artifacts: [],
    consents: [
      { consent_id: "process_intake", notice_version: "1.0.1", granted: true, recorded_at: at },
      { consent_id: "automated_classification", notice_version: "1.0.1", granted: true, recorded_at: at },
    ],
    client_context: { entry_url: "https://hyperion-industries.dev/intake", effects_mode: "static", save_resume_used: false },
  };
}

async function validForgeConfiguratorSubmission(): Promise<any> {
  const submission = validSubmission("forge-configurator", {
    "forge.system_type": "desktop",
    "forge.outcome": "Play and create locally",
    "forge.local_first": "yes",
    "forge.budget": "2500_4000",
    "forge.timeline": "flexible",
  });
  const guideBundleHash = "a".repeat(64);
  const requirements = {
    schema_version: "forge-requirements/1",
    source: "forge-guide-session/1",
    workload_profile: "gaming",
    operational_lane: "fast_validated",
    workload_refs: ["fortnite"],
    budget: { currency: "USD" as const, parts_ceiling_minor: 400000 },
    cooling_mode: "any" as const,
    allowed_motherboard_form_factors: ["Micro-ATX", "ATX"],
    fresh_offer_required: true,
    unknown_policy: "review",
    required_parts: [],
    excluded_parts: [],
    priorities: {
      workload_fit: 5, cost: 4, power_headroom: 3, evidence: 5,
      serviceability: 4, compactness: 5, upgradeability: 2, acoustics: 2,
    },
    inference: [{ field: "workload_profile", reason_code: "destination_mapping", confidence_basis_points: 9000 }],
    unresolved: [{ field: "output_target", reason_code: "requires_clarification" }],
    operator_notes: [],
    requested_counterfactuals: ["smaller"],
  };
  const requirementsWithHash = {
    ...requirements,
    projection_hash: await sha256CanonicalDocument(requirements),
  };
  const buildCandidates = await deriveForgeBuildCandidatesProjection({
    guide_bundle_hash: guideBundleHash,
    requirements_projection: requirementsWithHash,
    generated_at: fixedNow.toISOString(),
  });
  submission.form_version = "2.0.0";
  submission.client_context = {
    ...submission.client_context,
    guide_mode: "express",
    guide_bundle_hash: guideBundleHash,
    question_graph_version: "forge-concierge-2026.07-v1",
    guide_session_hash: "b".repeat(64),
    recommendation_reason_codes: ["destination.gaming", "counterfactual.smaller"],
    unresolved_items: ["output_target"],
    requested_counterfactuals: ["smaller"],
    guide_requirements_projection: requirementsWithHash,
    guide_build_candidates_projection: buildCandidates,
  };
  return submission;
}

const laneFixtures = [
  ["forge", { desired_outcome: "Build a local system", build_surface: "software", local_first: "yes", integration_count: "1-2", constraints: "Local custody" }],
  ["pandora", { deployment_goal: "Private compute", site_control: "yes", power_network_readiness: "documented", regulated_environment: "no", onsite_sponsor: "yes" }],
  ["continuity", { continuity_scope: "Records", current_state: "Local files", recovery_priority: "Handoff" }],
  ["operator-identity", { identity_use: "Prove membership", credential_type: "hybrid", audience: "Partners", issuance_scale: "2-25" }],
  ["support", { impact: "degraded", existing_client: "no", affected_surface: "Public site", safe_summary: "Slow response" }],
  ["relationships", { relationship_type: "partner", shared_outcome: "Joint delivery" }],
  ["general", { signal_summary: "A general request", outcome_needed: "A useful next step" }],
] as const;

describe("intake evaluation and submission", () => {
  for (const [lane, answers] of laneFixtures) {
    it(`evaluates the ${lane} lane deterministically`, async () => {
      const response = await worker().fetch(
        postJson("/api/intake/evaluate", { lane, answers, automated_classification: true }),
        baseEnv(), executionContext().ctx,
      );
      expect(response.status).toBe(200);
      const body = await response.json() as { decision: { primary_route: string; evidence: unknown[]; authority_boundary: string } };
      expect(body.decision.primary_route).toBe(lane);
      expect(body.decision.evidence.length).toBeGreaterThan(0);
      expect(body.decision.authority_boundary).toBe("operator_review_only");
    });
  }

  it("rejects invalid lane and answer fixtures", async () => {
    const invalidLane = await worker().fetch(postJson("/api/intake/evaluate", { lane: "payments", answers: {} }), baseEnv(), executionContext().ctx);
    const invalidAnswers = await worker().fetch(postJson("/api/intake/evaluate", { lane: "general", answers: [] }), baseEnv(), executionContext().ctx);
    expect(invalidLane.status).toBe(400);
    expect(invalidAnswers.status).toBe(400);
  });

  it("applies Forge FX, Pandora PX, and the Support safety gate", async () => {
    const cases = [
      ["forge", { desired_outcome: "Build", build_surface: "unknown", local_first: "unknown", constraints: "" }, "FX", "forge"],
      ["pandora", { site_control: "unknown", power_network_readiness: "unknown", onsite_sponsor: "unknown" }, "PX", "pandora"],
      ["support", { impact: "security_or_data_loss" }, "S0", "support"],
    ] as const;
    for (const [lane, answers, classification, route] of cases) {
      const response = await worker().fetch(postJson("/api/intake/evaluate", { lane, answers }), baseEnv(), executionContext().ctx);
      const body = await response.json() as { decision: { classification: string; primary_route: string; review_priority: string } };
      expect(body.decision.classification).toBe(classification);
      expect(body.decision.primary_route).toBe(route);
      if (classification === "S0") expect(body.decision.review_priority).toBe("urgent");
    }
  });

  it("classifies configurator briefs without treating them as a quote or order", async () => {
    const common = {
      "forge.outcome": "Run a private local workload",
      "forge.local_first": "yes",
      "forge.budget": "4000_6500",
      "forge.timeline": "quarter",
    };
    const cases = [
      ["desktop", "forge", "F1"],
      ["creator", "forge", "F1"],
      ["local_ai", "forge", "F2"],
      ["upgrade_repair", "forge", "F0"],
      ["sim_rig", "forge", "F2"],
    ] as const;
    for (const [systemType, route, classification] of cases) {
      const response = await worker().fetch(postJson("/api/intake/evaluate", {
        lane: "forge", answers: { ...common, "forge.system_type": systemType },
      }), baseEnv(), executionContext().ctx);
      expect(await response.json()).toMatchObject({ decision: { primary_route: route, classification, authority_boundary: "operator_review_only" } });
    }

    const deployment = await worker().fetch(postJson("/api/intake/evaluate", {
      lane: "forge",
      answers: {
        ...common,
        "forge.system_type": "deployment",
        "forge.outcome": "Host a controlled local service",
        site_control: "yes",
        power_network_readiness: "documented",
        onsite_sponsor: "yes",
      },
    }), baseEnv(), executionContext().ctx);
    expect(await deployment.json()).toMatchObject({ decision: { primary_route: "pandora", classification: "P3" } });
  });

  it("skips diagnostics when automated classification is declined", async () => {
    const response = await worker().fetch(
      postJson("/api/intake/evaluate", { lane: "forge", answers: { desired_outcome: "Build" }, automated_classification: false }),
      baseEnv(), executionContext().ctx,
    );
    const body = await response.json() as { decision: { primary_route: string; classification: string; diagnostics_skipped: boolean } };
    expect(body.decision).toMatchObject({ primary_route: "general", classification: "MANUAL", diagnostics_skipped: true });
  });

  it("rejects schema violations, uploads, marketing consent, and missing contact", async () => {
    const db = new MockD1().queueFirst(null, null, null, null);
    const env = baseEnv({ DB: db.binding() });
    const badSchema = validSubmission("general");
    badSchema.trace_id = "short";
    const upload = validSubmission("general");
    upload.artifacts = [{ bad: true }];
    const marketing = validSubmission("general");
    marketing.consents.push({ consent_id: "marketing", notice_version: "1.0.1", granted: true, recorded_at: fixedNow.toISOString() });
    const missingContact = validSubmission("general");
    missingContact.identity.email = null;
    for (const [index, value] of [badSchema, upload, marketing, missingContact].entries()) {
      const response = await worker().fetch(postJson("/api/intake/submissions", value, { "idempotency-key": `invalid-fixture-${index}-123456789` }), env, executionContext().ctx);
      expect(response.status).toBe(400);
    }
  });

  it("atomically stores the submission, decision, receipt, audit, and held outbox", async () => {
    const db = new MockD1().queueFirst(null);
    const response = await worker().fetch(
      postJson("/api/intake/submissions", validSubmission("forge-build-profile", laneFixtures[0][1]), { "idempotency-key": "submit-forge-123456789" }),
      baseEnv({ DB: db.binding() }), executionContext().ctx,
    );
    expect(response.status).toBe(201);
    const body = await response.json() as { receipt: { status: string; revision_hash: string }; duplicate: boolean };
    expect(body.receipt.status).toBe("received for operator review");
    expect(body.receipt.revision_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(body.duplicate).toBe(false);
    expect(db.batches[0]).toHaveLength(4);
    expect(db.batches[0]?.some((statement) => statement.sql.includes("'held_for_review'"))).toBe(true);
    const submissionInsert = db.batches[0]?.find((statement) => statement.sql.includes("INSERT INTO intake_submissions"));
    expect(JSON.stringify(submissionInsert?.values)).not.toContain('"data_classification":"public"');
    const proposalInsert = db.batches[0]?.find((statement) => statement.sql.includes("INSERT INTO intake_routing_decisions"));
    expect(proposalInsert?.sql).toContain("minimized_projection_hash");
    expect(proposalInsert?.sql).toContain("'active'");
    const outboxInsert = db.batches[0]?.find((statement) => statement.sql.includes("INSERT INTO intake_outbox"));
    expect(outboxInsert?.sql).toContain("revision_hash");
  });

  it("routes the Forge configurator form to the durable Forge review queue", async () => {
    const db = new MockD1().queueFirst(null);
    const submission = await validForgeConfiguratorSubmission();
    const response = await worker().fetch(
      postJson("/api/intake/submissions", submission, { "idempotency-key": "submit-forge-configurator-123456" }),
      baseEnv({ DB: db.binding() }), executionContext().ctx,
    );
    expect(response.status).toBe(201);
    const decisionInsert = db.batches[0]?.find((statement) => statement.sql.includes("INSERT INTO intake_routing_decisions"));
    expect(JSON.stringify(decisionInsert?.values)).toContain('"forge"');
    expect(JSON.stringify(decisionInsert?.values)).toContain("not a quote");
    expect(JSON.stringify(decisionInsert?.values)).not.toContain('price_commit');
    const submissionInsert = db.batches[0]?.find((statement) => statement.sql.includes("INSERT INTO intake_submissions"));
    expect(JSON.stringify(submissionInsert?.values)).toContain("forge-requirements/1");
    expect(JSON.stringify(submissionInsert?.values)).not.toContain("parts_ceiling_minor\":400000,\"payment");
  });

  it("rejects a tampered Forge build candidate projection before durable intake writes", async () => {
    const db = new MockD1().queueFirst(null);
    const submission = await validForgeConfiguratorSubmission();
    submission.client_context.guide_build_candidates_projection.candidates[0].component_classes.cpu =
      "client-altered exact part";
    const response = await worker().fetch(
      postJson("/api/intake/submissions", submission, { "idempotency-key": "submit-forge-tampered-123456" }),
      baseEnv({ DB: db.binding() }),
      executionContext().ctx,
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code: "forge_build_projection_mismatch" } });
    expect(db.batches).toHaveLength(0);
  });

  it("durably quarantines a same-ID different-hash revision collision", async () => {
    const existing = { payload_hash: "a".repeat(64), receipt_json: JSON.stringify({ receipt_id: "rcp_existing" }) };
    const db = new MockD1().queueFirst(null, existing);
    const response = await worker().fetch(
      postJson("/api/intake/submissions", validSubmission("general"), { "idempotency-key": "collision-key-123456789" }),
      baseEnv({ DB: db.binding() }), executionContext().ctx,
    );
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: { code: "revision_collision_quarantined" } });
    expect(db.batches[0]).toHaveLength(2);
    expect(db.batches[0]?.[0]?.sql).toContain("INSERT INTO intake_revision_conflicts");
    expect(db.batches[0]?.[1]?.sql).toContain("revision_collision_quarantined");
  });

  it("returns the original receipt for a duplicate idempotency key", async () => {
    const receipt = { receipt_id: "rcp_existing", status: "received for operator review" };
    const db = new MockD1().queueFirst({ receipt_json: JSON.stringify(receipt) });
    const response = await worker().fetch(
      postJson("/api/intake/submissions", validSubmission("general"), { "idempotency-key": "duplicate-key-123456789" }),
      baseEnv({ DB: db.binding() }), executionContext().ctx,
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ receipt, duplicate: true });
    expect(db.batch).not.toHaveBeenCalled();
  });

  it("reports a transactional storage failure without a partial success", async () => {
    const db = new MockD1().queueFirst(null, null);
    db.batchError = new Error("rollback");
    const response = await worker().fetch(
      postJson("/api/intake/submissions", validSubmission("general"), { "idempotency-key": "rollback-key-1234567890" }),
      baseEnv({ DB: db.binding() }), executionContext().ctx,
    );
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: { code: "submission_storage_unavailable" } });
  });

  it("keeps request logs metadata-only", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    await worker().fetch(
      postJson("/api/intake/evaluate", { lane: "general", answers: { signal_summary: "secret@example.com private answer" } }),
      baseEnv(), executionContext().ctx,
    );
    expect(info.mock.calls.flat().join(" ")).not.toContain("secret@example.com");
    expect(info.mock.calls.flat().join(" ")).not.toContain("private answer");
  });
});

describe("magic links and versioned drafts", () => {
  const resumeEnv = (db: MockD1, overrides: Partial<Env> = {}) => baseEnv({
    DB: db.binding(), RESEND_API_KEY: "resend-test", INTAKE_RESUME_FROM: "signal@intake.hyperion-industries.dev", ...overrides,
  });

  it("hashes the token, sends a fragment URL through mocked Resend, and returns a neutral response", async () => {
    const db = new MockD1();
    const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.headers).toMatchObject({ "idempotency-key": expect.stringMatching(/^grt_/) });
      expect(init?.body).toContain("/intake/resume#token=");
      return new Response("{}", { status: 200 });
    }) as typeof fetch;
    const response = await worker(fetcher).fetch(
      postJson("/api/intake/resume/request", { email: "client@example.com", draft_id: "drf_abcdefghijkl" }),
      resumeEnv(db), executionContext().ctx,
    );
    expect(response.status).toBe(202);
    expect(await response.json()).not.toHaveProperty("email");
    const insert = db.statements.find((statement) => statement.sql.includes("INSERT INTO intake_magic_link_grants"));
    expect(String(insert?.values[2])).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(insert?.values)).not.toContain("client@example.com");
  });

  it("keeps email delivery failure partial and non-disclosing", async () => {
    const db = new MockD1();
    const response = await worker(vi.fn(async () => new Response("provider failed", { status: 500 }))).fetch(
      postJson("/api/intake/resume/request", { email: "client@example.com", draft_id: "drf_abcdefghijkl" }),
      resumeEnv(db), executionContext().ctx,
    );
    expect(response.status).toBe(202);
    expect(db.statements.some((statement) => statement.sql.includes("delivery_status = ?") && statement.values[0] === "failed")).toBe(true);
  });

  it("rate-limits resume requests", async () => {
    const denied: RateLimitBinding = { limit: vi.fn(async () => ({ success: false })) };
    const response = await worker().fetch(
      postJson("/api/intake/resume/request", { email: "client@example.com", draft_id: "drf_abcdefghijkl" }),
      resumeEnv(new MockD1(), { INTAKE_RESUME_RATE_LIMITER: denied }), executionContext().ctx,
    );
    expect(response.status).toBe(429);
  });

  it("exchanges a live token once and sets a secure cross-site HttpOnly cookie", async () => {
    const db = new MockD1().queueFirst({
      id: "grt_1", email_hash: "emailhash", draft_id: "drf_abcdefghijkl",
      expires_at: "2026-07-13T12:15:00.000Z", consumed_at: null, session_expires_at: null,
    });
    const response = await worker().fetch(
      postJson("/api/intake/resume/exchange", { token: "a".repeat(64) }), resumeEnv(db), executionContext().ctx,
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toMatch(/Secure; HttpOnly; SameSite=None/);
    expect(await response.json()).toMatchObject({ draft_id: "drf_abcdefghijkl" });
  });

  it("rejects expired, replayed, and raced one-time tokens", async () => {
    const rows = [
      { id: "expired", email_hash: "h", draft_id: "drf_abcdefghijkl", expires_at: "2026-07-13T11:59:00.000Z", consumed_at: null, session_expires_at: null },
      { id: "replay", email_hash: "h", draft_id: "drf_abcdefghijkl", expires_at: "2026-07-13T12:15:00.000Z", consumed_at: fixedNow.toISOString(), session_expires_at: null },
    ];
    for (const row of rows) {
      const response = await worker().fetch(postJson("/api/intake/resume/exchange", { token: "b".repeat(64) }), resumeEnv(new MockD1().queueFirst(row)), executionContext().ctx);
      expect(response.status).toBe(400);
    }
    const raced = new MockD1().queueFirst({ ...rows[1], id: "race", consumed_at: null });
    raced.runChanges.push(0);
    const racedResponse = await worker().fetch(postJson("/api/intake/resume/exchange", { token: "c".repeat(64) }), resumeEnv(raced), executionContext().ctx);
    expect(racedResponse.status).toBe(400);
  });

  it("supports cross-device readback, rejects IDOR, detects optimistic conflicts, and deletes drafts", async () => {
    const grant = { id: "grt_1", email_hash: "owner", draft_id: "drf_abcdefghijkl", expires_at: "2026-07-13T12:15:00.000Z", consumed_at: fixedNow.toISOString(), session_expires_at: "2026-08-12T12:00:00.000Z" };
    const draft = { id: "drf_abcdefghijkl", owner_hash: "owner", lane: "general", form_version: "1.0.1", payload_json: JSON.stringify({ lane: "general", answers: { signal_summary: "Recovered" } }), version: 2, updated_at: fixedNow.toISOString(), expires_at: "2026-08-12T12:00:00.000Z" };
    const cookie = { cookie: `hyperion_resume=${"d".repeat(64)}` };

    const readDb = new MockD1().queueFirst(grant, draft);
    const read = await worker().fetch(requestJson("/api/intake/drafts/drf_abcdefghijkl", "GET", null, cookie), resumeEnv(readDb), executionContext().ctx);
    expect(read.status).toBe(200);
    expect(await read.json()).toMatchObject({ draft: { version: 2, answers: { signal_summary: "Recovered" } } });

    const idorDb = new MockD1().queueFirst({ ...grant, draft_id: "drf_otherother12" });
    const idor = await worker().fetch(requestJson("/api/intake/drafts/drf_abcdefghijkl", "GET", null, cookie), resumeEnv(idorDb), executionContext().ctx);
    expect(idor.status).toBe(403);

    const conflictDb = new MockD1().queueFirst(grant, draft);
    conflictDb.runChanges.push(0);
    const conflict = await worker().fetch(requestJson("/api/intake/drafts/drf_abcdefghijkl", "PUT", {
      lane: "general", form_version: "1.0.1", answers: {}, identity: {}, consents: {}, effects_mode: "static", expected_version: 1,
    }, cookie), resumeEnv(conflictDb), executionContext().ctx);
    expect(conflict.status).toBe(409);

    const deleteDb = new MockD1().queueFirst(grant, draft);
    const deleted = await worker().fetch(requestJson("/api/intake/drafts/drf_abcdefghijkl", "DELETE", {}, cookie), resumeEnv(deleteDb), executionContext().ctx);
    expect(deleted.status).toBe(204);
  });

  it("enforces origin on draft writes", async () => {
    const request = requestJson("/api/intake/drafts/drf_abcdefghijkl", "PUT", {}, {
      origin: "https://attacker.example", "sec-fetch-site": "cross-site",
    });
    const response = await worker().fetch(request, resumeEnv(new MockD1()), executionContext().ctx);
    expect(response.status).toBe(403);
  });
});

describe("intake retention", () => {
  it("purges consumed or expired grants, expired drafts, and unhanded public copies", async () => {
    const db = new MockD1();
    const result = await purgeExpiredIntake(db.binding(), fixedNow);
    expect(result).toEqual({ grants: 1, drafts: 1, submissions: 1 });
    expect(db.batches[0]).toHaveLength(8);
    expect(db.batches[0]?.[7]?.sql).toContain("retention_basis IS NULL");
  });
});
