import assert from 'node:assert/strict';
import test from 'node:test';
import { FORGE_GUIDE_FALLBACK, isForgeGuideBundle } from '../../../src/data/forgeGuideBundle.js';
import {
  GUIDE_SKIPPED,
  deriveRecommendations,
  deriveRequirements,
  mapGuideToIntake,
  migrateLegacyDraft,
  sha256Document,
  visibleQuestions,
} from '../../../src/features/forge-configurator/forgeGuideModel.js';
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

test('Forge guide serves a verified, source-opaque same-origin bundle', async () => {
  const response = await handleRequest(
    new Request('https://hyperion-industries.dev/api/forge/guide'),
    originFetch,
  );
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.source_posture, 'bundled_verified');
  assert.equal(payload.bundle.schema_version, 'forge-guide-bundle/1');
  assert.equal(payload.bundle.graph.schema_version, 'forge-question-graph/1');
  assert.equal(payload.bundle.graph.questions.length, 11);
  assert.equal(payload.bundle.graph.express_question_ids.length, 3);
  assert.equal(payload.bundle.sources.length, 15);
  assert.match(payload.bundle.bundle_hash, /^[a-f0-9]{64}$/);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.doesNotMatch(JSON.stringify(payload), /airtable_pat|bearer|supplier|acquisition_plan|customer_reference|price_minor/i);
});

test('Forge guide rejects mutations and supports bodyless HEAD', async () => {
  const post = await handleRequest(
    new Request('https://hyperion-industries.dev/api/forge/guide', { method: 'POST' }),
    originFetch,
  );
  assert.equal(post.status, 405);
  assert.equal((await post.json()).error.code, 'method_not_allowed');

  const head = await handleRequest(
    new Request('https://hyperion-industries.dev/api/forge/guide', { method: 'HEAD' }),
    originFetch,
  );
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
});

test('Forge guide validator rejects active links and remote product media', () => {
  const activeLink = structuredClone(FORGE_GUIDE_FALLBACK);
  activeLink.sources[0].source_url = 'javascript:alert(1)';
  assert.equal(isForgeGuideBundle(activeLink), false);

  const remoteMedia = structuredClone(FORGE_GUIDE_FALLBACK);
  remoteMedia.product_views[0].media.path = 'https://tracker.example/forge.jpg';
  assert.equal(isForgeGuideBundle(remoteMedia), false);
});

test('Forge guide paths and requirements projections stay deterministic and explicit', async () => {
  const answers = {
    destination: 'creator',
    workloads: ['adobe-premiere', 'note:Unmatched codec workflow'],
    output_target: ['display-4k'],
    load_pattern: 'all_day',
    privacy_posture: GUIDE_SKIPPED,
    footprint: 'balanced',
    acoustics: 'quiet',
    budget: '2500_4000',
    reuse: GUIDE_SKIPPED,
    service: 'self_service',
    timeline: 'month',
  };
  assert.equal(visibleQuestions(FORGE_GUIDE_FALLBACK, answers, 'express').length, 3);
  assert.equal(visibleQuestions(FORGE_GUIDE_FALLBACK, answers, 'full').length, 11);

  const first = deriveRequirements(FORGE_GUIDE_FALLBACK, answers, ['quieter']);
  const second = deriveRequirements(FORGE_GUIDE_FALLBACK, answers, ['quieter']);
  assert.deepEqual(first, second);
  assert.equal(first.schema_version, 'forge-requirements/1');
  assert.equal(first.workload_profile, 'creator');
  assert.equal(first.budget.parts_ceiling_minor, 400000);
  assert.equal(first.priorities.acoustics, 5);
  assert.deepEqual(first.operator_notes, ['Unmatched codec workflow']);
  assert.ok(first.unresolved.some((item) => item.field === 'privacy_posture' && item.reason_code === 'visitor_skipped'));
  assert.equal(await sha256Document(first), await sha256Document(second));
});

test('counterfactuals alter public lane posture without creating engineering truth', () => {
  const answers = { destination: 'gaming', footprint: 'balanced', acoustics: 'balanced' };
  const base = deriveRecommendations(FORGE_GUIDE_FALLBACK, answers, []);
  const small = deriveRecommendations(FORGE_GUIDE_FALLBACK, answers, ['smaller']);
  const headroom = deriveRecommendations(FORGE_GUIDE_FALLBACK, answers, ['performance_headroom']);
  assert.equal(base.items[0].lane, 'gaming');
  assert.equal(small.items[0].lane, 'sff');
  assert.equal(headroom.items[0].lane, 'custom-loop');
  assert.ok(small.reason_codes.includes('counterfactual.smaller'));
});

test('legacy drafts migrate without treating free text as a capability fact', () => {
  const migrated = migrateLegacyDraft({
    expires_at: Date.now() + 10_000,
    branch: 'local_ai',
    answers: {
      'forge.applications': 'Private experimental model',
      'forge.budget': '4000_6500',
      'forge.timeline': 'flexible',
    },
  });
  assert.equal(migrated.migrated_from, 'local-storage-v1');
  assert.equal(migrated.answers.destination, 'local_ai');
  assert.equal(migrated.answers.budget, '4000_plus');
  assert.deepEqual(migrated.answers.workloads, ['note:Private experimental model']);

  const intake = mapGuideToIntake(migrated.answers);
  assert.equal(intake['forge.system_type'], 'local_ai');
  assert.equal(intake['forge.local_first'], 'unknown');
});
