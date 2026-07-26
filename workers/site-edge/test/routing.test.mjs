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

test('Forge catalog direct navigation resolves its generated canonical shell', async () => {
  const response = await handleRequest(new Request('https://hyperion-industries.dev/forge/catalog'), originFetch);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-hyperion-canonical-route'), '/forge/catalog');
  assert.equal(response.headers.get('x-hyperion-origin-path'), '/forge/catalog/index.html');
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

const airtableEnv = {
  AIRTABLE_PAT: 'test-secret-never-returned',
  AIRTABLE_BASE_ID: 'app12345678901234',
  AIRTABLE_TABLE_ID: 'tbl12345678901234',
  AIRTABLE_VIEW_ID: 'viw12345678901234',
};

const validAirtableFields = {
  Slug: 'operator-workstation',
  Published: true,
  'Display order': 5,
  Eyebrow: 'OPERATOR LANE · CURATED',
  Title: 'Operator Workstation',
  Lane: 'creator',
  Summary: 'A curated public presentation that remains anchored to a HypOM projection.',
  'Workload tags': ['editing', 'local tools'],
  Highlights: ['Serviceable platform', 'Evidence-bound projection'],
  'Media path': '/assets/forge/media-v1/posters/hyperion-workstation-core-card.jpg',
  'Media alt': 'Hyperion workstation core',
  'Source projection hash': 'a'.repeat(64),
};

test('Forge products use the verified fallback when Airtable is not configured', async () => {
  const response = await handleRequest(new Request('https://hyperion-industries.dev/api/forge/products'), originFetch);
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.source_posture, 'bundled_fallback');
  assert.equal(payload.degraded_reason, 'airtable_not_configured');
  assert.equal(payload.items.length, 5);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
});

test('Forge products map only valid allowlisted Airtable presentation fields', async () => {
  let capturedUrl;
  let capturedOptions;
  const airtableFetch = async (url, options) => {
    capturedUrl = new URL(url);
    capturedOptions = options;
    return Response.json({
      records: [
        { id: 'recGood', fields: { ...validAirtableFields, 'Ignored secret field': 'must-not-leak' } },
        { id: 'recBadMedia', fields: { ...validAirtableFields, Slug: 'bad-media', 'Media path': 'https://tracker.example/product.jpg' } },
        { id: 'recDraft', fields: { ...validAirtableFields, Slug: 'draft', Published: false } },
      ],
    });
  };
  const response = await handleRequest(
    new Request('https://hyperion-industries.dev/api/forge/products'),
    originFetch,
    airtableEnv,
    airtableFetch,
  );
  const payload = await response.json();

  assert.equal(capturedUrl.origin, 'https://api.airtable.com');
  assert.equal(capturedUrl.pathname, `/v0/${airtableEnv.AIRTABLE_BASE_ID}/${airtableEnv.AIRTABLE_TABLE_ID}`);
  assert.equal(capturedUrl.searchParams.get('pageSize'), '100');
  assert.equal(capturedUrl.searchParams.get('view'), airtableEnv.AIRTABLE_VIEW_ID);
  assert.equal(capturedOptions.headers.authorization, `Bearer ${airtableEnv.AIRTABLE_PAT}`);
  assert.equal(payload.source_posture, 'airtable_curated');
  assert.equal(payload.items.length, 1);
  assert.equal(payload.items[0].slug, 'operator-workstation');
  assert.equal(payload.items[0].source.authority, 'hypom');
  assert.doesNotMatch(JSON.stringify(payload), /test-secret|Ignored secret field|recGood/);
  assert.match(payload.bundle_hash, /^[0-9a-f]{64}$/);
});

test('Airtable rate limits and malformed payloads degrade without retrying or leaking details', async () => {
  let calls = 0;
  const limitedFetch = async () => {
    calls += 1;
    return new Response('rate limited', { status: 429 });
  };
  const limitedResponse = await handleRequest(
    new Request('https://hyperion-industries.dev/api/forge/products'),
    originFetch,
    airtableEnv,
    limitedFetch,
  );
  const limitedPayload = await limitedResponse.json();
  assert.equal(calls, 1);
  assert.equal(limitedPayload.source_posture, 'bundled_fallback');
  assert.equal(limitedPayload.degraded_reason, 'airtable_rate_limited');
  assert.doesNotMatch(JSON.stringify(limitedPayload), /test-secret|app123|tbl123|viw123/);

  const malformedResponse = await handleRequest(
    new Request('https://hyperion-industries.dev/api/forge/products'),
    originFetch,
    airtableEnv,
    async () => Response.json({ records: 'not-an-array' }),
  );
  assert.equal((await malformedResponse.json()).degraded_reason, 'airtable_invalid_payload');
});

test('Airtable pagination is bounded and fails back instead of serving a partial catalog', async () => {
  let calls = 0;
  const endlessFetch = async () => {
    calls += 1;
    return Response.json({
      records: [{ id: `rec${calls}`, fields: { ...validAirtableFields, Slug: `page-${calls}` } }],
      offset: `next-page-${calls}`,
    });
  };
  const response = await handleRequest(
    new Request('https://hyperion-industries.dev/api/forge/products'),
    originFetch,
    airtableEnv,
    endlessFetch,
  );
  const payload = await response.json();
  assert.equal(calls, 3);
  assert.equal(payload.source_posture, 'bundled_fallback');
  assert.equal(payload.degraded_reason, 'airtable_pagination_limit');
  assert.equal(payload.items.length, 5);
});

test('Forge products reject state-changing methods and support bodyless HEAD', async () => {
  const post = await handleRequest(
    new Request('https://hyperion-industries.dev/api/forge/products', { method: 'POST' }),
    originFetch,
  );
  assert.equal(post.status, 405);
  assert.equal((await post.json()).error.code, 'method_not_allowed');

  const head = await handleRequest(
    new Request('https://hyperion-industries.dev/api/forge/products', { method: 'HEAD' }),
    originFetch,
  );
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
});
