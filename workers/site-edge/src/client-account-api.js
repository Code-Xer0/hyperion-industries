const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
};
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,256}$/;
const SESSION_PATTERN = /^[A-Za-z0-9_-]{32,256}$/;
const ACCOUNT_PATTERN = /^[A-Za-z0-9_-]{8,160}$/;
const MAX_BODY_BYTES = 16_384;
const SESSION_COOKIE = 'hyperion_session';
const ACCOUNT_COOKIE = 'hyperion_account';
const COOLDOWN_COOKIE = 'hyperion_magic_requested';

function json(request, body, status = 200, headers = {}) {
  return new Response(request.method === 'HEAD' ? null : `${JSON.stringify(body)}\n`, {
    status,
    headers: { ...JSON_HEADERS, ...headers },
  });
}

function cookieValue(request, name) {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

function secureCookie(name, value, maxAge) {
  return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; Secure; HttpOnly; SameSite=Lax`;
}

function clearCookie(name) {
  return `${name}=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax`;
}

function configuredOrigin(value) {
  try {
    const url = new URL(value || '');
    return url.protocol === 'https:' && !url.username && !url.password && url.pathname === '/'
      ? url.origin
      : null;
  } catch {
    return null;
  }
}

function portalOrigin(value) {
  const configured = configuredOrigin(value);
  return configured || 'https://hyperion-industries.dev';
}

function serviceConfig(env) {
  const origin = configuredOrigin(env.HYPRM_PUBLIC_ORIGIN);
  const token = typeof env.HYPRM_PUBLIC_SERVICE_TOKEN === 'string'
    ? env.HYPRM_PUBLIC_SERVICE_TOKEN
    : '';
  return origin && token ? { origin, token } : null;
}

function deliveryConfig(env) {
  const apiKey = typeof env.RESEND_API_KEY === 'string' ? env.RESEND_API_KEY : '';
  const sender = typeof env.CLIENT_MAGIC_LINK_FROM === 'string'
    ? env.CLIENT_MAGIC_LINK_FROM.trim()
    : '';
  return apiKey && sender ? { apiKey, sender } : null;
}

async function readJson(request) {
  const declared = Number(request.headers.get('content-length') || 0);
  if (!Number.isFinite(declared) || declared < 0 || declared > MAX_BODY_BYTES) {
    throw new Error('request_too_large');
  }
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.byteLength > MAX_BODY_BYTES) throw new Error('request_too_large');
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new Error('request_invalid');
  }
}

async function hyprmRequest(config, path, options, externalFetch) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  const headers = new Headers({
    accept: 'application/json',
    'content-type': 'application/json',
    'X-Hyperion-Service-Token': config.token,
    ...options.headers,
  });
  try {
    const response = await externalFetch(`${config.origin}${path}`, {
      method: options.method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => null);
    return { response, payload };
  } finally {
    clearTimeout(timer);
  }
}

async function sendMagicLink(delivery, email, link, idempotencyKey, externalFetch) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    return await externalFetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${delivery.apiKey}`,
        'content-type': 'application/json',
        'Idempotency-Key': idempotencyKey.slice(0, 256),
      },
      body: JSON.stringify({
        from: delivery.sender,
        to: [email],
        subject: 'Your Hyperion client-room link',
        text: `Open your private Hyperion client room:\n\n${link}\n\nThis link expires in 15 minutes and can be used once. If you did not request it, you can ignore this email.`,
        html: `<p>Open your private Hyperion client room:</p><p><a href="${link}">Enter the client room</a></p><p>This link expires in 15 minutes and can be used once. If you did not request it, you can ignore this email.</p>`,
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

function sameOriginRequest(request) {
  const origin = request.headers.get('origin');
  return !origin || origin === new URL(request.url).origin;
}

async function issueMagicLink(request, env, externalFetch) {
  if (request.method !== 'POST') {
    return json(request, { error: { code: 'method_not_allowed', message: 'Use POST for this route.' } }, 405);
  }
  if (!sameOriginRequest(request)) {
    return json(request, { error: { code: 'origin_rejected', message: 'The request origin is not allowed.' } }, 403);
  }
  if (cookieValue(request, COOLDOWN_COOKIE)) {
    return json(request, {
      accepted: true,
      delivery_posture: 'cooldown',
      message: 'If the address is eligible, a fresh link is already on its way.',
    }, 202);
  }
  const service = serviceConfig(env);
  const delivery = deliveryConfig(env);
  if (!service || !delivery) {
    return json(request, {
      error: {
        code: 'client_gateway_unconfigured',
        message: 'Client-room email access is not active yet.',
      },
      source_posture: 'managed_account_unavailable',
    }, 503);
  }
  let payload;
  try {
    payload = await readJson(request);
  } catch (error) {
    const tooLarge = error.message === 'request_too_large';
    return json(request, {
      error: {
        code: tooLarge ? 'request_too_large' : 'request_invalid',
        message: tooLarge ? 'The request is too large.' : 'The request body is invalid.',
      },
    }, tooLarge ? 413 : 400);
  }
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const displayName = typeof payload.display_name === 'string' ? payload.display_name.trim() : '';
  if (!EMAIL_PATTERN.test(email) || email.length > 254 || displayName.length > 80) {
    return json(request, {
      error: { code: 'account_request_invalid', message: 'Enter a valid email address.' },
    }, 422);
  }
  try {
    const issued = await hyprmRequest(service, '/public/v1/client-auth/magic-links', {
      method: 'POST',
      body: {
        email,
        display_name: displayName,
        request_context: 'public-client-room',
      },
    }, externalFetch);
    const rawToken = issued.payload?.delivery?.token;
    if (!issued.response.ok || !TOKEN_PATTERN.test(rawToken || '')) {
      return json(request, {
        error: { code: 'account_authority_unavailable', message: 'Client-room access is temporarily unavailable.' },
      }, 503);
    }
    const link = new URL('/account', portalOrigin(env.CLIENT_PORTAL_ORIGIN));
    link.searchParams.set('token', rawToken);
    const deliveryResponse = await sendMagicLink(
      delivery,
      email,
      link.toString(),
      `client-magic/${crypto.randomUUID()}`,
      externalFetch,
    );
    if (!deliveryResponse.ok) {
      return json(request, {
        error: { code: 'magic_link_delivery_failed', message: 'The access email could not be delivered.' },
      }, 503);
    }
    return json(request, {
      accepted: true,
      delivery_posture: 'email_requested',
      message: 'If the address is eligible, a private link is on its way.',
    }, 202, {
      'set-cookie': secureCookie(COOLDOWN_COOKIE, '1', 60),
    });
  } catch {
    return json(request, {
      error: { code: 'account_authority_unavailable', message: 'Client-room access is temporarily unavailable.' },
    }, 503);
  }
}

async function consumeMagicLink(request, env, externalFetch) {
  if (request.method !== 'POST') {
    return json(request, { error: { code: 'method_not_allowed', message: 'Use POST for this route.' } }, 405);
  }
  if (!sameOriginRequest(request)) {
    return json(request, { error: { code: 'origin_rejected', message: 'The request origin is not allowed.' } }, 403);
  }
  const service = serviceConfig(env);
  if (!service) {
    return json(request, {
      error: { code: 'client_gateway_unconfigured', message: 'Client-room access is not active yet.' },
    }, 503);
  }
  let payload;
  try {
    payload = await readJson(request);
  } catch (error) {
    const tooLarge = error.message === 'request_too_large';
    return json(request, {
      error: {
        code: tooLarge ? 'request_too_large' : 'request_invalid',
        message: tooLarge ? 'The request is too large.' : 'The request body is invalid.',
      },
    }, tooLarge ? 413 : 400);
  }
  const token = typeof payload.token === 'string' ? payload.token.trim() : '';
  if (!TOKEN_PATTERN.test(token)) {
    return json(request, {
      error: { code: 'magic_link_invalid', message: 'This access link is invalid or expired.' },
    }, 401);
  }
  try {
    const consumed = await hyprmRequest(service, '/public/v1/client-auth/magic-links/consume', {
      method: 'POST',
      body: { token },
    }, externalFetch);
    const sessionToken = consumed.payload?.session_token;
    const accountRef = consumed.payload?.crm_account_ref;
    if (
      !consumed.response.ok
      || !SESSION_PATTERN.test(sessionToken || '')
      || !ACCOUNT_PATTERN.test(accountRef || '')
    ) {
      return json(request, {
        error: { code: 'magic_link_invalid', message: 'This access link is invalid or expired.' },
      }, 401);
    }
    const response = json(request, {
      authenticated: true,
      expires_at: consumed.payload.expires_at,
      source_posture: 'hyprm_authoritative_session',
    });
    response.headers.append('set-cookie', secureCookie(SESSION_COOKIE, sessionToken, 14 * 24 * 60 * 60));
    response.headers.append('set-cookie', secureCookie(ACCOUNT_COOKIE, accountRef, 14 * 24 * 60 * 60));
    return response;
  } catch {
    return json(request, {
      error: { code: 'account_authority_unavailable', message: 'Client-room access is temporarily unavailable.' },
    }, 503);
  }
}

async function authenticatedProjection(request, env, path, externalFetch) {
  if (!['GET', 'HEAD'].includes(request.method)) {
    return json(request, { error: { code: 'method_not_allowed', message: 'Use GET for this route.' } }, 405);
  }
  const service = serviceConfig(env);
  const session = cookieValue(request, SESSION_COOKIE);
  if (!service || !SESSION_PATTERN.test(session || '')) {
    return json(request, {
      error: { code: 'client_session_required', message: 'A valid client-room session is required.' },
    }, 401);
  }
  try {
    const result = await hyprmRequest(service, path, {
      method: 'GET',
      headers: { Authorization: `Bearer ${session}` },
    }, externalFetch);
    if (!result.response.ok || !result.payload) {
      const response = json(request, {
        error: {
          code: result.response.status === 401 ? 'client_session_required' : 'account_authority_unavailable',
          message: result.response.status === 401
            ? 'Your client-room session has expired.'
            : 'Client history is temporarily unavailable.',
        },
      }, result.response.status === 401 ? 401 : 503);
      if (result.response.status === 401) {
        response.headers.append('set-cookie', clearCookie(SESSION_COOKIE));
        response.headers.append('set-cookie', clearCookie(ACCOUNT_COOKIE));
      }
      return response;
    }
    return json(request, result.payload, result.response.status);
  } catch {
    return json(request, {
      error: { code: 'account_authority_unavailable', message: 'Client history is temporarily unavailable.' },
    }, 503);
  }
}

async function logout(request, env, externalFetch) {
  if (request.method !== 'POST') {
    return json(request, { error: { code: 'method_not_allowed', message: 'Use POST for this route.' } }, 405);
  }
  const service = serviceConfig(env);
  const session = cookieValue(request, SESSION_COOKIE);
  if (service && SESSION_PATTERN.test(session || '')) {
    try {
      await hyprmRequest(service, '/public/v1/client-account/session/revoke', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session}` },
      }, externalFetch);
    } catch {
      // Local cookie revocation still happens; the authority session expires independently.
    }
  }
  const response = json(request, { signed_out: true });
  response.headers.append('set-cookie', clearCookie(SESSION_COOKIE));
  response.headers.append('set-cookie', clearCookie(ACCOUNT_COOKIE));
  return response;
}

export async function handleClientAccountApi(request, env = {}, externalFetch = fetch) {
  const pathname = new URL(request.url).pathname;
  if (pathname === '/api/client/magic-link') return issueMagicLink(request, env, externalFetch);
  if (pathname === '/api/client/magic-link/consume') return consumeMagicLink(request, env, externalFetch);
  if (pathname === '/api/client/account') {
    return authenticatedProjection(request, env, '/public/v1/client-account', externalFetch);
  }
  if (pathname === '/api/client/history') {
    return authenticatedProjection(request, env, '/public/v1/client-account/history', externalFetch);
  }
  if (pathname === '/api/client/logout') return logout(request, env, externalFetch);
  return json(request, { error: { code: 'route_not_found', message: 'Client route not found.' } }, 404);
}
