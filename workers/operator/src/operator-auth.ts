import { enforceRateLimitKey, HttpError } from "./http";
import { logMetadata } from "./log";
import type { Env } from "./types";

const CONSUMER_PATTERN = /^[a-z0-9][a-z0-9._-]{2,63}$/i;
const HASH_PATTERN = /^[a-f0-9]{64}$/;
const KEY_ID_PATTERN = /^[A-Za-z0-9._-]{3,80}$/;

export interface OperatorAuthorization {
  consumerId: string;
  keyId: string;
  keyVersion: "current" | "previous";
}

export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return mismatch === 0;
}

function bearer(request: Request): string {
  const authorization = request.headers.get("authorization")?.trim() ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? "";
}

function consumer(request: Request): string {
  const value = request.headers.get("x-hyprm-consumer")?.trim() ?? "";
  if (!CONSUMER_PATTERN.test(value)) throw new HttpError(400, "consumer_required", "A valid consumer identifier is required.");
  return value;
}

export async function authorizeOperator(request: Request, env: Env, now: Date): Promise<OperatorAuthorization> {
  const keyId = env.FOUNDER_COMMAND_PULL_KEY_ID?.trim() ?? "";
  const current = env.FOUNDER_COMMAND_PULL_TOKEN_SHA256?.trim().toLowerCase() ?? "";
  const previous = env.FOUNDER_COMMAND_PULL_PREVIOUS_TOKEN_SHA256?.trim().toLowerCase() ?? "";
  const previousUntil = Date.parse(env.FOUNDER_COMMAND_PULL_PREVIOUS_UNTIL?.trim() ?? "");
  const supplied = bearer(request);
  const suppliedHash = supplied ? await sha256(supplied) : "0".repeat(64);
  const currentMatch = HASH_PATTERN.test(current) && constantTimeEqual(suppliedHash, current);
  const previousMatch = HASH_PATTERN.test(previous) && Number.isFinite(previousUntil) && previousUntil > now.getTime()
    && constantTimeEqual(suppliedHash, previous);
  if (!KEY_ID_PATTERN.test(keyId) || !supplied || (!currentMatch && !previousMatch)) {
    throw new HttpError(401, "operator_auth_required", "Operator feed authentication failed.", { "www-authenticate": "Bearer" });
  }
  const consumerId = consumer(request);
  await enforceRateLimitKey(env.INTAKE_OPERATOR_RATE_LIMITER, consumerId, "operator-feed");
  const keyVersion = currentMatch ? "current" : "previous";
  logMetadata("operator_auth", { auth_key_version: `${keyId}:${keyVersion}` });
  return { consumerId, keyId, keyVersion };
}
