import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { createIntakeProgressRecord, readIntakeProgress } from '../../../src/features/intake/localProgress.js';
import { handleRequest } from '../src/index.js';

const rootUrl = new URL('../../../', import.meta.url);
const intakeSource = fs.readFileSync(new URL('src/features/intake/IntakePage.jsx', rootUrl), 'utf8');
const indexHtml = fs.readFileSync(new URL('index.html', rootUrl), 'utf8');
const originFetch = async (request) => new Response(`<title>${new URL(request.url).pathname}</title>`, {
  status: 200,
  headers: { 'content-type': 'text/html; charset=utf-8' },
});

test('intake browser persistence contains only opaque identifiers and UI progress', () => {
  const record = createIntakeProgressRecord({
    lane: 'forge',
    effects: 'reduced',
    step: 3,
    revision: 2,
    supersedes: 'sub_previous123',
    ids: {
      intake: 'int_abcdefghijkl',
      session: 'ses_abcdefghijkl',
      draft: 'drf_abcdefghijkl',
      trace: 'trc_abcdefghijkl',
      idempotency: 'idem_abcdefghijkl',
      identity: { email: 'private@example.com' },
      answers: { need: 'private requirement' },
    },
    identity: { email: 'private@example.com' },
    answers: { need: 'private requirement' },
  }, 1000);
  const serialized = JSON.stringify(record);

  assert.doesNotMatch(serialized, /private@example\.com|private requirement/);
  assert.deepEqual(Object.keys(record.ids).sort(), ['draft', 'idempotency', 'intake', 'session', 'trace']);
  assert.doesNotMatch(intakeSource, /localStorage|workers\.dev/);
});

test('legacy intake drafts are immediately rewritten without sensitive fields', () => {
  const storage = new Map();
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  };
  storage.set('hyperion-intake-v1:forge', JSON.stringify({
    lane: 'forge',
    effects: 'reduced',
    step: 2,
    revision: 1,
    supersedes: null,
    ids: { intake: 'int_a', session: 'ses_a', draft: 'drf_a', trace: 'trc_a', idempotency: 'idem_a' },
    draft_id: 'drf_a',
    identity: { email: 'legacy-private@example.com' },
    answers: { need: 'legacy private requirement' },
    saved_at: Date.now(),
    expires_at: Date.now() + 60_000,
  }));

  const progress = readIntakeProgress('forge');
  const persisted = storage.get('hyperion-intake-v1:forge') || '';
  assert.equal(progress?.draft_id, 'drf_a');
  assert.doesNotMatch(persisted, /legacy-private@example\.com|legacy private requirement|identity|answers/);
  delete globalThis.localStorage;
});

test('intake HTML does not statically load Google Tag Manager', () => {
  assert.doesNotMatch(indexHtml, /<script[^>]+src=["'][^"']*googletagmanager/i);
  assert.match(indexHtml, /const isIntakePath = path === '\/intake'/);
  assert.match(indexHtml, /https:\/\/www\.googletagmanager\.com\/gtag\/js/);
});

test('intake route responses restrict scripts and connections to first party', async () => {
  const response = await handleRequest(new Request('https://hyperion-industries.dev/intake/forge'), originFetch);
  const csp = response.headers.get('content-security-policy') || '';

  assert.equal(response.status, 200);
  assert.match(csp, /script-src 'self'/);
  assert.match(csp, /connect-src 'self'/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.doesNotMatch(csp, /googletagmanager|google-analytics|unsafe-inline[^;]*script/);
  assert.equal(response.headers.get('permissions-policy'), 'camera=(), microphone=(), geolocation=(), payment=()');
});

test('non-intake public routes retain their existing analytics posture', async () => {
  const response = await handleRequest(new Request('https://hyperion-industries.dev/chronos'), originFetch);
  assert.equal(response.headers.get('content-security-policy'), null);
});
