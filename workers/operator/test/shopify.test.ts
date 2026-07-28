import { describe, expect, it, vi } from "vitest";
import { createShopifyCart, shopifyCheckoutReady, verifyShopifyWebhook } from "../src/shopify";
import { baseEnv } from "./helpers";

const SHOPIFY_ENV = baseEnv({
  CARD_STUDIO_SHOPIFY_STORE_DOMAIN: "hyperion-test.myshopify.com",
  CARD_STUDIO_SHOPIFY_STOREFRONT_API_VERSION: "2026-07",
  CARD_STUDIO_SHOPIFY_STOREFRONT_TOKEN: "storefront-token-with-entropy",
  CARD_STUDIO_SHOPIFY_VARIANTS: JSON.stringify({
    card_pvc_standard: "gid://shopify/ProductVariant/1234567890",
  }),
});

describe("Card Studio Shopify adapter", () => {
  it("fails closed until store, token, and released variant mappings exist", () => {
    expect(shopifyCheckoutReady(baseEnv())).toBe(false);
    expect(shopifyCheckoutReady(SHOPIFY_ENV)).toBe(true);
  });

  it("creates only the mapped fixed-SKU cart and carries the opaque intent reference", async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const submitted = JSON.parse(String(init?.body)) as {
        variables: { input: { attributes: Array<{ key: string; value: string }> } };
      };
      expect(submitted.variables.input.attributes).toContainEqual({
        key: "hyperion_intent_id",
        value: "coi_abcdefghijkl",
      });
      return Response.json({
        data: {
          cartCreate: {
            cart: {
              id: "gid://shopify/Cart/test-cart",
              checkoutUrl: "https://hyperion-test.myshopify.com/checkouts/test-cart",
            },
            userErrors: [],
          },
        },
      });
    });
    const result = await createShopifyCart(SHOPIFY_ENV, {
      fetcher,
      now: () => new Date("2026-07-27T12:00:00.000Z"),
      randomUUID: () => "test",
      setTimer: () => 0,
      clearTimer: () => {},
    }, {
      intentId: "coi_abcdefghijkl",
      productSku: "card_pvc_standard",
      quantity: 1,
    });
    expect(result.checkoutUrl).toBe("https://hyperion-test.myshopify.com/checkouts/test-cart?sso=silent");
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("verifies the exact raw webhook body", async () => {
    const raw = new TextEncoder().encode('{"id":42}').buffer;
    const secret = "webhook-secret-with-entropy";
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signed = new Uint8Array(await crypto.subtle.sign("HMAC", key, raw));
    let binary = "";
    for (const byte of signed) binary += String.fromCharCode(byte);
    const signature = btoa(binary);
    expect(await verifyShopifyWebhook(raw, signature, secret)).toBe(true);
    expect(await verifyShopifyWebhook(new TextEncoder().encode('{"id":43}').buffer, signature, secret)).toBe(false);
  });
});
