const endpoint = process.env.HYPERION_MCP_ENDPOINT || 'https://mcp.hyperion-industries.dev/mcp';
const healthUrl = new URL('/health', endpoint).href;
const probeHeaders = {
  accept: 'application/json',
  'user-agent': 'Hyperion-Public-MCP-Soft-Launch-Monitor/1.0 (+https://hyperion-industries.dev/mcp)',
};

async function expectJson(response, label) {
  if (!response.ok) throw new Error(`${label} failed with HTTP ${response.status}`);
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) throw new Error(`${label} returned ${contentType || 'no content type'}`);
  return response.json();
}

async function rpc(id, method, params = {}) {
  const started = performance.now();
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { ...probeHeaders, 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
    signal: AbortSignal.timeout(15_000),
  });
  const body = await expectJson(response, method);
  if (body.error) throw new Error(`${method} returned MCP error ${body.error.code}: ${body.error.message}`);
  return { body, durationMs: Math.round(performance.now() - started) };
}

const healthStarted = performance.now();
const health = await expectJson(await fetch(healthUrl, { headers: probeHeaders, signal: AbortSignal.timeout(15_000) }), 'health');
const initialize = await rpc(1, 'initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'hyperion-scheduled-smoke', version: '1.0' } });
const resources = await rpc(2, 'resources/list');
const tools = await rpc(3, 'tools/list');
const search = await rpc(4, 'tools/call', { name: 'search_hyperion', arguments: { query: 'local first chronos', limit: 3 } });

const toolNames = tools.body.result?.tools?.map((tool) => tool.name) || [];
const resourceUris = resources.body.result?.resources?.map((resource) => resource.uri) || [];
const searchResults = search.body.result?.structuredContent?.results || [];
if (health.ok !== true) throw new Error('Health posture is not ready.');
if (initialize.body.result?.serverInfo?.name !== 'dev.hyperion-industries/public-retrieval') throw new Error('Unexpected server identity.');
if (toolNames.length !== 8 || !toolNames.includes('search_hyperion') || !toolNames.includes('submit_intake')) throw new Error('Tool catalog drift detected.');
if (!resourceUris.includes('hyperion://company') || !resourceUris.includes('hyperion://intake-contract')) throw new Error('Resource catalog drift detected.');
if (searchResults[0]?.route !== '/chronos') throw new Error('Deterministic search posture drift detected.');

console.log(JSON.stringify({
  ok: true,
  checkedAt: new Date().toISOString(),
  endpoint,
  server: initialize.body.result.serverInfo.name,
  version: initialize.body.result.serverInfo.version,
  protocol: initialize.body.result.protocolVersion,
  corpusRevision: health.corpus_revision,
  corpusSha256: health.corpus_sha256,
  toolCount: toolNames.length,
  resourceCount: resourceUris.length,
  topSearchRoute: searchResults[0].route,
  durationsMs: { health: Math.round(performance.now() - healthStarted), initialize: initialize.durationMs, resources: resources.durationMs, tools: tools.durationMs, search: search.durationMs },
}));
