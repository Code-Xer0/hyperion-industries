import { describe, expect, it, vi } from "vitest";
import { createWorker } from "../src/index";
import { baseEnv, executionContext, MockD1 } from "./helpers";

describe("GET /api/operator/status", () => {
  it("reports degraded configuration without leaking secret values", async () => {
    const worker = createWorker({ randomUUID: () => "status-request" });
    const { ctx } = executionContext();
    const response = await worker.fetch(
      new Request("https://hyperion-industries.dev/api/operator/status"),
      {},
      ctx,
    );
    const body = await response.json<Record<string, unknown>>();

    expect(response.status).toBe(200);
    expect(body.status).toBe("degraded");
    expect(JSON.stringify(body)).not.toContain("OPENROUTER_API_KEY");
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("reports ready when all protective and service bindings are configured", async () => {
    const db = new MockD1();
    const worker = createWorker();
    const { ctx } = executionContext();
    const response = await worker.fetch(
      new Request("https://hyperion-industries.dev/api/operator/status"),
      baseEnv({
        DB: db.binding(),
        INQUIRY_EMAIL: { send: vi.fn(async () => ({})) },
        INQUIRY_NOTIFY_TO: "hello@hyperion-industries.dev",
        INQUIRY_FROM_EMAIL: "operator@hyperion-industries.dev",
      }),
      ctx,
    );
    const body = await response.json<{ status: string; model: string; privacy: Record<string, string> }>();

    expect(body.status).toBe("ready");
    expect(body.model).toBe("openai/gpt-5.2");
    expect(body.privacy).toMatchObject({
      corpus: "compiled_public_allowlist_only",
      provider_data_collection: "deny",
      provider_zero_data_retention: "required",
      tools: "disabled",
      logs: "metadata_only",
    });
  });
});
