import { vi } from "vitest";
import type { Env, RateLimitBinding } from "../src/types";

export class MockStatement {
  readonly sql: string;
  values: unknown[] = [];
  readonly owner: MockD1;
  readonly run: ReturnType<typeof vi.fn>;
  readonly first: ReturnType<typeof vi.fn>;
  readonly all: ReturnType<typeof vi.fn>;

  constructor(sql: string, owner: MockD1) {
    this.sql = sql;
    this.owner = owner;
    this.run = vi.fn(async () => ({ meta: { changes: this.owner.runChanges.shift() ?? 1 } }));
    this.first = vi.fn(async () => this.owner.firstResults.shift() ?? null);
    this.all = vi.fn(async () => ({ results: this.owner.allResults.shift() ?? [] }));
  }

  bind(...values: unknown[]): MockStatement {
    this.values = values;
    return this;
  }
}

export class MockD1 {
  readonly statements: MockStatement[] = [];
  readonly batches: MockStatement[][] = [];
  readonly firstResults: unknown[] = [];
  readonly allResults: unknown[][] = [];
  readonly runChanges: number[] = [];
  batchError: Error | null = null;
  readonly prepare = vi.fn((sql: string) => {
    const statement = new MockStatement(sql, this);
    this.statements.push(statement);
    return statement;
  });
  readonly batch = vi.fn(async (statements: MockStatement[]) => {
    this.batches.push(statements);
    if (this.batchError) throw this.batchError;
    return statements.map(() => ({ meta: { changes: 1 } }));
  });

  queueFirst(...values: unknown[]): MockD1 {
    this.firstResults.push(...values);
    return this;
  }

  queueAll(...values: unknown[][]): MockD1 {
    this.allResults.push(...values);
    return this;
  }

  binding(): D1Database {
    return this as unknown as D1Database;
  }
}

export function allowRateLimit(): RateLimitBinding {
  return { limit: vi.fn(async () => ({ success: true })) };
}

export function baseEnv(overrides: Partial<Env> = {}): Env {
  return {
    SITE_ORIGIN: "https://hyperion-industries.dev",
    INTAKE_API_ORIGIN: "https://hyperion-operator.hyperion-industries-intake.workers.dev",
    OPENROUTER_API_KEY: "test-openrouter-key",
    CHAT_RATE_LIMITER: allowRateLimit(),
    INQUIRY_RATE_LIMITER: allowRateLimit(),
    INTAKE_RESUME_RATE_LIMITER: allowRateLimit(),
    INTAKE_SUBMISSION_RATE_LIMITER: allowRateLimit(),
    INTAKE_OPERATOR_RATE_LIMITER: allowRateLimit(),
    ...overrides,
  };
}

export function postJson(path: string, value: unknown, extraHeaders: HeadersInit = {}): Request {
  const headers = new Headers({
    "content-type": "application/json",
    origin: "https://hyperion-industries.dev",
    "sec-fetch-site": "same-origin",
    "cf-connecting-ip": "203.0.113.10",
    "user-agent": "operator-worker-test",
  });
  new Headers(extraHeaders).forEach((headerValue, headerName) => headers.set(headerName, headerValue));
  return new Request(`https://hyperion-industries.dev${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(value),
  });
}

export function executionContext(): { ctx: ExecutionContext; pending: Promise<unknown>[] } {
  const pending: Promise<unknown>[] = [];
  const ctx = {
    waitUntil(promise: Promise<unknown>) {
      pending.push(promise);
    },
    passThroughOnException() {},
  } as unknown as ExecutionContext;
  return { ctx, pending };
}
