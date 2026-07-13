import { describe, expect, it } from "vitest";
import { createWorker } from "../src/index";
import { baseEnv, executionContext, postJson } from "./helpers";

describe("HTTP boundary", () => {
  it("rejects cross-origin and originless POST requests", async () => {
    const worker = createWorker();
    const { ctx } = executionContext();
    const crossOrigin = postJson(
      "/api/operator/chat",
      { messages: [{ role: "user", content: "hello" }] },
      { origin: "https://attacker.example", "sec-fetch-site": "cross-site" },
    );
    const originless = new Request("https://hyperion-industries.dev/api/operator/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "hello" }] }),
    });

    expect((await worker.fetch(crossOrigin, baseEnv(), ctx)).status).toBe(403);
    expect((await worker.fetch(originless, baseEnv(), ctx)).status).toBe(403);
  });

  it("accepts state changes through the configured first-party API origin", async () => {
    const worker = createWorker();
    const { ctx } = executionContext();
    const request = new Request("https://hyperion-operator.hyperion-industries-intake.workers.dev/api/intake/evaluate", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://hyperion-industries.dev",
        "sec-fetch-site": "cross-site",
      },
      body: JSON.stringify({
        lane: "general",
        answers: { need: "A governed intake route" },
        automated_classification: false,
      }),
    });

    const response = await worker.fetch(request, baseEnv(), ctx);

    expect(response.status).toBe(200);
    expect(response.headers.get("access-control-allow-origin")).toBe("https://hyperion-industries.dev");
  });

  it("rejects oversized bodies before parsing", async () => {
    const worker = createWorker();
    const { ctx } = executionContext();
    const request = postJson(
      "/api/operator/chat",
      { messages: [{ role: "user", content: "hello" }] },
      { "content-length": String(40 * 1024) },
    );
    const response = await worker.fetch(request, baseEnv(), ctx);
    const body = await response.json<{ error: { code: string } }>();

    expect(response.status).toBe(413);
    expect(body.error.code).toBe("body_too_large");
  });
});
