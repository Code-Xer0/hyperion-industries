import {
  FORGE_CONFIGURATOR_FALLBACK,
  PANDORA_CONFIGURATOR_FALLBACK,
} from '../../../src/data/configuratorFallbacks.js';

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
};
const SUBJECT_PATTERN = /^HYP-SUB-[A-Za-z0-9_-]{8,120}$/;
const SAFE_SUFFIX = /^(?:|\/|\/builds(?:\/[A-Za-z0-9_-]+(?:\/(?:parts|compose|claim|review-requests|revisions|runs\/[A-Za-z0-9_-]+(?:\/candidates)?))?)?|\/candidates\/compare|\/plans(?:\/[A-Za-z0-9_-]+(?:\/(?:revisions|claim|tal-preview))?)?|\/tal-signing-key)$/;

function json(request, body, status = 200, headers = {}) {
  return new Response(request.method === 'HEAD' ? null : `${JSON.stringify(body)}\n`, {
    status,
    headers: { ...JSON_HEADERS, ...headers },
  });
}

function cookieValue(request, name) {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.split(';').map((item) => item.trim()).find((item) => item.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

function subjectFor(request) {
  const current = cookieValue(request, 'hyperion_subject');
  if (current && SUBJECT_PATTERN.test(current)) return { subject: current, created: false };
  return { subject: `HYP-SUB-${crypto.randomUUID().replaceAll('-', '')}`, created: true };
}

function configuredOrigin(value) {
  try {
    const url = new URL(value || '');
    return url.protocol === 'https:' && !url.username && !url.password && url.pathname === '/' ? url.origin : null;
  } catch {
    return null;
  }
}

function fallbackCatalog(request, domain, lane) {
  if (!['GET', 'HEAD'].includes(request.method)) {
    return json(request, {
      error: {
        code: 'runtime_unconfigured',
        message: 'The managed configurator authority is not active. Your browser draft remains local.',
      },
      source_posture: 'local_draft_only',
    }, 503);
  }
  if (domain === 'forge') {
    return json(request, { ...FORGE_CONFIGURATOR_FALLBACK, degraded_reason: 'hypom_not_configured' });
  }
  const items = PANDORA_CONFIGURATOR_FALLBACK.items.filter((item) => !lane || item.product_lane === lane);
  return json(request, {
    ...PANDORA_CONFIGURATOR_FALLBACK,
    items,
    degraded_reason: 'pandora_planner_not_configured',
  });
}

async function proxy(request, { origin, token, targetPath, subject, account, tokenHeader }, externalFetch) {
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (!Number.isFinite(contentLength) || contentLength < 0 || contentLength > 65536) {
    return json(request, { error: { code: 'request_too_large', message: 'Configurator request is too large.' } }, 413);
  }
  const headers = new Headers({
    accept: 'application/json',
    'content-type': 'application/json',
    'X-Hyperion-Subject': subject,
  });
  headers.set(tokenHeader, tokenHeader === 'Authorization' ? `Bearer ${token}` : token);
  if (account) headers.set('X-Hyperion-Account', account);
  const idempotency = request.headers.get('idempotency-key');
  if (idempotency) headers.set('Idempotency-Key', idempotency.slice(0, 200));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await externalFetch(`${origin}${targetPath}`, {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(),
      signal: controller.signal,
    });
    const body = request.method === 'HEAD' ? null : await response.arrayBuffer();
    return new Response(body, {
      status: response.status,
      headers: JSON_HEADERS,
    });
  } catch {
    return json(request, {
      error: { code: 'authority_unavailable', message: 'The engineering authority is temporarily unavailable.' },
      source_posture: 'local_draft_only',
    }, 503);
  } finally {
    clearTimeout(timer);
  }
}

export async function handleConfiguratorApi(request, env = {}, externalFetch = fetch) {
  const url = new URL(request.url);
  const match = url.pathname.match(/^\/api\/configurator\/(forge|pandora)(\/.*)?$/);
  if (!match) return json(request, { error: { code: 'route_not_found', message: 'Configurator route not found.' } }, 404);
  const [, domain, suffix = ''] = match;
  if (!SAFE_SUFFIX.test(suffix)) {
    return json(request, { error: { code: 'route_not_found', message: 'Configurator route not found.' } }, 404);
  }
  const subject = subjectFor(request);
  const account = cookieValue(request, 'hyperion_account');
  const lane = url.searchParams.get('lane');
  const isCatalog = suffix === '' || suffix === '/';
  const origin = configuredOrigin(domain === 'forge' ? env.HYPOM_PUBLIC_ORIGIN : env.PANDORA_PUBLIC_ORIGIN);
  const token = domain === 'forge' ? env.HYPOM_PUBLIC_SERVICE_TOKEN : env.PANDORA_PUBLIC_SERVICE_TOKEN;
  if (!origin || !token) {
    const response = fallbackCatalog(request, domain, lane);
    if (subject.created) response.headers.append(
      'set-cookie',
      `hyperion_subject=${encodeURIComponent(subject.subject)}; Path=/; Max-Age=31536000; Secure; HttpOnly; SameSite=Lax`,
    );
    return response;
  }
  let targetPath;
  if (domain === 'forge') {
    targetPath = isCatalog
      ? `/public/v1/forge/catalog${url.search}`
      : `/public/v1/forge${suffix}${url.search}`;
  } else {
    targetPath = isCatalog
      ? `/public/v1/pandora/catalog${url.search}`
      : `/public/v1/pandora${suffix}${url.search}`;
  }
  const response = await proxy(request, {
    origin,
    token,
    targetPath,
    subject: subject.subject,
    account,
    tokenHeader: domain === 'forge' ? 'Authorization' : 'X-Hyperion-Service-Token',
  }, externalFetch);
  response.headers.set('x-hyperion-authority', domain === 'forge' ? 'hypom' : 'pandora_planner');
  if (subject.created) response.headers.append(
    'set-cookie',
    `hyperion_subject=${encodeURIComponent(subject.subject)}; Path=/; Max-Age=31536000; Secure; HttpOnly; SameSite=Lax`,
  );
  return response;
}
