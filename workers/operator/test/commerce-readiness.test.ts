import Ajv2020 from "ajv/dist/2020";
import { describe, expect, it } from "vitest";
import forgeCommandSchema from "../../../shared/commerce/contracts/forge-commerce-command.v1.schema.json";
import receiptSchema from "../../../shared/commerce/contracts/commerce-payment-receipt.v1.schema.json";
import readinessSchema from "../../../shared/commerce/contracts/commerce-readiness.v2.schema.json";
import { createWorker } from "../src/index";
import { baseEnv, executionContext, MockD1 } from "./helpers";

describe("public commerce readiness", () => {
  it("fails closed without exposing provider secrets", async () => {
    const worker = createWorker();
    const { ctx } = executionContext();
    const response = await worker.fetch(
      new Request("https://hyperion-industries.dev/api/commerce/readiness"),
      baseEnv({ CARD_STUDIO_SHOPIFY_STOREFRONT_TOKEN: "do-not-leak-this-secret" }),
      ctx,
    );
    const body = await response.json<Record<string, unknown>>();
    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      contract_version: "hyperion.commerce-readiness/2",
      release_state: "payments_not_yet_active",
      forge: { public_cart: false, provider_adapter: "configuration_required" },
    });
    expect(JSON.stringify(body)).not.toContain("do-not-leak-this-secret");
  });

  it("requires every reviewed release gate before the authorized smoke posture", async () => {
    const worker = createWorker();
    const { ctx } = executionContext();
    const db = new MockD1();
    const response = await worker.fetch(
      new Request("https://hyperion-industries.dev/api/commerce/readiness"),
      baseEnv({
        DB: db.binding(),
        PAYPAL_ENVIRONMENT: "sandbox",
        PAYPAL_CLIENT_ID: "sandbox-client-id-with-entropy",
        PAYPAL_CLIENT_SECRET: "sandbox-client-secret-with-entropy",
        FOUNDER_COMMAND_COMMERCE_KEY_ID: "founder-commerce-test",
        FOUNDER_COMMAND_COMMERCE_TOKEN_SHA256: "a".repeat(64),
      }),
      ctx,
    );
    expect(await response.json()).toMatchObject({
      release_state: "sandbox_ready_for_operator_test",
      providers: { paypal: { role: "primary_interim", environment: "sandbox", configuration: "configured" } },
      operations: { founder_command_commerce: "connected", payments_live: "not_active" },
    });
  });

  it("emits a schema-valid public posture with no payment activation claim", async () => {
    const validate = new Ajv2020({ allErrors: true, strict: false, formats: { "date-time": true } }).compile(readinessSchema);
    const worker = createWorker();
    const { ctx } = executionContext();
    const response = await worker.fetch(
      new Request("https://hyperion-industries.dev/api/commerce/readiness"),
      baseEnv(),
      ctx,
    );
    expect(validate(await response.json())).toBe(true);
  });
});

describe("commerce contract boundaries", () => {
  const ajv = new Ajv2020({ allErrors: true, strict: false, formats: { "date-time": true } });

  it("accepts opaque, revision-bound Forge commands and rejects browser checkout fields", () => {
    const validate = ajv.compile(forgeCommandSchema);
    const command = {
      contract_version: "forge-commerce-command/1",
      proposal_ref: "sip_abcdefghijkl",
      intake_ref: "sub_abcdefghijkl",
      revision_hash: "a".repeat(64),
      action: "stage_invoice",
      idempotency_key: "forge:invoice:abcdefghijkl",
    };
    expect(validate(command)).toBe(true);
    expect(validate({ ...command, customer_email: "browser@controls.example" })).toBe(false);
  });

  it("validates a provider receipt without customer contact data", () => {
    const validate = ajv.compile(receiptSchema);
    expect(validate({
      contract_version: "commerce-payment-receipt/1",
      receipt_id: "cpr_abcdefghijkl",
      proposal_ref: "proposal_abcdefghijkl",
      provider: "shopify",
      provider_event_id: "webhook_abcdefghijkl",
      state: "paid",
      amount_minor: 3900,
      currency: "USD",
      occurred_at: "2026-08-27T00:00:00.000Z",
      payload_hash: "b".repeat(64),
    })).toBe(true);
  });

  it("validates the provider-neutral v2 checkout and receipt contracts", async () => {
    const checkoutSchema = (await import("../../../shared/commerce/contracts/commerce-checkout-command.v2.schema.json")).default;
    const receiptV2 = (await import("../../../shared/commerce/contracts/commerce-payment-receipt.v2.schema.json")).default;
    const checkout = ajv.compile(checkoutSchema);
    const receipt = ajv.compile(receiptV2);
    expect(checkout({
      contract_version: "commerce-checkout-command/2",
      proposal_ref: "proposal_abcdefghijkl",
      source_type: "forge",
      source_ref: "source_abcdefghijkl",
      revision_hash: "a".repeat(64),
      provider: "paypal",
      action: "stage_checkout",
      amount_minor: 50000,
      currency: "USD",
      description: "Reviewed Forge deposit",
      idempotency_key: "forge:checkout:abcdefghijkl",
    })).toBe(true);
    expect(receipt({
      contract_version: "commerce-payment-receipt/2",
      receipt_id: "cpr_abcdefghijkl",
      proposal_ref: "proposal_abcdefghijkl",
      provider: "paypal",
      provider_event_id: "capture_abcdefghijkl",
      state: "paid",
      amount_minor: 50000,
      currency: "USD",
      occurred_at: "2026-08-30T00:00:00.000Z",
      payload_hash: "b".repeat(64),
    })).toBe(true);
  });
});
