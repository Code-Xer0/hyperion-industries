import Ajv2020 from "ajv/dist/2020";
import { describe, expect, it } from "vitest";
import custodySchema from "../../../shared/intake/contracts/schemas/custody-control.schema.json";

const validate = new Ajv2020({ allErrors: true, strict: false }).compile(custodySchema);
const hash = "a".repeat(64);
const at = "2026-07-13T12:00:00.000Z";

describe("Founder Command custody control contract", () => {
  it("acknowledges each outbox record and never accepts a quarantined conflict as business truth", () => {
    const acknowledgment = {
      kind: "outbox_acknowledgment",
      outbox_id: "out_12345678",
      revision_hash: hash,
      local_receipt_id: "local_12345678",
      outcome: "conflict_quarantined",
      accepted_business_truth: false,
      acknowledged_at: at,
    };
    expect(validate(acknowledgment)).toBe(true);
    expect(validate({ ...acknowledgment, accepted_business_truth: true })).toBe(false);
  });

  it("binds a one-time approval receipt to the revision, proposal, domain, and proposed changes", () => {
    expect(validate({
      kind: "approval_receipt",
      approval_receipt_id: "apr_12345678",
      intake_id: "int_12345678",
      revision_hash: hash,
      proposal_id: "prp_12345678",
      target_domain: "crm",
      proposed_changes_hash: hash,
      binding_hash: hash,
      issued_at: at,
      expires_at: "2026-07-13T12:05:00.000Z",
      one_time: true,
    })).toBe(true);
  });

  it("whitelists Founder Command review patches and rejects source-answer mutation", () => {
    const patch = {
      kind: "review_patch",
      intake_id: "int_12345678",
      changes: { owner_id: "operator_123", review_state: "triage", tags: ["forge"] },
    };
    expect(validate(patch)).toBe(true);
    expect(validate({ ...patch, changes: { answers: [{ question_id: "secret", value: "changed" }] } })).toBe(false);
  });

  it("requires single-flight lease, proposal provenance, and rotatable credential metadata", () => {
    expect(validate({
      kind: "sync_lease",
      lease_id: "lease_12345678",
      cursor_owner: "founder_command_01",
      reason: "network_restored",
      acquired_at: at,
      expires_at: "2026-07-13T12:01:00.000Z",
      bounded_record_limit: 100,
    })).toBe(true);
    expect(validate({
      kind: "proposal_provenance",
      proposal_id: "prp_12345678",
      input_revision_hash: hash,
      policy_version: "intake-rules.1.0.1",
      analyzer_kind: "deterministic",
      analyzer_id: "hyperion-intake-router",
      analyzer_version: "proposal-only.1",
      minimized_projection_hash: hash,
      created_at: at,
      state: "active",
    })).toBe(true);
    expect(validate({
      kind: "service_token_rotation",
      key_id: "key_20260713_a",
      current_hash: hash,
      previous_hash: null,
      overlap_until: null,
      hash_algorithm: "SHA-256",
    })).toBe(true);
  });
});
