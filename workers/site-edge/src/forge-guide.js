import { FORGE_GUIDE_FALLBACK, isForgeGuideBundle } from '../../../src/data/forgeGuideBundle.js';

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'public, max-age=120, s-maxage=900, stale-while-revalidate=3600',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
};

function json(request, body, status = 200, headers = {}) {
  return new Response(request.method === 'HEAD' ? null : JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, ...headers },
  });
}

export async function handleForgeGuide(request) {
  if (!['GET', 'HEAD'].includes(request.method)) {
    return json(request, {
      error: { code: 'method_not_allowed', message: 'Forge guide supports GET and HEAD only.' },
    }, 405, { allow: 'GET, HEAD' });
  }
  if (!isForgeGuideBundle(FORGE_GUIDE_FALLBACK)) {
    return json(request, {
      error: { code: 'guide_bundle_invalid', message: 'The verified guide bundle is unavailable.' },
    }, 503, { 'cache-control': 'no-store' });
  }
  return json(request, {
    schema_version: 'forge-guide-edge-response/1',
    source_posture: 'bundled_verified',
    degraded_reason: null,
    bundle: FORGE_GUIDE_FALLBACK,
  });
}
