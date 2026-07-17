import { describe, expect, it } from "vitest";
import { createWorker } from "../src/index";
import { baseEnv, executionContext, MockD1, postJson } from "./helpers";

const OPERATOR_TOKEN = "founder-command-test-token-with-enough-entropy";
const OPERATOR_TOKEN_HASH = "33c6b5ba9e338f8c71a066f95ac989d89e6e7e90bb7cfa3b51e5dab17b2d90e0";

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

  it("accepts branded same-origin state changes without CORS headers", async () => {
    const worker = createWorker();
    const { ctx } = executionContext();
    const request = postJson(
      "/api/intake/evaluate",
      {
        lane: "general",
        answers: { need: "A governed intake route" },
        automated_classification: false,
      },
    );

    const response = await worker.fetch(request, baseEnv(), ctx);

    expect(response.status).toBe(200);
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("keeps bearer-authenticated operator routes exempt from browser-origin checks", async () => {
    const request = new Request("https://hyperion-industries.dev/api/intake/operator/ack", {
      method: "POST",
      headers: {
        authorization: `Bearer ${OPERATOR_TOKEN}`,
        "content-type": "application/json",
        "x-hyprm-consumer": "founder-command-desktop",
      },
      body: JSON.stringify({ deliveries: [] }),
    });
    const response = await createWorker().fetch(
      request,
      baseEnv({
        DB: new MockD1().binding(),
        FOUNDER_COMMAND_PULL_KEY_ID: "fc-intake-test",
        FOUNDER_COMMAND_PULL_TOKEN_SHA256: OPERATOR_TOKEN_HASH,
      }),
      executionContext().ctx,
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code: "invalid_acknowledgement" } });
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
