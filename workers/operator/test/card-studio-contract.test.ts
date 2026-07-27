import Ajv2020 from "ajv/dist/2020";
import { describe, expect, it } from "vitest";
import { CARD_CATALOG } from "../../../shared/card-studio/catalog";
import catalogSchema from "../../../shared/card-studio/contracts/card-catalog.v1.schema.json";
import designSchema from "../../../shared/card-studio/contracts/card-design-document.v1.schema.json";
import orderIntentSchema from "../../../shared/card-studio/contracts/card-order-intent.v1.schema.json";
import orderCommandSchema from "../../../shared/card-studio/contracts/card-order-command.v1.schema.json";
import proposalSchema from "../../../shared/card-studio/contracts/card-design-proposal.v1.schema.json";
import projectionSchema from "../../../shared/card-studio/contracts/commerce-order-projection.v1.schema.json";
import { designFixture, orderFixture } from "./card-fixtures";

const ajv = new Ajv2020({
  strict: false,
  formats: {
    "date-time": /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/,
    uri: /^(?:https:\/\/|mailto:|tel:)[^\s]+$/i,
  },
});
const at = "2026-07-27T12:00:00.000Z";
const hash = "a".repeat(64);

describe("Card Studio v1 contracts", () => {
  it("validates the canonical catalog and rejects browser-controlled checkout fields", () => {
    const validate = ajv.compile(catalogSchema);
    expect(validate(CARD_CATALOG)).toBe(true);
    expect(validate({ ...CARD_CATALOG, checkout_url: "https://evil.example" })).toBe(false);
  });

  it("accepts declarative design geometry and rejects executable/source fields", () => {
    const validate = ajv.compile(designSchema);
    expect(validate(designFixture())).toBe(true);
    expect(validate({ ...designFixture(), html: "<script>run()</script>" })).toBe(false);
    expect(validate({ ...designFixture(), source_code: "private" })).toBe(false);
    expect(validate({
      ...designFixture(),
      profile: {
        display_name: "Operator",
        headline: "",
        visibility: "public",
        links: [{ label: "Unsafe", url: "javascript:alert(1)" }],
      },
    })).toBe(false);
  });

  it("binds order intent to an immutable revision and approved proof", () => {
    const validate = ajv.compile(orderIntentSchema);
    expect(validate(orderFixture())).toBe(true);
    expect(validate({ ...orderFixture(), proof_refs: [] })).toBe(false);
    expect(validate({ ...orderFixture(), unit_amount: 1 })).toBe(false);
  });

  it("keeps proposal estimates explicitly nonbinding", () => {
    const validate = ajv.compile(proposalSchema);
    const proposal = {
      contract_version: "card-design-proposal/1",
      proposal_id: "cdp_abcdefghijkl",
      intent_id: "coi_abcdefghijkl",
      project_id: "csp_abcdefghijkl",
      revision_id: "csr_abcdefghijkl",
      revision_hash: hash,
      catalog_version: CARD_CATALOG.catalog_version,
      product_sku: "card_pvc_standard",
      quantity: 1,
      eligibility: "instant_checkout_eligible",
      estimate: { currency: "USD", unit_amount: 3900, subtotal_amount: 3900, binding: false },
      warnings: [],
      proof_refs: ["proof_abcdefgh"],
      authority: "operator_review_only",
      created_at: at,
    };
    expect(validate(proposal)).toBe(true);
    expect(validate({ ...proposal, estimate: { ...proposal.estimate, binding: true } })).toBe(false);
  });

  it("constrains operator commands and commerce projections", () => {
    const validateCommand = ajv.compile(orderCommandSchema);
    expect(validateCommand({
      contract_version: "card-order-command/1",
      command_id: "coc_abcdefghijkl",
      proposal_id: "cdp_abcdefghijkl",
      intent_id: "coi_abcdefghijkl",
      revision_hash: hash,
      decision: "release_checkout",
      reason_code: "operator_approved",
      issued_at: at,
    })).toBe(true);
    expect(validateCommand({
      contract_version: "card-order-command/1",
      command_id: "coc_abcdefghijkl",
      proposal_id: "cdp_abcdefghijkl",
      intent_id: "coi_abcdefghijkl",
      revision_hash: hash,
      decision: "charge_card",
      reason_code: "no",
      issued_at: at,
    })).toBe(false);

    const validateProjection = ajv.compile(projectionSchema);
    expect(validateProjection({
      contract_version: "commerce-order-projection/1",
      projection_id: "cop_abcdefghijkl",
      intent_id: "coi_abcdefghijkl",
      provider: "shopify",
      provider_order_ref: null,
      provider_checkout_ref: null,
      status: "staged",
      updated_at: at,
    })).toBe(true);
  });
});
