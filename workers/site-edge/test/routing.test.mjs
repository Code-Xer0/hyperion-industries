import assert from 'node:assert/strict';
import test from 'node:test';
import { handleRequest } from '../src/index.js';

const originFetch = async (request) => new Response(`<title>${new URL(request.url).pathname}</title>`, {
  status: new URL(request.url).pathname === '/missing.svg' ? 404 : 200,
  headers: { 'content-type': 'text/html; charset=utf-8' },
});

test('approved route resolves its generated shell without changing the public URL', async () => {
  const response = await handleRequest(new Request('https://hyperion-industries.dev/chronos'), originFetch);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-hyperion-canonical-route'), '/chronos');
  assert.equal(response.headers.get('x-hyperion-origin-path'), '/chronos/index.html');
});

test('legacy alias redirects in one hop', async () => {
  const response = await handleRequest(new Request('https://hyperion-industries.dev/card-studio/studio.html?ref=test'), originFetch);
  assert.equal(response.status, 301);
  assert.equal(response.headers.get('location'), 'https://hyperion-industries.dev/card-studio?ref=test');
});

test('valid route trailing slash redirects to the clean canonical', async () => {
  const response = await handleRequest(new Request('https://hyperion-industries.dev/dxcard/'), originFetch);
  assert.equal(response.status, 301);
  assert.equal(response.headers.get('location'), 'https://hyperion-industries.dev/dxcard');
});

test('unknown extensionless route returns a noindex 404', async () => {
  const response = await handleRequest(new Request('https://hyperion-industries.dev/not-a-public-route'), originFetch);
  assert.equal(response.status, 404);
  assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
  assert.equal(response.headers.get('x-hyperion-origin-path'), '/404.html');
});

test('missing static asset preserves origin 404', async () => {
  const response = await handleRequest(new Request('https://hyperion-industries.dev/missing.svg'), originFetch);
  assert.equal(response.status, 404);
  assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
});
