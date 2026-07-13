import {
  CHAT_MAX_BODY_BYTES,
  CHAT_MAX_COMPLETION_TOKENS,
  CHAT_MAX_MESSAGE_CHARS,
  CHAT_MAX_MESSAGES,
  CHAT_MAX_NORMALIZED_STREAM_BYTES,
  CHAT_MAX_STREAM_BYTES,
  CHAT_MAX_TOTAL_CHARS,
  CHAT_TIMEOUT_MS,
  OPENROUTER_ENDPOINT,
} from "./constants";
import { CORPUS_METADATA, OPERATOR_SYSTEM_PROMPT, PUBLIC_CORPUS_SOURCES } from "./corpus";
import {
  enforceRateLimit,
  HttpError,
  modelConfiguration,
  readJsonBody,
  rejectUnknownFields,
  requireObject,
} from "./http";
import { errorCategory, logMetadata } from "./log";
import { encodePublicEvent, OpenRouterSseParser, type NormalizedSignal, type PublicEventName } from "./openrouter-sse";
import type { Env, RuntimeDependencies } from "./types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ValidatedChat {
  messages: ChatMessage[];
  totalChars: number;
}

function validateMessages(value: unknown): ValidatedChat {
  const body = requireObject(value);
  rejectUnknownFields(body, ["messages"]);
  if (!Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > CHAT_MAX_MESSAGES) {
    throw new HttpError(400, "invalid_messages", `messages must contain 1-${CHAT_MAX_MESSAGES} items.`);
  }

  const messages: ChatMessage[] = [];
  let totalChars = 0;
  for (const item of body.messages) {
    const message = requireObject(item);
    rejectUnknownFields(message, ["role", "content"]);
    if (message.role !== "user" && message.role !== "assistant") {
      throw new HttpError(400, "invalid_messages", "Only user and assistant message roles are accepted.");
    }
    if (typeof message.content !== "string") {
      throw new HttpError(400, "invalid_messages", "Message content must be plain text.");
    }
    const content = message.content.trim();
    if (!content || content.length > CHAT_MAX_MESSAGE_CHARS || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(content)) {
      throw new HttpError(400, "invalid_messages", "Message content is empty, too long, or contains invalid control characters.");
    }
    totalChars += content.length;
    if (totalChars > CHAT_MAX_TOTAL_CHARS) {
      throw new HttpError(400, "invalid_messages", "Combined message content exceeds the allowed size.");
    }
    messages.push({ role: message.role, content });
  }

  if (messages[0]?.role !== "user" || messages.at(-1)?.role !== "user") {
    throw new HttpError(400, "invalid_messages", "The conversation must start and end with a user message.");
  }

  return { messages, totalChars };
}

function normalizeSse(
  upstream: ReadableStream<Uint8Array>,
  abortController: AbortController,
  timeoutHandle: number,
  request: Request,
  requestId: string,
  deps: RuntimeDependencies,
  timeoutState: { fired: boolean },
  publicOrigin: string,
): ReadableStream<Uint8Array> {
  const reader = upstream.getReader();
  const decoder = new TextDecoder();
  const parser = new OpenRouterSseParser();
  const sources = PUBLIC_CORPUS_SOURCES.map((source) => ({
    id: source.id,
    title: source.title,
    href: new URL(source.sourcePath, publicOrigin).toString(),
  }));
  let upstreamBytes = 0;
  let responseBytes = 0;
  let canceled = false;

  const cleanup = () => {
    deps.clearTimer(timeoutHandle);
    request.signal.removeEventListener("abort", onClientAbort);
  };
  const onClientAbort = () => abortController.abort("client_disconnected");
  request.signal.addEventListener("abort", onClientAbort, { once: true });
  if (request.signal.aborted) onClientAbort();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let reason = "complete";
      let terminal = false;
      const errorReserveBytes = 256;

      const writeEvent = (name: PublicEventName, data: unknown): boolean => {
        const encoded = encodePublicEvent(name, data);
        const limit = name === "error"
          ? CHAT_MAX_NORMALIZED_STREAM_BYTES
          : CHAT_MAX_NORMALIZED_STREAM_BYTES - errorReserveBytes;
        if (responseBytes + encoded.byteLength > limit) return false;
        controller.enqueue(encoded);
        responseBytes += encoded.byteLength;
        return true;
      };

      const fail = (code: string) => {
        reason = code;
        terminal = true;
        abortController.abort(code);
        writeEvent("error", { code });
      };

      const acceptSignal = (signal: NormalizedSignal) => {
        if (terminal) return;
        if (signal.type === "delta") {
          if (!writeEvent("delta", { text: signal.text })) fail("normalized_response_too_large");
          return;
        }
        if (signal.type === "error") {
          fail(signal.code);
          return;
        }
        if (!writeEvent("sources", { sources }) || !writeEvent("done", { status: "complete" })) {
          fail("normalized_response_too_large");
          return;
        }
        terminal = true;
        reason = "complete";
      };

      try {
        if (!writeEvent("status", { status: "streaming" })) fail("normalized_response_too_large");

        streamLoop: while (!terminal) {
          const { done, value } = await reader.read();
          if (done) break;
          upstreamBytes += value.byteLength;
          if (upstreamBytes > CHAT_MAX_STREAM_BYTES) {
            fail("upstream_response_too_large");
            break streamLoop;
          }
          const signals = parser.push(decoder.decode(value, { stream: true }));
          for (const signal of signals) {
            acceptSignal(signal);
            if (terminal) break streamLoop;
          }
        }

        if (!terminal) {
          const finalSignals = [
            ...parser.push(decoder.decode()),
            ...parser.finish(),
          ];
          for (const signal of finalSignals) {
            acceptSignal(signal);
            if (terminal) break;
          }
        }

        if (terminal) {
          try {
            await reader.cancel(reason);
          } catch {
            // The upstream may already be closed.
          }
        } else {
          fail("upstream_incomplete");
        }
        if (!canceled) controller.close();
      } catch (error) {
        if (!terminal && !canceled) {
          fail(timeoutState.fired ? "upstream_timeout" : "upstream_stream_error");
          try {
            controller.close();
          } catch {
            // The downstream may already be closed.
          }
        } else if (!terminal) {
          reason = timeoutState.fired ? "timeout" : errorCategory(error);
        }
      } finally {
        cleanup();
        reader.releaseLock();
        logMetadata("chat_stream_complete", {
          request_id: requestId,
          route: "/api/operator/chat",
          status: 200,
          reason,
          response_bytes: responseBytes,
        });
      }
    },
    async cancel() {
      canceled = true;
      abortController.abort("client_disconnected");
      cleanup();
      try {
        await reader.cancel("client_disconnected");
      } catch {
        // The upstream may already have closed.
      }
    },
  });
}

export async function handleChat(
  request: Request,
  env: Env,
  requestId: string,
  deps: RuntimeDependencies,
): Promise<Response> {
  await enforceRateLimit(env.CHAT_RATE_LIMITER, request, "operator-chat");
  const validated = validateMessages(await readJsonBody(request, CHAT_MAX_BODY_BYTES));

  if (!env.OPENROUTER_API_KEY?.trim()) {
    throw new HttpError(503, "chat_not_configured", "Chat is not configured.");
  }
  const model = modelConfiguration(env);
  if (!model.valid) {
    throw new HttpError(503, "model_configuration_invalid", "Chat model configuration is invalid.");
  }

  const abortController = new AbortController();
  const timeoutState = { fired: false };
  const timeoutHandle = deps.setTimer(() => {
    timeoutState.fired = true;
    abortController.abort("timeout");
  }, CHAT_TIMEOUT_MS);
  const onClientAbort = () => abortController.abort("client_disconnected");
  request.signal.addEventListener("abort", onClientAbort, { once: true });
  if (request.signal.aborted) onClientAbort();

  const payload = {
    model: model.model,
    messages: [
      { role: "system", content: OPERATOR_SYSTEM_PROMPT },
      ...validated.messages,
    ],
    stream: true,
    max_tokens: CHAT_MAX_COMPLETION_TOKENS,
    temperature: 0.2,
    tools: [],
    tool_choice: "none",
    plugins: [],
    provider: {
      data_collection: "deny",
      zdr: true,
      require_parameters: true,
    },
  };

  let upstream: Response;
  try {
    upstream = await deps.fetcher(OPENROUTER_ENDPOINT, {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.OPENROUTER_API_KEY.trim()}`,
        "content-type": "application/json",
        "http-referer": env.SITE_ORIGIN?.trim() || new URL(request.url).origin,
        "x-title": "Hyperion Industries Operator",
      },
      body: JSON.stringify(payload),
      signal: abortController.signal,
    });
  } catch (error) {
    deps.clearTimer(timeoutHandle);
    request.signal.removeEventListener("abort", onClientAbort);
    const timedOut = timeoutState.fired;
    logMetadata("chat_upstream_failed", {
      request_id: requestId,
      route: "/api/operator/chat",
      status: timedOut ? 504 : 502,
      reason: timedOut ? "timeout" : errorCategory(error),
      model: model.model,
    });
    throw new HttpError(
      timedOut ? 504 : 502,
      timedOut ? "upstream_timeout" : "upstream_unavailable",
      timedOut ? "The model provider timed out." : "The model provider is unavailable.",
    );
  }

  const contentType = upstream.headers.get("content-type")?.toLowerCase() ?? "";
  if (!upstream.ok || !upstream.body || !contentType.startsWith("text/event-stream")) {
    deps.clearTimer(timeoutHandle);
    request.signal.removeEventListener("abort", onClientAbort);
    try {
      await upstream.body?.cancel();
    } catch {
      // No upstream body details are consumed or logged.
    }
    logMetadata("chat_upstream_rejected", {
      request_id: requestId,
      route: "/api/operator/chat",
      status: 502,
      reason: upstream.ok ? "invalid_stream" : "upstream_status",
      model: model.model,
    });
    throw new HttpError(502, "upstream_unavailable", "The model provider is unavailable.");
  }

  request.signal.removeEventListener("abort", onClientAbort);
  const stream = normalizeSse(
    upstream.body,
    abortController,
    timeoutHandle,
    request,
    requestId,
    deps,
    timeoutState,
    env.SITE_ORIGIN?.trim() || new URL(request.url).origin,
  );

  logMetadata("chat_stream_started", {
    request_id: requestId,
    route: "/api/operator/chat",
    status: 200,
    model: model.model,
    message_count: validated.messages.length,
    input_chars: validated.totalChars,
    corpus_entries: CORPUS_METADATA.entries,
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-store, no-transform",
    },
  });
}
