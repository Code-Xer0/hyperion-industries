export const CARD_TEST_AT = "2026-07-27T12:00:00.000Z";

export function designFixture(overrides: Record<string, unknown> = {}) {
  return {
    contract_version: "card-design-document/1",
    document_id: "cdd_abcdefghijkl",
    project_id: "csp_abcdefghijkl",
    revision: 1,
    template_id: "template_signal",
    product_sku: "card_pvc_standard",
    artboards: [{
      side: "front",
      background: "#05070A",
      elements: [{
        id: "el_name01",
        kind: "text",
        x: 0.1,
        y: 0.1,
        width: 0.8,
        height: 0.2,
        locked: false,
        text: "Operator",
        font_token: "hyperion-display",
        color: "#FFFFFF",
      }],
    }],
    profile: {
      display_name: "Operator",
      headline: "Systems architect",
      visibility: "private",
      links: [{ label: "Hyperion", url: "https://hyperion-industries.dev" }],
    },
    asset_refs: [],
    preflight: { state: "passed", warnings: [], renderer_version: "card-renderer.1" },
    updated_at: CARD_TEST_AT,
    ...overrides,
  };
}

export function orderFixture(overrides: Record<string, unknown> = {}) {
  return {
    contract_version: "card-order-intent/1",
    intent_id: "coi_abcdefghijkl",
    project_id: "csp_abcdefghijkl",
    revision_id: "csr_abcdefghijkl",
    product_sku: "card_pvc_standard",
    quantity: 1,
    proof_approved: true,
    proof_refs: ["proof_abcdefgh"],
    consent: {
      terms_version: "2026-07-27",
      privacy_version: "2026-07-27",
      approved_at: CARD_TEST_AT,
    },
    ...overrides,
  };
}
