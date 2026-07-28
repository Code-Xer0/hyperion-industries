import { describe, expect, it } from "vitest";
import migration from "../migrations/0005_card_studio_v1.sql?raw";

describe("Card Studio D1 migration", () => {
  it("creates the immutable design, order, proposal, delivery, upload, and webhook spine", () => {
    for (const table of [
      "card_studio_accounts",
      "card_studio_invites",
      "card_studio_projects",
      "card_studio_design_revisions",
      "card_studio_order_intents",
      "card_studio_design_proposals",
      "card_studio_proposal_outbox",
      "card_studio_consumer_receipts",
      "card_studio_revision_conflicts",
      "card_studio_order_commands",
      "card_studio_checkout_projections",
      "card_studio_upload_sessions",
      "card_studio_webhook_receipts",
      "card_studio_audit_events",
    ]) {
      expect(migration).toContain(`CREATE TABLE IF NOT EXISTS ${table}`);
    }
    expect(migration).toContain("UNIQUE (project_id, revision)");
    expect(migration).toContain("state TEXT NOT NULL CHECK (state = 'held_for_review')");
    expect(migration).not.toMatch(/CREATE\s+TABLE[^;]*card_number/is);
  });
});
