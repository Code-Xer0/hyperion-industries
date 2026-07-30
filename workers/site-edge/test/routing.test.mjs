import assert from 'node:assert/strict';
import test from 'node:test';
import { FORGE_GUIDE_FALLBACK, isForgeGuideBundle } from '../../../src/data/forgeGuideBundle.js';
import {
  GUIDE_SKIPPED,
  GUIDE_UNKNOWN,
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

test('allowlisted Card Studio starters resolve the shared designer shell', async () => {
  for (const pathname of [
    '/card-studio/design',
    '/card-studio/design/axis',
    '/card-studio/design/example-axis-consulting',
  ]) {
    const response = await handleRequest(new Request(`https://hyperion-industries.dev${pathname}`), originFetch);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('x-hyperion-canonical-route'), pathname);
    assert.equal(response.headers.get('x-hyperion-origin-path'), '/card-studio/index.html');
  }
});

test('unknown Card Studio starters remain noindex 404s', async () => {
  const response = await handleRequest(
    new Request('https://hyperion-industries.dev/card-studio/design/not-a-starter'),
    originFetch,
  );
  assert.equal(response.status, 404);
  assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
  assert.equal(response.headers.get('x-hyperion-origin-path'), '/404.html');
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

test('search questions may remain unknown or skipped without breaking intake projection', () => {
  for (const unresolvedWorkloads of [GUIDE_UNKNOWN, GUIDE_SKIPPED, undefined]) {
    const intake = mapGuideToIntake({
      destination: 'gaming',
      workloads: unresolvedWorkloads,
      budget: '1500_2500',
    });
    assert.equal(intake['forge.system_type'], 'desktop');
    assert.equal(intake['forge.outcome'], 'Operator clarification required');
    assert.equal(intake['forge.budget'], '1500_2500');
  }
});

test('configurator catalogs remain useful and truthful without managed authorities', async () => {
  const forge = await handleRequest(
    new Request('https://hyperion-industries.dev/api/configurator/forge?limit=100'),
    originFetch,
  );
  const forgePayload = await forge.json();
  assert.equal(forge.status, 200);
  assert.equal(forgePayload.source_posture, 'bundled_fixture_fallback');
  assert.equal(forgePayload.items.length, 22);
  assert.match(forge.headers.get('set-cookie'), /hyperion_subject=.*HttpOnly/);

  const pandora = await handleRequest(
    new Request('https://hyperion-industries.dev/api/configurator/pandora?lane=lite_grid'),
    originFetch,
  );
  const pandoraPayload = await pandora.json();
  assert.equal(pandora.status, 200);
  assert.equal(pandoraPayload.source_posture, 'bundled_fixture_fallback');
  assert.ok(pandoraPayload.items.length > 0);
  assert.ok(pandoraPayload.items.every((item) => item.product_lane === 'lite_grid'));

  const mutation = await handleRequest(
    new Request('https://hyperion-industries.dev/api/configurator/pandora/plans', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    }),
    originFetch,
  );
  assert.equal(mutation.status, 503);
  assert.equal((await mutation.json()).source_posture, 'local_draft_only');
});

test('configurator proxy keeps service tokens at the edge and maps nested authority routes', async () => {
  const requests = [];
  const authorityFetch = async (url, options) => {
    requests.push({ url: new URL(url), options });
    return Response.json({
      schema_version: 'forge-public-candidates/1',
      items: [],
      secret_echo: false,
    });
  };
  const env = {
    HYPOM_PUBLIC_ORIGIN: 'https://hypom.example/',
    HYPOM_PUBLIC_SERVICE_TOKEN: 'hypom-edge-secret',
    PANDORA_PUBLIC_ORIGIN: 'https://pandora.example/',
    PANDORA_PUBLIC_SERVICE_TOKEN: 'pandora-edge-secret',
  };
  const response = await handleRequest(
    new Request('https://hyperion-industries.dev/api/configurator/forge/builds/build_1/runs/run_2/candidates', {
      headers: {
        cookie: 'hyperion_subject=HYP-SUB-abcdefgh12345678; hyperion_account=CRM-ACCOUNT-12345678',
      },
    }),
    originFetch,
    env,
    authorityFetch,
  );
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-hyperion-authority'), 'hypom');
  assert.equal(requests[0].url.pathname, '/public/v1/forge/builds/build_1/runs/run_2/candidates');
  assert.equal(requests[0].options.headers.get('authorization'), 'Bearer hypom-edge-secret');
  assert.equal(requests[0].options.headers.get('x-hyperion-subject'), 'HYP-SUB-abcdefgh12345678');
  assert.equal(requests[0].options.headers.get('x-hyperion-account'), 'CRM-ACCOUNT-12345678');
  assert.doesNotMatch(JSON.stringify(payload), /hypom-edge-secret|pandora-edge-secret/);

  const pandora = await handleRequest(
    new Request('https://hyperion-industries.dev/api/configurator/pandora/plans/plan_1/tal-preview', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': 'preview-once',
      },
      body: '{}',
    }),
    originFetch,
    env,
    authorityFetch,
  );
  assert.equal(pandora.status, 200);
  assert.equal(requests[1].url.pathname, '/public/v1/pandora/plans/plan_1/tal-preview');
  assert.equal(requests[1].options.headers.get('x-hyperion-service-token'), 'pandora-edge-secret');
  assert.equal(requests[1].options.headers.get('idempotency-key'), 'preview-once');

  const rejected = await handleRequest(
    new Request('https://hyperion-industries.dev/api/configurator/forge/admin/secrets'),
    originFetch,
    env,
    authorityFetch,
  );
  assert.equal(rejected.status, 404);
  assert.equal(requests.length, 2);
});

const clientEnv = {
  HYPRM_PUBLIC_ORIGIN: 'https://hyprm.example/',
  HYPRM_PUBLIC_SERVICE_TOKEN: 'hyprm-edge-secret',
  RESEND_API_KEY: 'resend-edge-secret',
  CLIENT_MAGIC_LINK_FROM: 'Hyperion Client Room <access@hyperion-industries.dev>',
  CLIENT_PORTAL_ORIGIN: 'https://hyperion-industries.dev/',
};

test('client magic-link issuance delivers at the edge without returning either secret token', async () => {
  const rawMagic = 'm'.repeat(48);
  const calls = [];
  const clientFetch = async (url, options) => {
    calls.push({ url: new URL(url), options });
    if (new URL(url).origin === 'https://hyprm.example') {
      return Response.json({
        accepted: true,
        delivery: {
          token: rawMagic,
          expires_at: '2026-07-29T20:15:00Z',
          delivery_authority: 'trusted_gateway',
        },
      });
    }
    return Response.json({ id: 'email_sanitized' });
  };
  const response = await handleRequest(
    new Request('https://hyperion-industries.dev/api/client/magic-link', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'https://hyperion-industries.dev',
      },
      body: JSON.stringify({ email: 'client@example.invalid', display_name: 'Sanitized Client' }),
    }),
    originFetch,
    clientEnv,
    clientFetch,
  );
  const payload = await response.json();
  assert.equal(response.status, 202);
  assert.equal(payload.delivery_posture, 'email_requested');
  assert.doesNotMatch(JSON.stringify(payload), new RegExp(rawMagic));
  assert.doesNotMatch(JSON.stringify(payload), /hyprm-edge-secret|resend-edge-secret/);
  assert.equal(calls[0].url.pathname, '/public/v1/client-auth/magic-links');
  assert.equal(calls[0].options.headers.get('x-hyperion-service-token'), 'hyprm-edge-secret');
  assert.equal(calls[1].url.origin, 'https://api.resend.com');
  assert.equal(calls[1].options.headers.authorization, 'Bearer resend-edge-secret');
  assert.match(calls[1].options.headers['Idempotency-Key'], /^client-magic\//);
  assert.match(calls[1].options.body, new RegExp(rawMagic));
  assert.match(response.headers.get('set-cookie'), /hyperion_magic_requested=.*HttpOnly/);
});

test('client account bridge keeps the HypRM session in HttpOnly cookies and serves curated history', async () => {
  const rawMagic = 'n'.repeat(48);
  const rawSession = 's'.repeat(64);
  const accountRef = 'CRM-ACCOUNT-SANITIZED-1234';
  const calls = [];
  const clientFetch = async (url, options) => {
    const parsed = new URL(url);
    calls.push({ url: parsed, options });
    if (parsed.pathname.endsWith('/magic-links/consume')) {
      return Response.json({
        session_token: rawSession,
        session_id: 'CRM-SESSION-SANITIZED',
        expires_at: '2026-08-12T20:00:00Z',
        crm_account_ref: accountRef,
      });
    }
    if (parsed.pathname.endsWith('/client-account/history')) {
      return Response.json({
        schema_version: 'hyprm-client-history/1',
        crm_account_ref: accountRef,
        source_posture: 'hyprm_authoritative_projection',
        events: [{ history_event_id: 'EVENT-1', title: 'Review requested', source_hash: 'a'.repeat(64) }],
        builds: [],
      });
    }
    if (parsed.pathname.endsWith('/client-account/session/revoke')) {
      return Response.json({ revoked: true });
    }
    return Response.json({
      schema_version: 'hyprm-client-account/1',
      account: { crm_account_ref: accountRef, display_name: 'Sanitized Client', relationship_state: 'active' },
      session: { session_id: 'CRM-SESSION-SANITIZED', expires_at: '2026-08-12T20:00:00Z' },
    });
  };
  const consumed = await handleRequest(
    new Request('https://hyperion-industries.dev/api/client/magic-link/consume', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://hyperion-industries.dev' },
      body: JSON.stringify({ token: rawMagic }),
    }),
    originFetch,
    clientEnv,
    clientFetch,
  );
  const consumedPayload = await consumed.json();
  assert.equal(consumed.status, 200);
  assert.equal(consumedPayload.authenticated, true);
  assert.doesNotMatch(JSON.stringify(consumedPayload), new RegExp(rawSession));
  const setCookies = consumed.headers.get('set-cookie');
  assert.match(setCookies, /hyperion_session=.*HttpOnly/);
  assert.match(setCookies, /hyperion_account=.*HttpOnly/);

  const history = await handleRequest(
    new Request('https://hyperion-industries.dev/api/client/history', {
      headers: { cookie: `hyperion_session=${rawSession}; hyperion_account=${accountRef}` },
    }),
    originFetch,
    clientEnv,
    clientFetch,
  );
  const historyPayload = await history.json();
  assert.equal(history.status, 200);
  assert.equal(historyPayload.source_posture, 'hyprm_authoritative_projection');
  assert.equal(calls[1].options.headers.get('authorization'), `Bearer ${rawSession}`);
  assert.equal(calls[1].options.headers.get('x-hyperion-service-token'), 'hyprm-edge-secret');

  const logout = await handleRequest(
    new Request('https://hyperion-industries.dev/api/client/logout', {
      method: 'POST',
      headers: { cookie: `hyperion_session=${rawSession}; hyperion_account=${accountRef}` },
    }),
    originFetch,
    clientEnv,
    clientFetch,
  );
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get('set-cookie'), /Max-Age=0/);
  assert.equal(calls[2].url.pathname, '/public/v1/client-account/session/revoke');
});

test('client-room access fails closed when authority or delivery configuration is absent', async () => {
  let calls = 0;
  const response = await handleRequest(
    new Request('https://hyperion-industries.dev/api/client/magic-link', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'client@example.invalid' }),
    }),
    originFetch,
    {},
    async () => { calls += 1; return Response.json({}); },
  );
  const payload = await response.json();
  assert.equal(response.status, 503);
  assert.equal(payload.source_posture, 'managed_account_unavailable');
  assert.equal(calls, 0);
});
