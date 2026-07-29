import { HttpError, isEmailAddress, jsonResponse } from "./http";
import { logMetadata } from "./log";
import type { Env, RuntimeDependencies } from "./types";

const TEMPLATE_VERSION = "intake-received/1";
const WEBHOOK_MAX_BODY_BYTES = 64 * 1024;
const WEBHOOK_TOLERANCE_SECONDS = 5 * 60;
const HASH_PATTERN = /^[a-f0-9]{64}$/;
const SAFE_ID_PATTERN = /^[A-Za-z0-9._:-]{3,200}$/;

export interface IntakeAcknowledgementInput {
  submissionId: string;
  revision: number;
  revisionHash: string;
  receiptReference: string;
  recipient: string;
}

interface DeliveryRow {
  delivery_id: string;
  delivery_state: string;
  last_event_at: string | null;
}

interface WebhookReceiptRow {
  webhook_id: string;
}

function requireDb(env: Env): D1Database {
  if (!env.DB) throw new HttpError(503, "intake_storage_unavailable", "Intake storage is unavailable.");
  return env.DB;
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function safeProviderReference(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return SAFE_ID_PATTERN.test(normalized) ? normalized : null;
}

function acknowledgementContent(reference: string): { subject: string; text: string } {
  return {
    subject: `Hyperion intake received - ${reference}`,
    text: [
      "We received your Hyperion intake.",
      "",
      `Receipt reference: ${reference}`,
      "Review posture: held for operator review.",
      "Expected next step: Hyperion will review the request and continue the substantive conversation from hello@hyperion-industries.dev.",
      "",
      "This acknowledgement confirms receipt only. It is not a quote, order, contract, or commitment.",
    ].join("\n"),
  };
}

async function markDeliveryFailed(
  db: D1Database,
  deliveryId: string,
  at: string,
  errorCode: string,
): Promise<void> {
  await db.prepare(
    `UPDATE intake_acknowledgement_deliveries
        SET delivery_state = 'failed', attempted_at = ?, failed_at = ?, updated_at = ?, error_code = ?
      WHERE delivery_id = ?`,
  ).bind(at, at, at, errorCode, deliveryId).run();
}

export async function deliverIntakeAcknowledgement(
  env: Env,
  deps: RuntimeDependencies,
  input: IntakeAcknowledgementInput,
): Promise<void> {
  const db = requireDb(env);
  const at = deps.now().toISOString();
  const deliveryId = `ack_${(await sha256(`${input.submissionId}:${input.revision}`)).slice(0, 32)}`;
  const content = acknowledgementContent(input.receiptReference);
  const contentHash = await sha256(`${content.subject}\n\n${content.text}`);
  let inserted = false;

  try {
    const result = await db.prepare(
      `INSERT INTO intake_acknowledgement_deliveries
       (delivery_id, submission_id, revision, revision_hash, template_version, content_hash,
        delivery_state, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
       ON CONFLICT(submission_id) DO NOTHING`,
    ).bind(
      deliveryId,
      input.submissionId,
      input.revision,
      input.revisionHash,
      TEMPLATE_VERSION,
      contentHash,
      at,
      at,
    ).run();
    inserted = (result.meta.changes ?? 0) === 1;
  } catch {
    logMetadata("intake_acknowledgement_delivery", { notification: "ledger_unavailable" });
    return;
  }

  if (!inserted) {
    logMetadata("intake_acknowledgement_delivery", { notification: "duplicate_suppressed" });
    return;
  }

  const resendKey = env.RESEND_API_KEY?.trim();
  const sender = env.INTAKE_ACKNOWLEDGEMENT_FROM?.trim();
  if (!resendKey || !sender || !isEmailAddress(sender) || !isEmailAddress(input.recipient)) {
    try {
      await markDeliveryFailed(db, deliveryId, at, "configuration_required");
    } catch {
      // The immutable intake remains committed even when delivery bookkeeping is unavailable.
    }
    logMetadata("intake_acknowledgement_delivery", {
      notification: "failed",
      reason: "configuration_required",
    });
    return;
  }

  try {
    const response = await deps.fetcher("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${resendKey}`,
        "content-type": "application/json",
        "idempotency-key": deliveryId,
      },
      body: JSON.stringify({
        from: `Hyperion Intake <${sender}>`,
        to: [input.recipient],
        subject: content.subject,
        text: content.text,
      }),
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) {
      await markDeliveryFailed(db, deliveryId, at, `provider_http_${response.status}`);
      logMetadata("intake_acknowledgement_delivery", {
        notification: "failed",
        reason: `provider_http_${response.status}`,
      });
      return;
    }

    const responseText = await response.text();
    const providerReference = responseText.length <= 16 * 1024
      ? safeProviderReference((JSON.parse(responseText) as { id?: unknown }).id)
      : null;
    if (!providerReference) {
      await markDeliveryFailed(db, deliveryId, at, "provider_response_invalid");
      logMetadata("intake_acknowledgement_delivery", {
        notification: "failed",
        reason: "provider_response_invalid",
      });
      return;
    }

    await db.prepare(
      `UPDATE intake_acknowledgement_deliveries
          SET provider_reference = ?, delivery_state = 'sent', attempted_at = ?,
              provider_accepted_at = ?, updated_at = ?, error_code = NULL
        WHERE delivery_id = ?`,
    ).bind(providerReference, at, at, at, deliveryId).run();
    logMetadata("intake_acknowledgement_delivery", { notification: "sent" });
  } catch {
    try {
      await markDeliveryFailed(db, deliveryId, at, "provider_unavailable");
    } catch {
      // The immutable intake remains committed even when delivery bookkeeping is unavailable.
    }
    logMetadata("intake_acknowledgement_delivery", {
      notification: "failed",
      reason: "provider_unavailable",
    });
  }
}

function decodeBase64(value: string): Uint8Array | null {
  try {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return bytes;
  } catch {
    return null;
  }
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) mismatch |= left[index]! ^ right[index]!;
  return mismatch === 0;
}

async function verifyWebhookSignature(
  rawBody: string,
  webhookId: string,
  timestamp: string,
  signatureHeader: string,
  secret: string,
  now: Date,
): Promise<boolean> {
  const timestampSeconds = Number(timestamp);
  if (!Number.isInteger(timestampSeconds) ||
    Math.abs(Math.floor(now.getTime() / 1_000) - timestampSeconds) > WEBHOOK_TOLERANCE_SECONDS) {
    return false;
  }
  const encodedSecret = secret.startsWith("whsec_") ? secret.slice("whsec_".length) : "";
  const keyBytes = decodeBase64(encodedSecret);
  if (!keyBytes?.length) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes.buffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const expected = new Uint8Array(await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${webhookId}.${timestamp}.${rawBody}`),
  ));
  return signatureHeader.split(/\s+/).some((entry) => {
    const [version, value] = entry.split(",", 2);
    const supplied = version === "v1" && value ? decodeBase64(value) : null;
    return supplied ? constantTimeEqual(expected, supplied) : false;
  });
}

export async function handleResendWebhook(
  request: Request,
  env: Env,
  deps: RuntimeDependencies,
): Promise<Response> {
  const webhookId = request.headers.get("svix-id")?.trim() ?? "";
  const timestamp = request.headers.get("svix-timestamp")?.trim() ?? "";
  const signature = request.headers.get("svix-signature")?.trim() ?? "";
  const secret = env.RESEND_WEBHOOK_SIGNING_SECRET?.trim() ?? "";
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > WEBHOOK_MAX_BODY_BYTES) {
    throw new HttpError(413, "webhook_body_too_large", "Webhook payload exceeds the limit.");
  }
  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > WEBHOOK_MAX_BODY_BYTES) {
    throw new HttpError(413, "webhook_body_too_large", "Webhook payload exceeds the limit.");
  }
  if (!SAFE_ID_PATTERN.test(webhookId) || !secret ||
    !await verifyWebhookSignature(rawBody, webhookId, timestamp, signature, secret, deps.now())) {
    throw new HttpError(401, "webhook_signature_invalid", "Webhook signature validation failed.");
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    throw new HttpError(400, "webhook_payload_invalid", "Webhook payload is invalid.");
  }
  const eventType = typeof payload.type === "string" ? payload.type : "";
  if (!["email.delivered", "email.bounced", "email.failed"].includes(eventType)) {
    return jsonResponse({ ok: true, accepted: false, reason: "event_not_tracked" }, 202);
  }
  const eventCreatedAt = typeof payload.created_at === "string" ? payload.created_at : "";
  if (!Number.isFinite(Date.parse(eventCreatedAt))) {
    throw new HttpError(400, "webhook_payload_invalid", "Webhook event timestamp is invalid.");
  }
  const data = payload.data && typeof payload.data === "object" ? payload.data as Record<string, unknown> : {};
  const providerReference = safeProviderReference(data.email_id);
  if (!providerReference) {
    throw new HttpError(400, "webhook_payload_invalid", "Webhook provider reference is invalid.");
  }

  const db = requireDb(env);
  const replay = await db.prepare(
    "SELECT webhook_id FROM intake_acknowledgement_webhook_events WHERE webhook_id = ? LIMIT 1",
  ).bind(webhookId).first<WebhookReceiptRow>();
  if (replay) return jsonResponse({ ok: true, accepted: true, replay: true });

  const delivery = await db.prepare(
    `SELECT delivery_id, delivery_state, last_event_at
       FROM intake_acknowledgement_deliveries
      WHERE provider_reference = ? LIMIT 1`,
  ).bind(providerReference).first<DeliveryRow>();
  if (!delivery) return jsonResponse({ ok: true, accepted: false, reason: "delivery_not_found" }, 202);

  const receivedAt = deps.now().toISOString();
  const nextState = eventType === "email.delivered" ? "delivered" : eventType === "email.bounced" ? "bounced" : "failed";
  const isStale = delivery.last_event_at !== null &&
    Date.parse(delivery.last_event_at) > Date.parse(eventCreatedAt);
  if (isStale) {
    try {
      await db.prepare(
        `INSERT INTO intake_acknowledgement_webhook_events
         (webhook_id, delivery_id, provider_reference, event_type, event_created_at, received_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).bind(webhookId, delivery.delivery_id, providerReference, eventType, eventCreatedAt, receivedAt).run();
    } catch {
      const racedReplay = await db.prepare(
        "SELECT webhook_id FROM intake_acknowledgement_webhook_events WHERE webhook_id = ? LIMIT 1",
      ).bind(webhookId).first<WebhookReceiptRow>();
      if (racedReplay) return jsonResponse({ ok: true, accepted: true, replay: true });
      throw new HttpError(503, "webhook_storage_unavailable", "Webhook delivery state could not be stored.");
    }
    return jsonResponse({
      ok: true,
      accepted: true,
      replay: false,
      stale: true,
      delivery_state: delivery.delivery_state,
    });
  }
  const terminalAtColumn = nextState === "delivered" ? "delivered_at" : "failed_at";
  try {
    await db.batch([
      db.prepare(
        `INSERT INTO intake_acknowledgement_webhook_events
         (webhook_id, delivery_id, provider_reference, event_type, event_created_at, received_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).bind(webhookId, delivery.delivery_id, providerReference, eventType, eventCreatedAt, receivedAt),
      db.prepare(
        `UPDATE intake_acknowledgement_deliveries
            SET delivery_state = ?, ${terminalAtColumn} = ?, last_event_at = ?, updated_at = ?,
                error_code = CASE WHEN ? = 'delivered' THEN NULL ELSE ? END
          WHERE delivery_id = ? AND (last_event_at IS NULL OR last_event_at <= ?)`,
      ).bind(
        nextState,
        eventCreatedAt,
        eventCreatedAt,
        receivedAt,
        nextState,
        nextState === "bounced" ? "provider_bounced" : "provider_failed",
        delivery.delivery_id,
        eventCreatedAt,
      ),
    ]);
  } catch {
    const racedReplay = await db.prepare(
      "SELECT webhook_id FROM intake_acknowledgement_webhook_events WHERE webhook_id = ? LIMIT 1",
    ).bind(webhookId).first<WebhookReceiptRow>();
    if (racedReplay) return jsonResponse({ ok: true, accepted: true, replay: true });
    throw new HttpError(503, "webhook_storage_unavailable", "Webhook delivery state could not be stored.");
  }
  logMetadata("intake_acknowledgement_webhook", { notification: nextState });
  return jsonResponse({ ok: true, accepted: true, replay: false, delivery_state: nextState });
}
