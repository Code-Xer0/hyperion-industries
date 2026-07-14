const DEFAULT_API_BASE = '/api/operator';

export async function readOperatorStatus(apiBase = DEFAULT_API_BASE, signal) {
  const response = await fetch(`${normalizeBase(apiBase)}/status`, {
    headers: { accept: 'application/json' },
    cache: 'no-store',
    signal,
  });
  if (!response.ok) throw new Error(`Operator status unavailable (${response.status}).`);
  return response.json();
}

export async function streamOperatorChat({ apiBase = DEFAULT_API_BASE, messages, signal, onEvent }) {
  const response = await fetch(`${normalizeBase(apiBase)}/chat`, {
    method: 'POST',
    headers: {
      accept: 'text/event-stream',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ messages: messages.slice(-8) }),
    signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(await readPublicError(response, 'Operator chat is unavailable.'));
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
    const blocks = buffer.split('\n\n');
    buffer = blocks.pop() || '';
    blocks.forEach((block) => emitBlock(block, onEvent));
  }

  buffer += decoder.decode();
  if (buffer.trim()) emitBlock(buffer, onEvent);
}

export async function submitOperatorInquiry({ apiBase = DEFAULT_API_BASE, inquiry, signal }) {
  const response = await fetch(`${normalizeBase(apiBase)}/inquiries`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify(inquiry),
    signal,
  });
  if (!response.ok) throw new Error(await readPublicError(response, 'Inquiry submission is unavailable.'));
  if (response.status === 204) return { status: 'rejected' };
  return response.json();
}

function emitBlock(block, onEvent) {
  let name = 'message';
  const data = [];
  block.split('\n').forEach((line) => {
    if (!line || line.startsWith(':')) return;
    if (line.startsWith('event:')) name = line.slice(6).trim();
    if (line.startsWith('data:')) data.push(line.slice(5).trimStart());
  });
  if (!data.length) return;
  try {
    onEvent(name, JSON.parse(data.join('\n')));
  } catch {
    onEvent('error', { code: 'invalid_stream_event' });
  }
}

async function readPublicError(response, fallback) {
  try {
    const body = await response.json();
    return body?.error?.message || body?.message || fallback;
  } catch {
    return fallback;
  }
}

function normalizeBase(value) {
  return String(value || DEFAULT_API_BASE).replace(/\/$/, '');
}
