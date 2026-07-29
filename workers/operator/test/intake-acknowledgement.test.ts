import { describe, expect, it, vi } from "vitest";
import { createWorker } from "../src/index";
import { baseEnv, executionContext, MockD1 } from "./helpers";

const fixedNow = new Date("2026-07-13T12:00:00.000Z");
const rawSecret = new TextEncoder().encode("resend-webhook-test-secret");
const signingSecret = `whsec_${btoa(String.fromCharCode(...rawSecret))}`;

async function signedWebhook(
  type: "email.delivered" | "email.bounced" | "email.failed",
  webhookId: string,
  overrides: Record<string, unknown> = {},
): Promise<Request> {
  const payload = JSON.stringify({
    type,
    created_at: fixedNow.toISOString(),
    data: {
      email_id: "email_ack_123",
      to: ["private-client@example.test"],
      ...overrides,
    },
  });
  const timestamp = String(Math.floor(fixedNow.getTime() / 1_000));
  const key = await crypto.subtle.importKey("raw", rawSecret, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = new Uint8Array(await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${webhookId}.${timestamp}.${payload}`),
  ));
  return new Request("https://hyperion-industries.dev/api/intake/webhooks/resend", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "svix-id": webhookId,
      "svix-timestamp": timestamp,
      "svix-signature": `v1,${btoa(String.fromCharCode(...signature))}`,
    },
    body: payload,
  });
}

function webhookEnv(db: MockD1) {
  return baseEnv({
    DB: db.binding(),
    RESEND_WEBHOOK_SIGNING_SECRET: signingSecret,
  });
}

describe("Resend intake acknowledgement webhooks", () => {
  for (const [eventType, expectedState] of [
    ["email.delivered", "delivered"],
    ["email.bounced", "bounced"],
    ["email.failed", "failed"],
  ] as const) {
    it(`verifies and stores ${eventType} without retaining provider payload identity`, async () => {
      const db = new MockD1().queueFirst(null, {
        delivery_id: "ack_1234567890abcdef",
        delivery_state: "sent",
        last_event_at: null,
      });
      const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
      const response = await createWorker({ now: () => fixedNow }).fetch(
        await signedWebhook(eventType, `msg_${expectedState}_123456`),
        webhookEnv(db),
        executionContext().ctx,
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({
        ok: true,
        accepted: true,
        replay: false,
        delivery_state: expectedState,
      });
      expect(db.batches[0]).toHaveLength(2);
      expect(db.batches[0]?.[0]?.sql).toContain("INSERT INTO intake_acknowledgement_webhook_events");
      expect(db.batches[0]?.[1]?.values[0]).toBe(expectedState);
      expect(JSON.stringify(db.batches[0]?.map((statement) => statement.values))).not.toContain("private-client@example.test");
      expect(info.mock.calls.flat().join("\n")).not.toContain("private-client@example.test");
      expect(info.mock.calls.flat().join("\n")).not.toContain(signingSecret);
      info.mockRestore();
    });
  }

  it("rejects invalid and stale signatures before any database access", async () => {
    const invalidDb = new MockD1();
    const invalid = await createWorker({ now: () => fixedNow }).fetch(
      new Request("https://hyperion-industries.dev/api/intake/webhooks/resend", {
        method: "POST",
        headers: {
          "svix-id": "msg_invalid_123456",
          "svix-timestamp": String(Math.floor(fixedNow.getTime() / 1_000)),
          "svix-signature": "v1,invalid",
        },
        body: JSON.stringify({ type: "email.delivered", created_at: fixedNow.toISOString(), data: { email_id: "email_ack_123" } }),
      }),
      webhookEnv(invalidDb),
      executionContext().ctx,
    );
    expect(invalid.status).toBe(401);
    expect(invalidDb.statements).toHaveLength(0);

    const staleDb = new MockD1();
    const staleRequest = await signedWebhook("email.delivered", "msg_stale_123456");
    const stale = await createWorker({ now: () => new Date(fixedNow.getTime() + 10 * 60_000) }).fetch(
      staleRequest,
      webhookEnv(staleDb),
      executionContext().ctx,
    );
    expect(stale.status).toBe(401);
    expect(staleDb.statements).toHaveLength(0);
  });

  it("treats a repeated signed webhook as an idempotent replay", async () => {
    const db = new MockD1().queueFirst(
      null,
      { delivery_id: "ack_1234567890abcdef", delivery_state: "sent", last_event_at: null },
      { webhook_id: "msg_replay_123456" },
    );
    const worker = createWorker({ now: () => fixedNow });
    const first = await worker.fetch(
      await signedWebhook("email.delivered", "msg_replay_123456"),
      webhookEnv(db),
      executionContext().ctx,
    );
    const second = await worker.fetch(
      await signedWebhook("email.delivered", "msg_replay_123456"),
      webhookEnv(db),
      executionContext().ctx,
    );

    expect(first.status).toBe(200);
    expect(await second.json()).toMatchObject({ accepted: true, replay: true });
    expect(db.batches).toHaveLength(1);
  });

  it("records an out-of-order event without rolling delivery state backward", async () => {
    const db = new MockD1().queueFirst(null, {
      delivery_id: "ack_1234567890abcdef",
      delivery_state: "delivered",
      last_event_at: "2026-07-13T12:01:00.000Z",
    });
    const response = await createWorker({ now: () => fixedNow }).fetch(
      await signedWebhook("email.failed", "msg_stale_event_123456"),
      webhookEnv(db),
      executionContext().ctx,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      accepted: true,
      replay: false,
      stale: true,
      delivery_state: "delivered",
    });
    expect(db.batches).toHaveLength(0);
    expect(db.statements.some((statement) =>
      statement.sql.includes("INSERT INTO intake_acknowledgement_webhook_events"))).toBe(true);
    expect(db.statements.every((statement) =>
      !statement.sql.includes("UPDATE intake_acknowledgement_deliveries"))).toBe(true);
  });

  it("accepts a verified unrelated Resend event without mutating intake state", async () => {
    const db = new MockD1();
    const request = await signedWebhook("email.delivered", "msg_unrelated_123456");
    const raw = await request.text();
    const payload = raw.replace('"email.delivered"', '"email.opened"');
    const timestamp = String(Math.floor(fixedNow.getTime() / 1_000));
    const key = await crypto.subtle.importKey("raw", rawSecret, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const signature = new Uint8Array(await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(`msg_unrelated_123456.${timestamp}.${payload}`),
    ));
    const response = await createWorker({ now: () => fixedNow }).fetch(
      new Request("https://hyperion-industries.dev/api/intake/webhooks/resend", {
        method: "POST",
        headers: {
          "svix-id": "msg_unrelated_123456",
          "svix-timestamp": timestamp,
          "svix-signature": `v1,${btoa(String.fromCharCode(...signature))}`,
        },
        body: payload,
      }),
      webhookEnv(db),
      executionContext().ctx,
    );

    expect(response.status).toBe(202);
    expect(await response.json()).toMatchObject({ accepted: false, reason: "event_not_tracked" });
    expect(db.statements).toHaveLength(0);
  });
});
