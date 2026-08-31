import { enforceRateLimitKey, HttpError } from './http';
import { constantTimeEqual, sha256 } from './operator-auth';
import type { Env } from './types';

const HASH_PATTERN = /^[a-f0-9]{64}$/;
const CONSUMER_PATTERN = /^[a-z0-9][a-z0-9._-]{2,63}$/i;

export async function authorizeCommerce(request: Request, env: Env) {
  const authorization = request.headers.get('authorization')?.trim() ?? '';
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() ?? '';
  const expected = env.FOUNDER_COMMAND_COMMERCE_TOKEN_SHA256?.trim().toLowerCase() ?? '';
  const consumerId = request.headers.get('x-hyprm-consumer')?.trim() ?? '';
  const supplied = token ? await sha256(token) : '0'.repeat(64);
  if (!token || !HASH_PATTERN.test(expected) || !constantTimeEqual(supplied, expected) || !CONSUMER_PATTERN.test(consumerId)) {
    throw new HttpError(401, 'commerce_auth_required', 'Commerce command authentication failed.', { 'www-authenticate': 'Bearer' });
  }
  await enforceRateLimitKey(env.COMMERCE_OPERATOR_RATE_LIMITER, consumerId, 'commerce-command');
  return { consumerId, keyId: env.FOUNDER_COMMAND_COMMERCE_KEY_ID?.trim() || 'fc-commerce-v1' };
}
