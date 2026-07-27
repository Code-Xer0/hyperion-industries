import { HttpError } from "./http";
import type { Env, RuntimeDependencies } from "./types";

const STORE_PATTERN = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/;
const VERSION_PATTERN = /^20[0-9]{2}-(01|04|07|10)$/;
const VARIANT_PATTERN = /^gid:\/\/shopify\/ProductVariant\/[0-9]+$/;

export interface ShopifyCartResult {
  cartId: string;
  checkoutUrl: string;
}

interface ShopifyConfig {
  domain: string;
  apiVersion: string;
  token: string;
  variants: Record<string, string>;
}

function parseVariants(value: string | undefined): Record<string, string> {
  try {
    const parsed = JSON.parse(value ?? "");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const variants: Record<string, string> = {};
    for (const [sku, variant] of Object.entries(parsed)) {
      if (/^card_[a-z0-9_]{3,48}$/.test(sku) && typeof variant === "string" && VARIANT_PATTERN.test(variant)) {
        variants[sku] = variant;
      }
    }
    return variants;
  } catch {
    return {};
  }
}

function config(env: Env): ShopifyConfig {
  const domain = env.CARD_STUDIO_SHOPIFY_STORE_DOMAIN?.trim().toLowerCase() ?? "";
  const apiVersion = env.CARD_STUDIO_SHOPIFY_STOREFRONT_API_VERSION?.trim() || "2026-07";
  const token = env.CARD_STUDIO_SHOPIFY_STOREFRONT_TOKEN?.trim() ?? "";
  const variants = parseVariants(env.CARD_STUDIO_SHOPIFY_VARIANTS);
  if (!STORE_PATTERN.test(domain) || !VERSION_PATTERN.test(apiVersion) || token.length < 16) {
    throw new HttpError(503, "shopify_not_configured", "Shopify checkout is not configured.");
  }
  return { domain, apiVersion, token, variants };
}

export function shopifyCheckoutReady(env: Env): boolean {
  try {
    const value = config(env);
    return Object.keys(value.variants).length > 0;
  } catch {
    return false;
  }
}

export async function createShopifyCart(
  env: Env,
  deps: RuntimeDependencies,
  input: { intentId: string; productSku: string; quantity: number },
): Promise<ShopifyCartResult> {
  const settings = config(env);
  const merchandiseId = settings.variants[input.productSku];
  if (!merchandiseId) {
    throw new HttpError(409, "shopify_variant_unmapped", "The selected Card Studio SKU has no released Shopify mapping.");
  }
  const response = await deps.fetcher(
    `https://${settings.domain}/api/${settings.apiVersion}/graphql.json`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-shopify-storefront-access-token": settings.token,
      },
      body: JSON.stringify({
        query: `mutation CardStudioCart($input: CartInput!) {
          cartCreate(input: $input) {
            cart { id checkoutUrl }
            userErrors { field message }
          }
        }`,
        variables: {
          input: {
            lines: [{ merchandiseId, quantity: input.quantity }],
            attributes: [{ key: "hyperion_intent_id", value: input.intentId }],
          },
        },
      }),
    },
  );
  const body = await response.json().catch(() => ({})) as {
    data?: { cartCreate?: { cart?: { id?: string; checkoutUrl?: string }; userErrors?: unknown[] } };
    errors?: unknown[];
  };
  const cart = body.data?.cartCreate?.cart;
  if (!response.ok || body.errors?.length || body.data?.cartCreate?.userErrors?.length || !cart?.id || !cart.checkoutUrl) {
    throw new HttpError(502, "shopify_cart_failed", "Shopify did not create a valid checkout cart.");
  }
  let checkout: URL;
  try {
    checkout = new URL(cart.checkoutUrl);
  } catch {
    throw new HttpError(502, "shopify_checkout_url_invalid", "Shopify returned an invalid checkout URL.");
  }
  if (checkout.protocol !== "https:") {
    throw new HttpError(502, "shopify_checkout_url_invalid", "Shopify returned an unsafe checkout URL.");
  }
  checkout.searchParams.set("sso", "silent");
  return { cartId: cart.id, checkoutUrl: checkout.toString() };
}

function base64(bytes: ArrayBuffer): string {
  let binary = "";
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export async function verifyShopifyWebhook(raw: ArrayBuffer, signature: string, secret: string): Promise<boolean> {
  if (!signature || secret.length < 16) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const expected = base64(await crypto.subtle.sign("HMAC", key, raw));
  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= expected.charCodeAt(index) ^ signature.charCodeAt(index);
  }
  return mismatch === 0;
}
