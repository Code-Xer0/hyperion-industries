import { PUBLIC_RETRIEVAL_MANIFEST as manifest } from './generated/public-retrieval.generated';
import { forwardIntake, IntakeError, prepareSubmission, verifySubmission } from './intake';
import type { Env, RateLimitBinding, RuntimeDependencies } from './types';

type JsonRpcId = string | number | null;
type JsonRpcRequest = { jsonrpc?: string; id?: JsonRpcId; method?: string; params?: Record<string, unknown> };

const SERVER_ID = 'dev.hyperion-industries/public-retrieval';
const SERVER_VERSION = '0.1.0';
const PROTOCOLS = new Set(['2025-11-25', '2025-06-18']);
const defaultDeps: RuntimeDependencies = {
  now: () => new Date(),
  randomUUID: () => crypto.randomUUID(),
  log: (event, metadata) => console.log(JSON.stringify({ event, ...metadata })),
};

const fixedResources = [
  ['hyperion://company', 'Hyperion Industries company record', 'Approved company, availability, and service-area data.'],
  ['hyperion://routes', 'Canonical public routes', 'Approved, indexable public route graph.'],
  ['hyperion://offerings', 'Public offerings', 'Offerings, maturity, availability, and intake relationships.'],
  ['hyperion://identities', 'Public identities', 'Approved public identity relationships.'],
  ['hyperion://intake-contract', 'Intake contract', 'Public lanes and operator-review boundary.'],
] as const;

const templates = [
  ['hyperion://route/{routeId}', 'Hyperion public route'],
  ['hyperion://offering/{offeringId}', 'Hyperion public offering'],
  ['hyperion://corpus/{entryId}', 'Approved public corpus entry'],
] as const;

const tools = [
  tool('search_hyperion', 'Search only the approved Hyperion public projection.', { query: { type: 'string', minLength: 1, maxLength: 240 }, limit: { type: 'integer', minimum: 1, maximum: 10 } }, ['query'], true),
  tool('get_public_route', 'Get one canonical public route by ID or path.', { route: { type: 'string', minLength: 1, maxLength: 160 } }, ['route'], true),
  tool('list_offerings', 'List public offerings, optionally filtered by maturity or availability text.', { query: { type: 'string', maxLength: 160 } }, [], true),
  tool('resolve_public_identity', 'Resolve an approved public name or alias.', { query: { type: 'string', minLength: 1, maxLength: 160 } }, ['query'], true),
  tool('evaluate_intake', 'Evaluate lane answers through the existing deterministic intake router without submitting.', { lane: { type: 'string', enum: manifest.intake.lanes.map((lane) => lane.id) }, answers: { type: 'object' }, automated_classification: { type: 'boolean' } }, ['lane', 'answers'], false),
  tool('prepare_intake_submission', 'Validate an exact intake payload and return a redacted review plus a ten-minute confirmation token.', { payload: { type: 'object' } }, ['payload'], false),
  tool('submit_intake', 'Submit the exact reviewed payload using its short-lived confirmation token.', { payload: { type: 'object' }, confirmation_token: { type: 'string', minLength: 32 }, client_reviewed: { const: true } }, ['payload', 'confirmation_token', 'client_reviewed'], false),
  tool('request_intake_resume', 'Request a magic-link email for an existing draft. Saved draft content is never returned through MCP.', { email: { type: 'string', maxLength: 320 }, draft_id: { type: 'string', pattern: '^drf_[A-Za-z0-9_-]{12,64}$' } }, ['email', 'draft_id'], false),
];

function tool(name: string, description: string, properties: Record<string, unknown>, required: string[], readOnly: boolean) {
  return { name, description, inputSchema: { type: 'object', additionalProperties: false, properties, required }, annotations: { readOnlyHint: readOnly, destructiveHint: false, idempotentHint: readOnly || name === 'submit_intake', openWorldHint: false } };
}

function rpcResult(id: JsonRpcId | undefined, result: unknown): Response {
  return json({ jsonrpc: '2.0', id: id ?? null, result });
}

function rpcError(id: JsonRpcId | undefined, code: number, message: string, data?: unknown): Response {
  return json({ jsonrpc: '2.0', id: id ?? null, error: { code, message, ...(data === undefined ? {} : { data }) } });
}

function json(value: unknown, status = 200, headers?: HeadersInit): Response {
  const output = new Headers(headers);
  output.set('content-type', 'application/json; charset=utf-8');
  output.set('cache-control', status === 200 ? 'no-store' : 'no-store');
  output.set('x-content-type-options', 'nosniff');
  output.set('referrer-policy', 'no-referrer');
  return new Response(JSON.stringify(value), { status, headers: output });
}

function clientKey(request: Request, scope: string): string {
  return `${scope}:${request.headers.get('cf-connecting-ip') || 'unknown'}:${(request.headers.get('user-agent') || 'unknown').slice(0, 120)}`;
}

async function rateLimit(binding: RateLimitBinding | undefined, request: Request, scope: string): Promise<void> {
  if (!binding) throw new IntakeError('rate_limit_unavailable', 'Abuse protection is unavailable.', 503);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(clientKey(request, scope)));
  const key = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  const result = await binding.limit({ key });
  if (!result.success) throw new IntakeError('rate_limited', 'Too many requests. Try again later.', 429);
}

function allowedOrigin(request: Request, env: Env): string | undefined {
  const origin = request.headers.get('origin');
  if (!origin) return undefined;
  if (origin !== (env.SITE_ORIGIN || 'https://hyperion-industries.dev')) throw new IntakeError('origin_rejected', 'Browser origin is not permitted.', 403);
  return origin;
}

function withTransportHeaders(response: Response, requestId: string, origin?: string, protocol?: string): Response {
  const headers = new Headers(response.headers);
  headers.set('x-request-id', requestId);
  headers.set('mcp-protocol-version', protocol || '2025-11-25');
  if (origin) { headers.set('access-control-allow-origin', origin); headers.append('vary', 'Origin'); }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function toolResult(value: unknown, isError = false) {
  return { content: [{ type: 'text', text: JSON.stringify(value) }], structuredContent: value, ...(isError ? { isError: true } : {}) };
}

function normalize(value: unknown): string { return String(value || '').trim().toLocaleLowerCase(); }

function search(query: string, limit: number) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  const candidates = [
    ...manifest.routes.map((route) => ({ kind: 'route', id: route.id, title: route.title, route: route.path, summary: route.summary, maturity: route.maturity })),
    ...manifest.offerings.map((offering) => ({ kind: 'offering', id: offering.id, title: offering.name, route: offering.route, summary: offering.summary, maturity: offering.maturity })),
    ...manifest.identities.map((identity) => ({ kind: 'identity', id: identity.id, title: identity.name, route: new URL(identity.canonicalUrl).pathname, summary: identity.relationship, maturity: 'public identity' })),
    ...manifest.corpus.entries.map((entry) => ({ kind: 'corpus', id: entry.id, title: entry.title, route: entry.route, summary: entry.content, maturity: 'approved public corpus' })),
  ];
  return candidates.map((candidate) => {
    const id = normalize(candidate.id); const title = normalize(candidate.title); const body = normalize(`${candidate.summary} ${candidate.route}`);
    const score = terms.reduce((total, term) => total + (id === term ? 100 : id.includes(term) ? 35 : 0) + (title.includes(term) ? 20 : 0) + (body.includes(term) ? 5 : 0), 0);
    return { ...candidate, score };
  }).filter((candidate) => candidate.score > 0).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, limit);
}

function readResource(uri: string): unknown {
  if (uri === 'hyperion://company') return manifest.company;
  if (uri === 'hyperion://routes') return manifest.routes;
  if (uri === 'hyperion://offerings') return manifest.offerings;
  if (uri === 'hyperion://identities') return manifest.identities;
  if (uri === 'hyperion://intake-contract') return manifest.intake;
  const match = uri.match(/^hyperion:\/\/(route|offering|corpus)\/([a-z0-9-]+)$/);
  if (!match) throw new IntakeError('resource_not_found', 'Public resource was not found.', 404);
  const [, kind, id] = match;
  const value = kind === 'route' ? manifest.routes.find((item) => item.id === id)
    : kind === 'offering' ? manifest.offerings.find((item) => item.id === id)
      : manifest.corpus.entries.find((item) => item.id === id);
  if (!value) throw new IntakeError('resource_not_found', 'Public resource was not found.', 404);
  return value;
}

async function callTool(name: string, args: Record<string, unknown>, request: Request, env: Env, deps: RuntimeDependencies): Promise<unknown> {
  if (name === 'search_hyperion') { await rateLimit(env.SEARCH_RATE_LIMITER, request, name); return { revision: manifest.revision, results: search(String(args.query || ''), Math.min(10, Math.max(1, Number(args.limit) || 5))) }; }
  if (name === 'get_public_route') { const input = normalize(args.route); const route = manifest.routes.find((item) => normalize(item.id) === input || normalize(item.path) === input); if (!route) throw new IntakeError('route_not_found', 'Public route was not found.', 404); return route; }
  if (name === 'list_offerings') { const query = normalize(args.query); return { revision: manifest.revision, offerings: query ? manifest.offerings.filter((item) => normalize(JSON.stringify(item)).includes(query)) : manifest.offerings }; }
  if (name === 'resolve_public_identity') { const query = normalize(args.query); const identities = manifest.identities.filter((item) => normalize(`${item.name} ${item.alternateNames.join(' ')}`).includes(query) || item.alternateNames.some((alias) => normalize(alias) === query)); return { revision: manifest.revision, identities }; }
  if (name === 'evaluate_intake') { await rateLimit(env.EVALUATE_RATE_LIMITER, request, name); return forwardIntake(env, '/api/intake/evaluate', args); }
  const secret = env.MCP_CONFIRMATION_SECRET?.trim();
  if (name === 'prepare_intake_submission') { await rateLimit(env.PREPARE_RATE_LIMITER, request, name); if (!secret) throw new IntakeError('confirmation_unavailable', 'Confirmation service is unavailable.', 503); return prepareSubmission(args.payload, secret, manifest.revision, deps.now(), deps.randomUUID()); }
  if (name === 'submit_intake') { await rateLimit(env.SUBMIT_RATE_LIMITER, request, name); if (!secret) throw new IntakeError('confirmation_unavailable', 'Confirmation service is unavailable.', 503); if (args.client_reviewed !== true) throw new IntakeError('client_review_required', 'client_reviewed must be true.'); const verified = await verifySubmission(args.payload, String(args.confirmation_token || ''), secret, deps.now()); return forwardIntake(env, '/api/intake/submissions', verified.payload, verified.idempotencyKey); }
  if (name === 'request_intake_resume') { await rateLimit(env.RESUME_RATE_LIMITER, request, name); return forwardIntake(env, '/api/intake/resume/request', { email: args.email, draft_id: args.draft_id }); }
  throw new IntakeError('tool_not_found', 'Tool was not found.', 404);
}

async function handleRpc(rpc: JsonRpcRequest, request: Request, env: Env, deps: RuntimeDependencies): Promise<Response> {
  if (rpc.jsonrpc !== '2.0' || typeof rpc.method !== 'string') return rpcError(rpc.id, -32600, 'Invalid Request');
  const protocol = request.headers.get('mcp-protocol-version') || String(rpc.params?.protocolVersion || '2025-11-25');
  if (!PROTOCOLS.has(protocol)) return rpcError(rpc.id, -32602, 'Unsupported MCP protocol version', { supported: [...PROTOCOLS] });
  if (rpc.method === 'initialize') return rpcResult(rpc.id, { protocolVersion: protocol, capabilities: { resources: {}, tools: { listChanged: false } }, serverInfo: { name: SERVER_ID, title: 'Hyperion Public Retrieval', version: SERVER_VERSION }, instructions: 'Use only the approved public corpus. Intake is operator-reviewed and never implies acceptance.' });
  if (rpc.method === 'notifications/initialized') return new Response(null, { status: 202 });
  if (rpc.method === 'ping') return rpcResult(rpc.id, {});
  if (rpc.method === 'resources/list') return rpcResult(rpc.id, { resources: fixedResources.map(([uri, name, description]) => ({ uri, name, description, mimeType: 'application/json' })) });
  if (rpc.method === 'resources/templates/list') return rpcResult(rpc.id, { resourceTemplates: templates.map(([uriTemplate, name]) => ({ uriTemplate, name, mimeType: 'application/json' })) });
  if (rpc.method === 'resources/read') { const uri = String(rpc.params?.uri || ''); return rpcResult(rpc.id, { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(readResource(uri), null, 2) }] }); }
  if (rpc.method === 'tools/list') return rpcResult(rpc.id, { tools });
  if (rpc.method === 'tools/call') {
    const name = String(rpc.params?.name || ''); const args = rpc.params?.arguments && typeof rpc.params.arguments === 'object' ? rpc.params.arguments as Record<string, unknown> : {};
    try { return rpcResult(rpc.id, toolResult(await callTool(name, args, request, env, deps))); }
    catch (error) { const message = error instanceof Error ? error.message : 'Tool execution failed.'; const code = error instanceof IntakeError ? error.code : 'tool_error'; return rpcResult(rpc.id, toolResult({ ok: false, error: { code, message } }, true)); }
  }
  return rpcError(rpc.id, -32601, 'Method not found');
}

export function createWorker(overrides: Partial<RuntimeDependencies> = {}) {
  const deps = { ...defaultDeps, ...overrides };
  return { async fetch(request: Request, env: Env): Promise<Response> {
    const requestId = deps.randomUUID(); const started = deps.now().getTime(); const url = new URL(request.url); let toolName = 'transport'; let response: Response; let origin: string | undefined; let negotiatedProtocol = request.headers.get('mcp-protocol-version') || '2025-11-25';
    try {
      origin = allowedOrigin(request, env);
      if (request.method === 'OPTIONS') response = new Response(null, { status: 204, headers: { 'access-control-allow-methods': 'POST, GET, OPTIONS', 'access-control-allow-headers': 'content-type, mcp-protocol-version', 'access-control-max-age': '600' } });
      else if (url.pathname === '/health' && request.method === 'GET') response = json({ ok: true, server: SERVER_ID, version: SERVER_VERSION, corpus_revision: manifest.revision, corpus_sha256: manifest.sha256 });
      else if (url.pathname === '/server.json' && request.method === 'GET') response = json({ $schema: 'https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json', name: SERVER_ID, title: 'Hyperion Public Retrieval', description: 'Corpus-bound public retrieval and governed intake for Hyperion Industries.', version: SERVER_VERSION, websiteUrl: 'https://hyperion-industries.dev/mcp', remotes: [{ type: 'streamable-http', url: 'https://mcp.hyperion-industries.dev/mcp' }] });
      else if (url.pathname !== '/mcp') response = json({ error: 'not_found' }, 404);
      else if (request.method === 'GET') response = new Response(null, { status: 405, headers: { allow: 'POST' } });
      else if (request.method !== 'POST') response = new Response(null, { status: 405, headers: { allow: 'POST' } });
      else {
        await rateLimit(env.DISCOVERY_RATE_LIMITER, request, 'mcp');
        const contentType = request.headers.get('content-type')?.split(';', 1)[0]?.trim();
        if (contentType !== 'application/json') throw new IntakeError('unsupported_media_type', 'Content-Type must be application/json.', 415);
        const text = await request.text(); if (text.length > 1_000_000) throw new IntakeError('body_too_large', 'Request body exceeds one megabyte.', 413);
        let rpc: JsonRpcRequest; try { rpc = JSON.parse(text); } catch { response = rpcError(null, -32700, 'Parse error'); return withTransportHeaders(response, requestId, origin); }
        negotiatedProtocol = request.headers.get('mcp-protocol-version') || String(rpc.params?.protocolVersion || '2025-11-25');
        toolName = rpc.method === 'tools/call' ? String(rpc.params?.name || 'unknown_tool') : String(rpc.method || 'invalid');
        response = await handleRpc(rpc, request, env, deps);
      }
    } catch (error) {
      const status = error instanceof IntakeError ? error.status : 500; const code = error instanceof IntakeError ? error.code : 'internal_error';
      response = json({ error: { code, message: error instanceof Error ? error.message : 'Request failed.' } }, status);
    }
    deps.log('mcp_request', { request_id: requestId, tool: toolName, status: response.status, duration_ms: Math.max(0, deps.now().getTime() - started), corpus_revision: manifest.revision });
    return withTransportHeaders(response, requestId, origin, negotiatedProtocol);
  } };
}

export default createWorker();
