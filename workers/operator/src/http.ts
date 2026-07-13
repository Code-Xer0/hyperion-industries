import type { Env, RateLimitBinding } from "./types";

export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly headers: HeadersInit | undefined;

  constructor(status: number, code: string, message: string, headers?: HeadersInit) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.headers = headers;
  }
}

export function jsonResponse(value: unknown, status = 200, headers?: HeadersInit): Response {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(value), { status, headers: responseHeaders });
}

export function errorResponse(error: HttpError): Response {
  return jsonResponse(
    { ok: false, error: { code: error.code, message: error.message } },
    error.status,
    error.headers,
  );
}

export function finalizeResponse(response: Response, requestId: string, corsOrigin?: string): Response {
  const headers = new Headers(response.headers);
  headers.set("cache-control", headers.get("cache-control") ?? "no-store");
  headers.set("referrer-policy", "no-referrer");
  headers.set("x-content-type-options", "nosniff");
  headers.set("x-frame-options", "DENY");
  headers.set("x-request-id", requestId);
  if (corsOrigin) {
    headers.set("access-control-allow-origin", corsOrigin);
    headers.set("access-control-allow-credentials", "true");
    headers.append("vary", "Origin");
  } else {
    headers.delete("access-control-allow-origin");
    headers.delete("access-control-allow-credentials");
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function readJsonBody(request: Request, maxBytes: number): Promise<unknown> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (contentType !== "application/json") {
    throw new HttpError(415, "unsupported_media_type", "Content-Type must be application/json.");
  }

  const declaredLength = request.headers.get("content-length");
  if (declaredLength) {
    const parsedLength = Number(declaredLength);
    if (!Number.isFinite(parsedLength) || parsedLength < 0) {
      throw new HttpError(400, "invalid_content_length", "Content-Length is invalid.");
    }
    if (parsedLength > maxBytes) {
      throw new HttpError(413, "body_too_large", "Request body exceeds the allowed size.");
    }
  }

  if (!request.body) throw new HttpError(400, "invalid_json", "A JSON request body is required.");

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel("body_too_large");
        throw new HttpError(413, "body_too_large", "Request body exceeds the allowed size.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const joined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    joined.set(chunk, offset);
    offset += chunk.byteLength;
  }

  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(joined);
  } catch {
    throw new HttpError(400, "invalid_encoding", "Request body must be valid UTF-8.");
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new HttpError(400, "invalid_json", "Request body must contain valid JSON.");
  }
}

export function requireObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpError(400, "invalid_request", "Request body must be a JSON object.");
  }
  return value as Record<string, unknown>;
}

export function rejectUnknownFields(value: Record<string, unknown>, allowed: readonly string[]): void {
  const allowedSet = new Set(allowed);
  if (Object.keys(value).some((key) => !allowedSet.has(key))) {
    throw new HttpError(400, "invalid_request", "Request body contains unsupported fields.");
  }
}

function configuredOrigin(raw: string | undefined): { valid: boolean; origin?: string } {
  if (!raw?.trim()) return { valid: true };
  try {
    const url = new URL(raw.trim());
    const localHttp = url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    const validProtocol = url.protocol === "https:" || localHttp;
    const clean = url.pathname === "/" && !url.search && !url.hash && !url.username && !url.password;
    return validProtocol && clean ? { valid: true, origin: url.origin } : { valid: false };
  } catch {
    return { valid: false };
  }
}

export function originConfiguration(env: Env): { valid: boolean; configured: boolean } {
  const parsed = configuredOrigin(env.SITE_ORIGIN);
  return { valid: parsed.valid, configured: parsed.origin !== undefined };
}

export function enforceSameOrigin(request: Request, env: Env): void {
  const site = configuredOrigin(env.SITE_ORIGIN);
  const api = configuredOrigin(env.INTAKE_API_ORIGIN);
  if (!site.valid || !api.valid) {
    throw new HttpError(503, "origin_configuration_invalid", "Same-origin protection is not configured correctly.");
  }

  const requestOrigin = new URL(request.url).origin;
  const expectedOrigin = site.origin ?? requestOrigin;
  const suppliedOrigin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site")?.toLowerCase();
  const direct = requestOrigin === expectedOrigin && suppliedOrigin === expectedOrigin
    && (!fetchSite || fetchSite === "same-origin");
  const firstPartyApi = Boolean(api.origin) && requestOrigin === api.origin && suppliedOrigin === expectedOrigin
    && (!fetchSite || fetchSite === "same-site" || fetchSite === "cross-site");

  if (!direct && !firstPartyApi) {
    throw new HttpError(403, "same_origin_required", "This endpoint accepts same-origin browser requests only.");
  }
}

export function browserCorsOrigin(request: Request, env: Env): string | undefined {
  const site = configuredOrigin(env.SITE_ORIGIN);
  const api = configuredOrigin(env.INTAKE_API_ORIGIN);
  if (!site.valid || !api.valid || !site.origin || !api.origin) return undefined;
  const requestOrigin = new URL(request.url).origin;
  return requestOrigin === api.origin && request.headers.get("origin") === site.origin ? site.origin : undefined;
}

async function anonymousRateKey(request: Request, scope: string): Promise<string> {
  const ip = request.headers.get("cf-connecting-ip")?.slice(0, 128) ?? "unknown";
  const userAgent = request.headers.get("user-agent")?.slice(0, 256) ?? "unknown";
  const bytes = new TextEncoder().encode(`${scope}\n${ip}\n${userAgent}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function enforceRateLimit(
  binding: RateLimitBinding | undefined,
  request: Request,
  scope: string,
): Promise<void> {
  if (!binding) {
    throw new HttpError(503, "rate_limit_unavailable", "Abuse protection is temporarily unavailable.");
  }

  let result: { success: boolean };
  try {
    result = await binding.limit({ key: await anonymousRateKey(request, scope) });
  } catch {
    throw new HttpError(503, "rate_limit_unavailable", "Abuse protection is temporarily unavailable.");
  }

  if (!result.success) {
    throw new HttpError(429, "rate_limited", "Too many requests. Please try again later.", { "retry-after": "60" });
  }
}

export async function enforceRateLimitKey(
  binding: RateLimitBinding | undefined,
  key: string,
  scope = "service",
): Promise<void> {
  if (!binding) {
    throw new HttpError(503, "rate_limit_unavailable", "Abuse protection is temporarily unavailable.");
  }
  try {
    const result = await binding.limit({ key: `${scope}:${key}` });
    if (!result.success) {
      throw new HttpError(429, "rate_limited", "Too many requests. Please try again later.", { "retry-after": "60" });
    }
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(503, "rate_limit_unavailable", "Abuse protection is temporarily unavailable.");
  }
}

export function modelConfiguration(env: Env): { model: string; valid: boolean; overridden: boolean } {
  const raw = env.OPENROUTER_MODEL?.trim();
  if (!raw) return { model: "openai/gpt-5.2", valid: true, overridden: false };
  const valid = raw.length <= 120 && /^[a-z0-9._-]+\/[a-z0-9._:-]+$/i.test(raw);
  return { model: valid ? raw : "openai/gpt-5.2", valid, overridden: true };
}

export function isEmailAddress(value: string | undefined): value is string {
  return Boolean(value && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
}
