import { describe, expect, it, vi } from "vitest";
import { createWorker } from "../src/index";
import { baseEnv, executionContext, postJson } from "./helpers";

interface ParsedEvent {
  event: string;
  data: unknown;
}

function chunkedSseResponse(text: string, chunkSize = 23): Response {
  const encoder = new TextEncoder();
  return new Response(new ReadableStream<Uint8Array>({
    start(controller) {
      for (let offset = 0; offset < text.length; offset += chunkSize) {
        controller.enqueue(encoder.encode(text.slice(offset, offset + chunkSize)));
      }
      controller.close();
    },
  }), { headers: { "content-type": "text/event-stream" } });
}

function parsePublicEvents(text: string): ParsedEvent[] {
  return text.trim().split("\n\n").map((block) => {
    const lines = block.split("\n");
    const event = lines.find((line) => line.startsWith("event: "))?.slice(7) ?? "";
    const data = lines.find((line) => line.startsWith("data: "))?.slice(6) ?? "null";
    return { event, data: JSON.parse(data) as unknown };
  });
}

describe("POST /api/operator/chat", () => {
  it("normalizes OpenRouter SSE to the public event contract", async () => {
    const firstDelta = JSON.stringify({
      id: "provider-response-secret",
      model: "provider/model-secret",
      provider: "provider-secret",
      choices: [{
        index: 0,
        delta: {
          role: "assistant",
          content: "Hello",
          reasoning: "private-reasoning",
          tool_calls: [{ id: "private-tool-call" }],
          citations: [{ url: "https://provider.example/private" }],
        },
      }],
      usage: { prompt_tokens: 999 },
    });
    const secondDelta = JSON.stringify({
      choices: [{ index: 0, delta: { content: " world" } }],
      provider: "another-provider-secret",
    });
    const upstreamText = [
      ": OPENROUTER PROCESSING\r\n\r\n",
      "event: message\r\n",
      `data: ${firstDelta}\r\n\r\n`,
      `data: ${secondDelta}\r\n\r\n`,
      'data: {"usage":{"completion_tokens":2}}\r\n\r\n',
      "data: [DONE]\r\n\r\n",
    ].join("");
    const upstreamFetch = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      chunkedSseResponse(upstreamText),
    );
    const worker = createWorker({
      fetcher: upstreamFetch as unknown as typeof fetch,
      randomUUID: () => "chat-request",
    });
    const { ctx } = executionContext();
    const env = baseEnv({ OPENROUTER_MODEL: "openai/gpt-5.2-test" });

    const response = await worker.fetch(
      postJson("/api/operator/chat", { messages: [{ role: "user", content: "What does Hyperion build?" }] }),
      env,
      ctx,
    );
    const stream = await response.text();
    const events = parsePublicEvents(stream);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    expect(events.map((event) => event.event)).toEqual(["status", "delta", "delta", "sources", "done"]);
    expect(events[0]?.data).toEqual({ status: "streaming" });
    expect(events[1]?.data).toEqual({ text: "Hello" });
    expect(events[2]?.data).toEqual({ text: " world" });
    expect(events[4]?.data).toEqual({ status: "complete" });
    const sourceData = events[3]?.data as { sources: Array<{ id: string; title: string; href: string }> };
    expect(sourceData.sources).toHaveLength(7);
    expect(sourceData.sources.every((source) => source.href.startsWith("https://hyperion-industries.dev/"))).toBe(true);
    expect(sourceData.sources.map((source) => source.id)).toContain("company-overview");
    expect(stream).not.toContain("OPENROUTER PROCESSING");
    expect(stream).not.toContain("provider-response-secret");
    expect(stream).not.toContain("provider/model-secret");
    expect(stream).not.toContain("private-reasoning");
    expect(stream).not.toContain("private-tool-call");
    expect(stream).not.toContain("provider.example");
    expect(stream).not.toContain("prompt_tokens");
    expect(stream).not.toContain("[DONE]");
    expect(upstreamFetch).toHaveBeenCalledOnce();

    const [, init] = upstreamFetch.mock.calls[0] ?? [];
    const payload = JSON.parse(String(init?.body)) as {
      model: string;
      messages: Array<{ role: string; content: string }>;
      tools: unknown[];
      tool_choice: string;
      plugins: unknown[];
      provider: Record<string, unknown>;
    };
    expect(payload.model).toBe("openai/gpt-5.2-test");
    expect(payload.provider).toEqual({ data_collection: "deny", zdr: true, require_parameters: true });
    expect(payload.tools).toEqual([]);
    expect(payload.tool_choice).toBe("none");
    expect(payload.plugins).toEqual([]);
    expect(payload.messages[0]?.role).toBe("system");
    expect(payload.messages[0]?.content).toContain("PUBLIC CORPUS");
    expect(payload.messages[0]?.content).not.toContain("test-openrouter-key");
    expect(payload.messages.at(-1)).toEqual({ role: "user", content: "What does Hyperion build?" });
  });

  it("normalizes provider error frames without exposing provider detail", async () => {
    const upstreamFetch = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      chunkedSseResponse('data: {"error":{"message":"provider-secret-detail","metadata":{"provider":"secret"}}}\n\n'),
    );
    const worker = createWorker({ fetcher: upstreamFetch as unknown as typeof fetch });
    const { ctx } = executionContext();
    const response = await worker.fetch(
      postJson("/api/operator/chat", { messages: [{ role: "user", content: "hello" }] }),
      baseEnv(),
      ctx,
    );
    const stream = await response.text();
    const events = parsePublicEvents(stream);

    expect(response.status).toBe(200);
    expect(events).toEqual([
      { event: "status", data: { status: "streaming" } },
      { event: "error", data: { code: "upstream_protocol_error" } },
    ]);
    expect(stream).not.toContain("provider-secret-detail");
    expect(stream).not.toContain("metadata");
  });

  it("emits a normalized error when upstream closes without done", async () => {
    const upstreamFetch = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      chunkedSseResponse('data: {"choices":[{"index":0,"delta":{"content":"Partial"}}]}\n\n'),
    );
    const worker = createWorker({ fetcher: upstreamFetch as unknown as typeof fetch });
    const { ctx } = executionContext();
    const response = await worker.fetch(
      postJson("/api/operator/chat", { messages: [{ role: "user", content: "hello" }] }),
      baseEnv(),
      ctx,
    );

    expect(parsePublicEvents(await response.text())).toEqual([
      { event: "status", data: { status: "streaming" } },
      { event: "delta", data: { text: "Partial" } },
      { event: "error", data: { code: "upstream_incomplete" } },
    ]);
  });

  it("rejects client model, provider, tools, or context fields", async () => {
    const upstreamFetch = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response());
    const worker = createWorker({ fetcher: upstreamFetch as unknown as typeof fetch });
    const { ctx } = executionContext();
    const response = await worker.fetch(
      postJson("/api/operator/chat", {
        model: "attacker/model",
        messages: [{ role: "user", content: "hello" }],
      }),
      baseEnv(),
      ctx,
    );
    const body = await response.json<{ error: { code: string } }>();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("invalid_request");
    expect(upstreamFetch).not.toHaveBeenCalled();
  });

  it("fails closed when the rate-limit binding denies or is unavailable", async () => {
    const worker = createWorker();
    const { ctx } = executionContext();
    const denied = await worker.fetch(
      postJson("/api/operator/chat", { messages: [{ role: "user", content: "hello" }] }),
      baseEnv({ CHAT_RATE_LIMITER: { limit: vi.fn(async () => ({ success: false })) } }),
      ctx,
    );
    const unboundEnv = baseEnv();
    delete unboundEnv.CHAT_RATE_LIMITER;
    const unbound = await worker.fetch(
      postJson("/api/operator/chat", { messages: [{ role: "user", content: "hello" }] }),
      unboundEnv,
      ctx,
    );

    expect(denied.status).toBe(429);
    expect(denied.headers.get("retry-after")).toBe("60");
    expect(unbound.status).toBe(503);
  });

  it("does not expose upstream error bodies", async () => {
    const upstreamFetch = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response('{"error":"provider-secret-detail"}', {
        status: 429,
        headers: { "content-type": "application/json" },
      }),
    );
    const worker = createWorker({ fetcher: upstreamFetch as unknown as typeof fetch });
    const { ctx } = executionContext();
    const response = await worker.fetch(
      postJson("/api/operator/chat", { messages: [{ role: "user", content: "hello" }] }),
      baseEnv(),
      ctx,
    );

    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain("provider-secret-detail");
  });

  it("returns a bounded upstream timeout", async () => {
    const upstreamFetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.signal?.aborted) throw new DOMException("aborted", "AbortError");
      return new Response();
    });
    const worker = createWorker({
      fetcher: upstreamFetch as unknown as typeof fetch,
      setTimer: (callback) => {
        callback();
        return 1;
      },
      clearTimer: () => undefined,
    });
    const { ctx } = executionContext();
    const response = await worker.fetch(
      postJson("/api/operator/chat", { messages: [{ role: "user", content: "hello" }] }),
      baseEnv(),
      ctx,
    );
    const body = await response.json<{ error: { code: string } }>();

    expect(response.status).toBe(504);
    expect(body.error.code).toBe("upstream_timeout");
  });
});
