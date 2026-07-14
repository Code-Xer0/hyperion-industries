import {
  DEFAULT_CONSENT_VERSION,
  INQUIRY_MAX_BODY_BYTES,
  INQUIRY_RETENTION_DAYS,
} from "./constants";
import {
  enforceRateLimit,
  HttpError,
  isEmailAddress,
  jsonResponse,
  readJsonBody,
  rejectUnknownFields,
  requireObject,
} from "./http";
import { logMetadata } from "./log";
import { sendEmailWithTimeout } from "./notification";
import type { Env, RuntimeDependencies } from "./types";

const INQUIRY_TYPES = [
  "contact",
  "field_work",
  "card_studio_order",
  "beta_access",
  "demo_request",
  "chronos_beta_issue",
  "partnership_funding",
] as const;

type InquiryType = (typeof INQUIRY_TYPES)[number];

interface InquiryInput {
  name: string;
  email: string;
  organization: string | null;
  inquiryType: InquiryType;
  timeline: string | null;
  budget: string | null;
  message: string;
  sourcePath: string;
}

function boundedText(
  value: unknown,
  field: string,
  minimum: number,
  maximum: number,
  multiline = false,
): string {
  if (typeof value !== "string") throw new HttpError(400, "invalid_inquiry", `${field} is required.`);
  const normalized = value.replace(/\r\n?/g, "\n").trim();
  const invalidControls = multiline
    ? /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/
    : /[\u0000-\u001F\u007F]/;
  if (normalized.length < minimum || normalized.length > maximum || invalidControls.test(normalized)) {
    throw new HttpError(400, "invalid_inquiry", `${field} has an invalid length or format.`);
  }
  return normalized;
}

function optionalText(value: unknown, field: string, maximum: number): string | null {
  if (value === undefined || value === null || value === "") return null;
  return boundedText(value, field, 1, maximum);
}

function resolveSourcePath(request: Request, value: unknown): string {
  if (value !== undefined) {
    const sourcePath = boundedText(value, "sourcePath", 1, 200);
    if (!/^\/[a-z0-9/_-]*$/i.test(sourcePath) || sourcePath.includes("..") || sourcePath.startsWith("/api/")) {
      throw new HttpError(400, "invalid_inquiry", "sourcePath must be a public site route.");
    }
    return sourcePath;
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const parsed = new URL(referer);
      if (parsed.origin === new URL(request.url).origin && parsed.pathname.length <= 200) return parsed.pathname;
    } catch {
      // Use the stable contact route fallback.
    }
  }
  return "/contact";
}

function validateInquiry(request: Request, value: unknown): { honeypot: boolean; inquiry?: InquiryInput } {
  const body = requireObject(value);
  rejectUnknownFields(body, [
    "name",
    "email",
    "organization",
    "inquiryType",
    "timeline",
    "budget",
    "message",
    "sourcePath",
    "consent",
    "website",
  ]);

  if (typeof body.website === "string" && body.website.trim()) return { honeypot: true };
  if (body.website !== undefined && typeof body.website !== "string") {
    throw new HttpError(400, "invalid_inquiry", "website must be a string.");
  }
  if (body.consent !== true) {
    throw new HttpError(400, "consent_required", "Explicit consent to be contacted is required.");
  }

  const name = boundedText(body.name, "name", 1, 120);
  const email = boundedText(body.email, "email", 3, 254).toLowerCase();
  if (!isEmailAddress(email)) throw new HttpError(400, "invalid_inquiry", "email is invalid.");
  if (typeof body.inquiryType !== "string" || !INQUIRY_TYPES.includes(body.inquiryType as InquiryType)) {
    throw new HttpError(400, "invalid_inquiry", "inquiryType is invalid.");
  }

  return {
    honeypot: false,
    inquiry: {
      name,
      email,
      organization: optionalText(body.organization, "organization", 160),
      inquiryType: body.inquiryType as InquiryType,
      timeline: optionalText(body.timeline, "timeline", 120),
      budget: optionalText(body.budget, "budget", 120),
      message: boundedText(body.message, "message", 10, 6_000, true),
      sourcePath: resolveSourcePath(request, body.sourcePath),
    },
  };
}

function notificationText(input: InquiryInput, id: string, consentVersion: string, createdAt: string): string {
  return [
    "New Hyperion public inquiry",
    "",
    `Inquiry ID: ${id}`,
    `Received: ${createdAt}`,
    `Type: ${input.inquiryType}`,
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Organization: ${input.organization ?? "Not provided"}`,
    `Timeline: ${input.timeline ?? "Not provided"}`,
    `Budget: ${input.budget ?? "Not provided"}`,
    `Source path: ${input.sourcePath}`,
    `Contact consent: yes (${consentVersion})`,
    "",
    "Message:",
    input.message,
  ].join("\n");
}

function isForgeInquiry(input: InquiryInput): boolean {
  return input.inquiryType === "field_work" ||
    input.inquiryType === "card_studio_order" ||
    input.sourcePath === "/forge" ||
    input.sourcePath.startsWith("/forge/") ||
    input.sourcePath === "/intake/forge" ||
    input.sourcePath.startsWith("/intake/forge/");
}

async function markNotificationPending(
  db: D1Database,
  id: string,
  reason: string,
  attempted: boolean,
): Promise<void> {
  await db
    .prepare(
      `UPDATE operator_inquiries
       SET notification_status = 'pending',
           notification_attempts = notification_attempts + ?,
           last_notification_error_code = ?
       WHERE id = ?`,
    )
    .bind(attempted ? 1 : 0, reason, id)
    .run();
}

async function markNotificationSent(db: D1Database, id: string, notifiedAt: string): Promise<void> {
  await db
    .prepare(
      `UPDATE operator_inquiries
       SET notification_status = 'sent',
           notification_attempts = notification_attempts + 1,
           notified_at = ?,
           last_notification_error_code = NULL
       WHERE id = ?`,
    )
    .bind(notifiedAt, id)
    .run();
}

export async function purgeExpiredInquiries(db: D1Database, now: Date): Promise<number> {
  const result = await db
    .prepare("DELETE FROM operator_inquiries WHERE expires_at <= ?")
    .bind(now.toISOString())
    .run();
  return result.meta.changes ?? 0;
}

export async function handleInquiry(
  request: Request,
  env: Env,
  requestId: string,
  deps: RuntimeDependencies,
): Promise<Response> {
  await enforceRateLimit(env.INQUIRY_RATE_LIMITER, request, "operator-inquiry");
  const validated = validateInquiry(request, await readJsonBody(request, INQUIRY_MAX_BODY_BYTES));
  if (validated.honeypot) {
    logMetadata("inquiry_honeypot_discarded", {
      request_id: requestId,
      route: "/api/operator/inquiries",
      status: 204,
    });
    return new Response(null, { status: 204 });
  }
  const input = validated.inquiry;
  if (!input) throw new HttpError(400, "invalid_inquiry", "Inquiry body is invalid.");
  if (!env.DB) throw new HttpError(503, "inquiry_storage_unavailable", "Inquiry storage is unavailable.");

  const createdAt = deps.now();
  const expiresAt = new Date(createdAt.getTime() + INQUIRY_RETENTION_DAYS * 24 * 60 * 60 * 1_000);
  const createdAtIso = createdAt.toISOString();
  const consentVersion = env.INQUIRY_CONSENT_VERSION?.trim() || DEFAULT_CONSENT_VERSION;
  const id = deps.randomUUID();

  try {
    await env.DB.batch([
      env.DB.prepare("DELETE FROM operator_inquiries WHERE expires_at <= ?").bind(createdAtIso),
      env.DB.prepare(
        `INSERT INTO operator_inquiries (
          id, created_at, expires_at, name, email, organization, inquiry_type,
          timeline, budget, message, source_path, consent_contact, consent_version,
          consented_at, notification_status, notification_attempts
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, 'pending', 0)`,
      ).bind(
        id,
        createdAtIso,
        expiresAt.toISOString(),
        input.name,
        input.email,
        input.organization,
        input.inquiryType,
        input.timeline,
        input.budget,
        input.message,
        input.sourcePath,
        consentVersion,
        createdAtIso,
      ),
    ]);
  } catch {
    logMetadata("inquiry_storage_failed", {
      request_id: requestId,
      route: "/api/operator/inquiries",
      status: 503,
      reason: "d1_write_failed",
    });
    throw new HttpError(503, "inquiry_storage_unavailable", "Inquiry storage is unavailable.");
  }

  const forgeInquiry = isForgeInquiry(input);
  const notifyTo = (forgeInquiry ? env.FORGE_NOTIFY_TO : env.INQUIRY_NOTIFY_TO)?.trim();
  const notifyCc = forgeInquiry ? env.FORGE_NOTIFY_CC?.trim() : undefined;
  const fromEmail = env.INQUIRY_FROM_EMAIL?.trim();
  if (!env.INQUIRY_EMAIL || !isEmailAddress(notifyTo) || !isEmailAddress(fromEmail) ||
      (forgeInquiry && !isEmailAddress(notifyCc))) {
    try {
      await markNotificationPending(env.DB, id, "notification_not_configured", false);
    } catch {
      // The inquiry itself is already durably stored as pending.
    }
    logMetadata("inquiry_submitted", {
      request_id: requestId,
      route: "/api/operator/inquiries",
      status: 202,
      notification: "notification_pending",
      reason: "notification_not_configured",
    });
    return jsonResponse(
      { ok: true, id, status: "submitted", notification: "notification_pending", partial: true },
      202,
    );
  }

  try {
    await sendEmailWithTimeout(
      env.INQUIRY_EMAIL,
      {
        to: notifyTo,
        from: fromEmail,
        subject: `${forgeInquiry ? "Forge" : "Hyperion"} inquiry: ${input.inquiryType}`,
        text: notificationText(input, id, consentVersion, createdAtIso),
        ...(forgeInquiry ? { cc: notifyCc as string, replyTo: input.email } : { replyTo: input.email }),
      },
      deps,
    );
  } catch (error) {
    const reason = error instanceof Error && error.name === "TimeoutError" ? "notification_timeout" : "notification_send_failed";
    try {
      await markNotificationPending(env.DB, id, reason, true);
    } catch {
      // The initial row remains pending even if this metadata update fails.
    }
    logMetadata("inquiry_submitted", {
      request_id: requestId,
      route: "/api/operator/inquiries",
      status: 202,
      notification: "notification_pending",
      reason,
    });
    return jsonResponse(
      { ok: true, id, status: "submitted", notification: "notification_pending", partial: true },
      202,
    );
  }

  try {
    await markNotificationSent(env.DB, id, deps.now().toISOString());
  } catch {
    logMetadata("inquiry_submitted", {
      request_id: requestId,
      route: "/api/operator/inquiries",
      status: 202,
      notification: "notification_pending",
      reason: "notification_state_update_failed",
    });
    return jsonResponse(
      { ok: true, id, status: "submitted", notification: "notification_pending", partial: true },
      202,
    );
  }

  logMetadata("inquiry_submitted", {
    request_id: requestId,
    route: "/api/operator/inquiries",
    status: 201,
    notification: "notified",
  });
  return jsonResponse({ ok: true, id, status: "submitted", notification: "notified", partial: false }, 201);
}
