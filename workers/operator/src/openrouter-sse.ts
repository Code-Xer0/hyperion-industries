import { CHAT_MAX_UPSTREAM_EVENT_BYTES } from "./constants";

export type NormalizedSignal =
  | { type: "delta"; text: string }
  | { type: "done" }
  | { type: "error"; code: "upstream_protocol_error" | "upstream_incomplete" };

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function parseDataPayload(payload: string): NormalizedSignal | null {
  if (payload === "[DONE]") return { type: "done" };

  let parsed: unknown;
  try {
    parsed = JSON.parse(payload) as unknown;
  } catch {
    return { type: "error", code: "upstream_protocol_error" };
  }
  if (!isObject(parsed)) return { type: "error", code: "upstream_protocol_error" };
  if ("error" in parsed) return { type: "error", code: "upstream_protocol_error" };
  if (!Array.isArray(parsed.choices)) return null;

  const choices = parsed.choices.filter(isObject);
  const choice = choices.find((item) => item.index === 0) ?? choices[0];
  if (!choice || !isObject(choice.delta)) return null;
  if (choice.delta.role !== undefined && choice.delta.role !== "assistant") return null;
  return typeof choice.delta.content === "string" && choice.delta.content
    ? { type: "delta", text: choice.delta.content }
    : null;
}

export class OpenRouterSseParser {
  private pending = "";
  private dataLines: string[] = [];
  private dataChars = 0;
  private terminal = false;

  push(text: string): NormalizedSignal[] {
    if (this.terminal || !text) return [];
    this.pending += text;
    if (this.pending.length > CHAT_MAX_UPSTREAM_EVENT_BYTES && !this.pending.includes("\n")) {
      return this.failProtocol();
    }

    const signals: NormalizedSignal[] = [];
    while (!this.terminal) {
      const newline = this.pending.indexOf("\n");
      if (newline < 0) break;
      let line = this.pending.slice(0, newline);
      this.pending = this.pending.slice(newline + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      signals.push(...this.consumeLine(line));
    }
    return signals;
  }

  finish(): NormalizedSignal[] {
    if (this.terminal) return [];
    const signals: NormalizedSignal[] = [];
    if (this.pending) {
      let line = this.pending;
      this.pending = "";
      if (line.endsWith("\r")) line = line.slice(0, -1);
      signals.push(...this.consumeLine(line));
    }
    if (!this.terminal && this.dataLines.length > 0) signals.push(...this.dispatchData());
    if (!this.terminal) {
      this.terminal = true;
      signals.push({ type: "error", code: "upstream_incomplete" });
    }
    return signals;
  }

  private consumeLine(line: string): NormalizedSignal[] {
    if (line === "") return this.dataLines.length > 0 ? this.dispatchData() : [];
    if (line.startsWith(":")) return [];
    if (!line.startsWith("data:")) return [];

    const value = line.slice(5).replace(/^ /, "");
    this.dataChars += value.length;
    if (this.dataChars > CHAT_MAX_UPSTREAM_EVENT_BYTES) return this.failProtocol();
    this.dataLines.push(value);
    return [];
  }

  private dispatchData(): NormalizedSignal[] {
    const payload = this.dataLines.join("\n");
    this.dataLines = [];
    this.dataChars = 0;
    if (!payload) return [];

    const signal = parseDataPayload(payload);
    if (!signal) return [];
    if (signal.type === "done" || signal.type === "error") this.terminal = true;
    return [signal];
  }

  private failProtocol(): NormalizedSignal[] {
    this.pending = "";
    this.dataLines = [];
    this.dataChars = 0;
    this.terminal = true;
    return [{ type: "error", code: "upstream_protocol_error" }];
  }
}

export type PublicEventName = "status" | "delta" | "sources" | "done" | "error";

export function encodePublicEvent(name: PublicEventName, data: unknown): Uint8Array {
  return new TextEncoder().encode(`event: ${name}\ndata: ${JSON.stringify(data)}\n\n`);
}
