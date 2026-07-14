import { SEO_REDIRECTS, SEO_ROUTE_BY_PATH } from '../../../src/data/seoRoutes.js';

const PASS_THROUGH_PREFIXES = ['/api/', '/assets/', '/.well-known/'];

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
    return new Response(request.method === 'HEAD' ? null : response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  if (PASS_THROUGH_PREFIXES.some((prefix) => pathname.startsWith(prefix)) || /\.[a-z0-9]{1,12}$/i.test(pathname)) {
    const response = await originFetch(request);
    if (response.status !== 404) return response;
    const headers = new Headers(response.headers);
    headers.set('x-robots-tag', 'noindex, nofollow');
    return new Response(response.body, { status: 404, statusText: 'Not Found', headers });
  }

  return notFound(request, originFetch);
}

export default {
  fetch(request) {
    return handleRequest(request);
  },
};
