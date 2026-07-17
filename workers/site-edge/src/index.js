import { SEO_REDIRECTS, SEO_ROUTE_BY_PATH } from '../../../src/data/seoRoutes.js';

const PASS_THROUGH_PREFIXES = ['/api/', '/assets/', '/.well-known/'];
const LEGACY_INTAKE_ORIGIN = 'https://hyperion-operator.hyperion-industries-intake.workers.dev';
const LEGACY_INTAKE_BUNDLE = /^\/assets\/IntakePage-[A-Za-z0-9_-]+\.js$/;
const INTAKE_CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data:",
  "connect-src 'self'",
  "media-src 'self'",
  "frame-src 'none'",
  "worker-src 'self'",
  "manifest-src 'self'",
  'upgrade-insecure-requests',
].join('; ');

export function isIntakePath(pathname) {
  return pathname === '/intake' || pathname.startsWith('/intake/');
}

function secureIntakeResponse(response, pathname) {
  if (!isIntakePath(pathname)) return response;
  const headers = new Headers(response.headers);
  headers.set('content-security-policy', INTAKE_CSP);
  headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  headers.set('referrer-policy', 'no-referrer');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function normalizeLegacyIntakeAsset(response, pathname, method) {
  if (method !== 'GET' || !response.ok || !LEGACY_INTAKE_BUNDLE.test(pathname)) return response;
  if (!(response.headers.get('content-type') || '').includes('javascript')) return response;

  const source = await response.text();
  if (!source.includes(LEGACY_INTAKE_ORIGIN)) {
    return new Response(source, response);
  }

  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.set('cache-control', 'no-store');
  headers.set('x-hyperion-intake-adapter', 'same-origin');
  return new Response(source.replaceAll(LEGACY_INTAKE_ORIGIN, ''), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function redirectTo(requestUrl, pathname) {
  const target = new URL(requestUrl);
  target.pathname = pathname;
  return Response.redirect(target, 301);
}

async function originRequest(request, pathname, originFetch) {
  const target = new URL(request.url);
  target.pathname = pathname;
  const response = await originFetch(new Request(target, request));
  const headers = new Headers(response.headers);
  headers.set('x-hyperion-origin-path', pathname);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function notFound(request, originFetch) {
  const response = await originRequest(request, '/404.html', originFetch);
  const headers = new Headers(response.headers);
  headers.set('x-robots-tag', 'noindex, nofollow');
  headers.set('cache-control', 'public, max-age=60');
  return new Response(request.method === 'HEAD' ? null : response.body, {
    status: 404,
    statusText: 'Not Found',
    headers,
  });
}

export async function handleRequest(request, originFetch = fetch) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (!['GET', 'HEAD'].includes(request.method)) return originFetch(request);

  const aliasTarget = SEO_REDIRECTS.get(pathname);
  if (aliasTarget) return redirectTo(request.url, aliasTarget);

  if (pathname !== '/' && pathname.endsWith('/')) {
    const cleanPath = pathname.replace(/\/+$/, '');
    if (SEO_ROUTE_BY_PATH.has(cleanPath)) return redirectTo(request.url, cleanPath);
  }

  const publicRoute = SEO_ROUTE_BY_PATH.get(pathname);
  if (publicRoute) {
    const originPath = pathname === '/' ? '/index.html' : `${pathname}/index.html`;
    const response = await originRequest(request, originPath, originFetch);
    const headers = new Headers(response.headers);
    headers.set('x-hyperion-canonical-route', pathname);
    return secureIntakeResponse(new Response(request.method === 'HEAD' ? null : response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    }), pathname);
  }

  if (PASS_THROUGH_PREFIXES.some((prefix) => pathname.startsWith(prefix)) || /\.[a-z0-9]{1,12}$/i.test(pathname)) {
    const response = await originFetch(request);
    if (response.status !== 404) return normalizeLegacyIntakeAsset(response, pathname, request.method);
    const headers = new Headers(response.headers);
    headers.set('x-robots-tag', 'noindex, nofollow');
    return new Response(response.body, { status: 404, statusText: 'Not Found', headers });
  }

  return notFound(request, originFetch);
}

export default {
  async fetch(request) {
    const pathname = new URL(request.url).pathname;
    const response = await handleRequest(request);
    const headers = new Headers(response.headers);
    headers.set('x-hyperion-edge-active', 'hyperion-site-edge');
    headers.set('x-hyperion-edge-path', pathname);
    return new Response(request.method === 'HEAD' ? null : response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
