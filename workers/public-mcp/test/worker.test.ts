import { describe, expect, it, vi } from 'vitest';
import { createWorker } from '../src/index';
import type { Env, RateLimitBinding } from '../src/types';

const now = new Date('2026-07-14T12:00:00.000Z');
const allow: RateLimitBinding = { limit: vi.fn(async () => ({ success: true })) };

function submission(clientReviewed = false) {
  const at = now.toISOString();
  return {
    intake_id: 'int_abcdefghijkl', session_id: 'ses_abcdefghijkl', submission_id: 'sub_abcdefghijkl',
    revision: 1, supersedes_submission_id: null, form_id: 'general', form_version: '1.0.1', locale: 'en-US',
    submitted_at: at, trace_id: 'trace-abcdefghijkl', client_reviewed: clientReviewed,
    identity: { contact_name: 'Test Client', email: 'private@example.com', phone: null, organization: 'Test Org', organization_domain: null, existing_client_reference: null },
    answers: [{ question_id: 'signal_summary', value: 'Private answer', display_value: null, answered_at: at, source: 'client', data_classification: 'client_confidential' }],
    artifacts: [],
    consents: [{ consent_id: 'process_intake', notice_version: '1.0.1', granted: true, recorded_at: at }],
    client_context: { entry_url: 'https://hyperion-industries.dev/intake/general', referrer_category: null, effects_mode: 'static', save_resume_used: false },
  };
}

function env(service = vi.fn(async (request: Request) => new Response(JSON.stringify({ ok: true, path: new URL(request.url).pathname, receipt: { receipt_id: 'rcp_test' } }), { status: 200, headers: { 'content-type': 'application/json' } }))): Env {
  return {
    SITE_ORIGIN: 'https://hyperion-industries.dev', MCP_CONFIRMATION_SECRET: 'a-test-secret-longer-than-thirty-two-characters',
    OPERATOR_SERVICE: { fetch: service }, DISCOVERY_RATE_LIMITER: allow, SEARCH_RATE_LIMITER: allow,
    EVALUATE_RATE_LIMITER: allow, PREPARE_RATE_LIMITER: allow, SUBMIT_RATE_LIMITER: allow, RESUME_RATE_LIMITER: allow,
  };
}

function post(method: string, params: Record<string, unknown> = {}, headers: HeadersInit = {}) {
  return new Request('https://mcp.hyperion-industries.dev/mcp', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
}

async function body(response: Response): Promise<any> { return response.json(); }

describe('public retrieval MCP', () => {
  it('initializes as a stateless Streamable HTTP server', async () => {
    const response = await createWorker({ now: () => now, randomUUID: () => 'req-1', log: vi.fn() }).fetch(post('initialize', { protocolVersion: '2025-06-18' }), env());
    expect(response.status).toBe(200);
    expect((await body(response)).result.serverInfo.name).toBe('dev.hyperion-industries/public-retrieval');
    expect(response.headers.get('mcp-protocol-version')).toBe('2025-06-18');
  });

  it('lists and reads only approved public resources', async () => {
    const worker = createWorker({ now: () => now, randomUUID: () => 'req-2', log: vi.fn() });
    const listed = await body(await worker.fetch(post('resources/list'), env()));
    expect(listed.result.resources.some((resource: { uri: string }) => resource.uri === 'hyperion://company')).toBe(true);
    const read = await body(await worker.fetch(post('resources/read', { uri: 'hyperion://route/founders--victor-amani' }), env()));
    expect(read.result.contents[0].text).toContain('/founders/victor-amani');
    expect(read.result.contents[0].text).not.toContain('sourceFiles');
  });

  it('searches deterministically and exposes the truthful maturity label', async () => {
    const response = await createWorker({ now: () => now, randomUUID: () => 'req-3', log: vi.fn() }).fetch(post('tools/call', { name: 'search_hyperion', arguments: { query: 'chronos', limit: 3 } }), env());
    const result = await body(response);
    expect(result.result.structuredContent.results[0].route).toBe('/chronos');
    expect(result.result.structuredContent.results[0].maturity).toBeTruthy();
  });

  it('rejects unexpected browser origins but permits absent Origin', async () => {
    const worker = createWorker({ now: () => now, randomUUID: () => 'req-4', log: vi.fn() });
    expect((await worker.fetch(post('ping'), env())).status).toBe(200);
    const rejected = await worker.fetch(post('ping', {}, { origin: 'https://evil.example' }), env());
    expect(rejected.status).toBe(403);
  });

  it('binds preparation to the reviewed payload and derives replay-safe idempotency', async () => {
    const service = vi.fn(async (request: Request) => new Response(JSON.stringify({ ok: true, receipt: { receipt_id: 'rcp_test' } }), { status: 200, headers: { 'content-type': 'application/json' } }));
    const logs: unknown[] = [];
    const worker = createWorker({ now: () => now, randomUUID: () => 'nonce-1', log: (_event, metadata) => logs.push(metadata) });
    const preparedResponse = await worker.fetch(post('tools/call', { name: 'prepare_intake_submission', arguments: { payload: submission(false) } }), env(service));
    const prepared = (await body(preparedResponse)).result.structuredContent;
    expect(prepared.review.values_redacted).toBe(true);
    expect(JSON.stringify(prepared.review)).not.toContain('private@example.com');
    expect(JSON.stringify(prepared.review)).not.toContain('Private answer');

    const finalPayload = submission(true);
    const submitArgs = { name: 'submit_intake', arguments: { payload: finalPayload, confirmation_token: prepared.confirmation_token, client_reviewed: true } };
    const first = await body(await worker.fetch(post('tools/call', submitArgs), env(service)));
    const second = await body(await worker.fetch(post('tools/call', submitArgs), env(service)));
    expect(first.result.isError).not.toBe(true);
    expect(second.result.isError).not.toBe(true);
    expect(service).toHaveBeenCalledTimes(2);
    const firstKey = (service.mock.calls[0]?.[0] as Request).headers.get('idempotency-key');
    const secondKey = (service.mock.calls[1]?.[0] as Request).headers.get('idempotency-key');
    expect(firstKey).toBe(secondKey);
    expect(JSON.stringify(logs)).not.toContain('private@example.com');
    expect(JSON.stringify(logs)).not.toContain('Private answer');
  });

  it('rejects a changed payload after preparation', async () => {
    const worker = createWorker({ now: () => now, randomUUID: () => 'nonce-2', log: vi.fn() });
    const prepared = (await body(await worker.fetch(post('tools/call', { name: 'prepare_intake_submission', arguments: { payload: submission(false) } }), env()))).result.structuredContent;
    const changed = submission(true); const firstAnswer = changed.answers[0]; if (firstAnswer) firstAnswer.value = 'Changed after review';
    const result = await body(await worker.fetch(post('tools/call', { name: 'submit_intake', arguments: { payload: changed, confirmation_token: prepared.confirmation_token, client_reviewed: true } }), env()));
    expect(result.result.isError).toBe(true);
    expect(result.result.structuredContent.error.code).toBe('payload_changed');
  });

  it('never offers draft-reading tools and fails unknown tools safely', async () => {
    const listed = await body(await createWorker({ now: () => now, randomUUID: () => 'req-5', log: vi.fn() }).fetch(post('tools/list'), env()));
    expect(listed.result.tools.map((entry: { name: string }) => entry.name)).not.toContain('get_intake_draft');
    const unknown = await body(await createWorker({ now: () => now, randomUUID: () => 'req-6', log: vi.fn() }).fetch(post('tools/call', { name: 'get_intake_draft', arguments: {} }), env()));
    expect(unknown.result.isError).toBe(true);
  });
});
