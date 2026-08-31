import { jsonResponse } from "./http";
import { shopifyConfigurationPosture } from "./shopify";
import { paypalConfigurationPosture } from "./paypal";
import { stripeConfigurationPosture } from "./stripe";
import type { Env } from "./types";

const enabled = (value: string | undefined): boolean => value?.trim().toLowerCase() === "true";

export function commerceReadiness(env: Env) {
  const shopify = shopifyConfigurationPosture(env);
  const paypal = paypalConfigurationPosture(env);
  const stripe = stripeConfigurationPosture(env);
  const webhookReady = (env.CARD_STUDIO_SHOPIFY_WEBHOOK_SECRET?.trim().length ?? 0) >= 16;
  const shippingReady = enabled(env.CARD_STUDIO_SHOPIFY_SHIPPING_READY);
  const taxConfirmed = enabled(env.CARD_STUDIO_SHOPIFY_TAX_CONFIRMED);
  const founderCommandPullReady = Boolean(
    env.DB
    && env.FOUNDER_COMMAND_PULL_KEY_ID?.trim()
    && /^[a-f0-9]{64}$/i.test(env.FOUNDER_COMMAND_PULL_TOKEN_SHA256?.trim() ?? ""),
  );
  const founderCommandCommerceReady = Boolean(
    env.FOUNDER_COMMAND_COMMERCE_KEY_ID?.trim()
    && /^[a-f0-9]{64}$/i.test(env.FOUNDER_COMMAND_COMMERCE_TOKEN_SHA256?.trim() ?? ""),
  );
  const fixedProductMappingsReady = shopify.pvcVariant && shopify.metalVariant;
  const sandboxCheckoutReady = Boolean(env.DB && paypal.configured && founderCommandCommerceReady);

  return {
    contract_version: "hyperion.commerce-readiness/2",
    generated_at: new Date().toISOString(),
    release_state: sandboxCheckoutReady ? "sandbox_ready_for_operator_test" : "payments_not_yet_active",
    providers: {
      paypal: {
        role: "primary_interim",
        environment: paypal.environment,
        configuration: paypal.configured ? "configured" : "configuration_required",
        live_capture: paypal.liveEnabled ? "enabled" : "separate_authorization_required",
      },
      stripe: {
        role: "standby",
        environment: stripe.environment,
        configuration: stripe.configured ? "configured" : "configuration_required",
        live_capture: stripe.liveEnabled ? "enabled" : "separate_authorization_required",
      },
      shopify: {
        role: "disabled_until_reviewed",
        storefront: shopify.storefront ? "configured" : "configuration_required",
      },
      admin_api_exposed_to_browser: false,
    },
    card_studio: {
      fixed_price_products: ["card_pvc_standard", "card_metal_standard"],
      product_mappings: fixedProductMappingsReady ? "ready" : "configuration_required",
      mapped_sku_count: shopify.mappedSkus,
      checkout_sequence: "proof_approved_quote_staged_checkout_released_provider_checkout_created",
      webhook: webhookReady ? "ready" : "configuration_required",
    },
    forge: {
      checkout_mode: "proposal_first_draft_order_invoice",
      public_cart: false,
      draft_order_release: "operator_authorization_required",
      provider_adapter: paypal.configured || stripe.configured ? "sandbox_configured" : "configuration_required",
    },
    operations: {
      shipping: shippingReady ? "reviewed" : "configuration_required",
      tax: taxConfirmed ? "operator_confirmed" : "operator_confirmation_required",
      founder_command_intake: founderCommandPullReady ? "connected" : "configuration_required",
      founder_command_commerce: founderCommandCommerceReady ? "connected" : "configuration_required",
      payments_live: "not_active",
      live_charge_refund_smoke: "separate_authorization_required",
    },
  } as const;
}

export function handleCommerceReadiness(env: Env): Response {
  return jsonResponse(commerceReadiness(env));
}
