import { describe, expect, it, vi } from "vitest";
import { createWorker } from "../src/index";
import { baseEnv, executionContext, MockD1, postJson } from "./helpers";

const NOW = new Date("2026-07-13T12:00:00.000Z");

function inquiryBody(overrides: Record<string, unknown> = {}) {
  return {
    name: "Avery Example",
    email: "avery@example.com",
    organization: "Example Studio",
    inquiryType: "demo_request",
    timeline: "This quarter",
    budget: "$25,000-$40,000",
    message: "We would like to discuss a public-safe product demonstration.",
    sourcePath: "/contact",
    consent: true,
    website: "",
    ...overrides,
  };
}

describe("POST /api/operator/inquiries", () => {
  it("stores structured consent with a 90-day expiry and sends a notification", async () => {
    const db = new MockD1();
    const send = vi.fn(async (_message: unknown) => ({ messageId: "test-message" }));
    const worker = createWorker({ now: () => NOW, randomUUID: () => "inquiry-001" });
    const { ctx } = executionContext();
    const response = await worker.fetch(
      postJson("/api/operator/inquiries", inquiryBody()),
      baseEnv({
        DB: db.binding(),
        INQUIRY_EMAIL: { send },
        INQUIRY_NOTIFY_TO: "hello@hyperion-industries.dev",
        INQUIRY_FROM_EMAIL: "operator@hyperion-industries.dev",
        INQUIRY_CONSENT_VERSION: "2026-07-13",
      }),
      ctx,
    );
    const body = await response.json<Record<string, unknown>>();

    expect(response.status).toBe(201);
    expect(body).toMatchObject({
      ok: true,
      id: "inquiry-001",
      status: "submitted",
      notification: "notified",
      partial: false,
    });
    expect(db.batch).toHaveBeenCalledOnce();
    const insert = db.batches[0]?.find((statement) => statement.sql.includes("INSERT INTO operator_inquiries"));
    expect(insert?.values[0]).toBe("inquiry-001");
    expect(insert?.values[1]).toBe(NOW.toISOString());
    expect(insert?.values[2]).toBe("2026-10-11T12:00:00.000Z");
    expect(insert?.values[8]).toBe("$25,000-$40,000");
    expect(insert?.values[11]).toBe("2026-07-13");
    expect(send).toHaveBeenCalledOnce();
    expect(send.mock.calls[0]?.[0]).toMatchObject({
      to: "hello@hyperion-industries.dev",
      from: "operator@hyperion-industries.dev",
      subject: "Hyperion inquiry: demo_request",
    });
    expect(send.mock.calls[0]?.[0]).toMatchObject({ text: expect.stringContaining("Budget: $25,000-$40,000") });
    expect(db.statements.some((statement) => statement.sql.includes("notification_status = 'sent'"))).toBe(true);
  });

  it("returns honest partial success when notification delivery fails", async () => {
    const db = new MockD1();
    const worker = createWorker({ now: () => NOW, randomUUID: () => "inquiry-002" });
    const { ctx } = executionContext();
    const response = await worker.fetch(
      postJson("/api/operator/inquiries", inquiryBody()),
      baseEnv({
        DB: db.binding(),
        INQUIRY_EMAIL: { send: vi.fn(async (_message: unknown) => Promise.reject(new Error("mail provider detail"))) },
        INQUIRY_NOTIFY_TO: "hello@hyperion-industries.dev",
        INQUIRY_FROM_EMAIL: "operator@hyperion-industries.dev",
      }),
      ctx,
    );
    const body = await response.json<Record<string, unknown>>();

    expect(response.status).toBe(202);
    expect(body).toMatchObject({
      ok: true,
      status: "submitted",
      notification: "notification_pending",
      partial: true,
    });
    const pendingUpdate = db.statements.find((statement) => statement.sql.includes("last_notification_error_code"));
    expect(pendingUpdate?.values).toContain("notification_send_failed");
  });

  it("returns notification_pending when email exceeds its bounded timeout", async () => {
    const db = new MockD1();
    const worker = createWorker({
      now: () => NOW,
      randomUUID: () => "inquiry-timeout",
      setTimer: (callback) => {
        callback();
        return 1;
      },
      clearTimer: () => undefined,
    });
    const { ctx } = executionContext();
    const response = await worker.fetch(
      postJson("/api/operator/inquiries", inquiryBody()),
      baseEnv({
        DB: db.binding(),
        INQUIRY_EMAIL: { send: vi.fn(async (_message: unknown) => new Promise(() => undefined)) },
        INQUIRY_NOTIFY_TO: "hello@hyperion-industries.dev",
        INQUIRY_FROM_EMAIL: "operator@hyperion-industries.dev",
      }),
      ctx,
    );
    const body = await response.json<Record<string, unknown>>();

    expect(response.status).toBe(202);
    expect(body.status).toBe("submitted");
    expect(body.notification).toBe("notification_pending");
    const pendingUpdate = db.statements.find((statement) => statement.sql.includes("last_notification_error_code"));
    expect(pendingUpdate?.values).toContain("notification_timeout");
  });

  it("requires explicit consent before storage", async () => {
    const db = new MockD1();
    const worker = createWorker();
    const { ctx } = executionContext();
    const response = await worker.fetch(
      postJson("/api/operator/inquiries", inquiryBody({ consent: false })),
      baseEnv({ DB: db.binding() }),
      ctx,
    );

    expect(response.status).toBe(400);
    expect(db.batch).not.toHaveBeenCalled();
  });

  it("rejects an overlong budget before storage", async () => {
    const db = new MockD1();
    const worker = createWorker();
    const { ctx } = executionContext();
    const response = await worker.fetch(
      postJson("/api/operator/inquiries", inquiryBody({ budget: "x".repeat(121) })),
      baseEnv({ DB: db.binding() }),
      ctx,
    );

    expect(response.status).toBe(400);
    expect(db.batch).not.toHaveBeenCalled();
  });

  it("accepts an omitted budget and persists null", async () => {
    const db = new MockD1();
    const { budget: _budget, ...withoutBudget } = inquiryBody();
    const worker = createWorker({ now: () => NOW, randomUUID: () => "inquiry-no-budget" });
    const { ctx } = executionContext();
    const response = await worker.fetch(
      postJson("/api/operator/inquiries", withoutBudget),
      baseEnv({ DB: db.binding() }),
      ctx,
    );

    expect(response.status).toBe(202);
    const insert = db.batches[0]?.find((statement) => statement.sql.includes("INSERT INTO operator_inquiries"));
    expect(insert?.values[8]).toBeNull();
  });

  it("discards honeypot submissions without D1 or email side effects", async () => {
    const db = new MockD1();
    const send = vi.fn(async (_message: unknown) => ({}));
    const worker = createWorker();
    const { ctx } = executionContext();
    const response = await worker.fetch(
      postJson("/api/operator/inquiries", inquiryBody({ website: "https://spam.example" })),
      baseEnv({
        DB: db.binding(),
        INQUIRY_EMAIL: { send },
        INQUIRY_NOTIFY_TO: "hello@hyperion-industries.dev",
        INQUIRY_FROM_EMAIL: "operator@hyperion-industries.dev",
      }),
      ctx,
    );

    expect(response.status).toBe(204);
    expect(db.batch).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it("keeps inquiry content and email addresses out of logs", async () => {
    const db = new MockD1();
    const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const worker = createWorker({ now: () => NOW, randomUUID: () => "inquiry-log-test" });
    const { ctx } = executionContext();
    const sensitiveText = "Sensitive customer project detail that must not be logged.";
    await worker.fetch(
      postJson("/api/operator/inquiries", inquiryBody({ message: sensitiveText, email: "private@example.com" })),
      baseEnv({
        DB: db.binding(),
        INQUIRY_EMAIL: { send: vi.fn(async (_message: unknown) => Promise.reject(new Error("secret email failure"))) },
        INQUIRY_NOTIFY_TO: "hello@hyperion-industries.dev",
        INQUIRY_FROM_EMAIL: "operator@hyperion-industries.dev",
      }),
      ctx,
    );
    const logs = consoleSpy.mock.calls.flat().join("\n");

    expect(logs).not.toContain(sensitiveText);
    expect(logs).not.toContain("private@example.com");
    expect(logs).not.toContain("secret email failure");
  });

  it("purges expired rows from the scheduled handler", async () => {
    const db = new MockD1();
    const worker = createWorker({ now: () => NOW });
    const { ctx, pending } = executionContext();

    await worker.scheduled({} as ScheduledController, { DB: db.binding() }, ctx);
    await Promise.all(pending);

    const purge = db.statements.find((statement) => statement.sql.includes("expires_at <="));
    expect(purge?.values).toEqual([NOW.toISOString()]);
    expect(purge?.run).toHaveBeenCalledOnce();
  });
});
