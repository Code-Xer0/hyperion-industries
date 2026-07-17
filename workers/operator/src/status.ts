import {
  CHAT_MAX_BODY_BYTES,
  CHAT_MAX_MESSAGE_CHARS,
  CHAT_MAX_MESSAGES,
  CHAT_MAX_TOTAL_CHARS,
  CHAT_TIMEOUT_MS,
  INQUIRY_MAX_BODY_BYTES,
  INQUIRY_RETENTION_DAYS,
  SERVICE_NAME,
} from "./constants";
import { CORPUS_METADATA } from "./corpus";
import { isEmailAddress, jsonResponse, modelConfiguration, originConfiguration } from "./http";
import type { Env } from "./types";
import { publicContractManifest } from "../../../shared/intake/model";

export function handleStatus(env: Env): Response {
  const model = modelConfiguration(env);
  const origin = originConfiguration(env);
  const chatReady = Boolean(env.OPENROUTER_API_KEY?.trim() && env.CHAT_RATE_LIMITER && model.valid && origin.valid);
  const inquiryStorageReady = Boolean(env.DB && env.INQUIRY_RATE_LIMITER && origin.valid);
  const notificationReady = Boolean(
    env.INQUIRY_EMAIL &&
      isEmailAddress(env.INQUIRY_NOTIFY_TO?.trim()) &&
      isEmailAddress(env.INQUIRY_FROM_EMAIL?.trim()),
  );
  const forgeNotificationReady = Boolean(
    env.INQUIRY_EMAIL &&
      isEmailAddress(env.FORGE_NOTIFY_TO?.trim()) &&
      isEmailAddress(env.FORGE_NOTIFY_CC?.trim()) &&
      isEmailAddress(env.INQUIRY_FROM_EMAIL?.trim()),
  );
  const intake = publicContractManifest();
  const intakeStorageReady = Boolean(env.DB && env.INTAKE_SUBMISSION_RATE_LIMITER && origin.valid);
  const resumeReady = Boolean(
    env.DB &&
      env.INTAKE_RESUME_RATE_LIMITER &&
      env.RESEND_API_KEY?.trim() &&
      isEmailAddress(env.INTAKE_RESUME_FROM?.trim()) &&
      origin.valid,
  );
  const operatorFeedReady = Boolean(
    env.DB &&
      env.INTAKE_OPERATOR_RATE_LIMITER &&
      /^[A-Za-z0-9._-]{3,80}$/.test(env.FOUNDER_COMMAND_PULL_KEY_ID?.trim() ?? "") &&
      /^[a-f0-9]{64}$/i.test(env.FOUNDER_COMMAND_PULL_TOKEN_SHA256?.trim() ?? ""),
  );

  return jsonResponse({
    service: SERVICE_NAME,
    status: chatReady && inquiryStorageReady && notificationReady && forgeNotificationReady ? "ready" : "degraded",
    model: model.model,
    capabilities: {
      chat: chatReady ? "ready" : "configuration_required",
      inquiry_storage: inquiryStorageReady ? "ready" : "configuration_required",
      inquiry_notification: notificationReady ? "ready" : "configuration_required",
      forge_inquiry_notification: forgeNotificationReady ? "ready" : "configuration_required",
      intake_storage: intakeStorageReady ? "ready" : "configuration_required",
      intake_resume: resumeReady ? "ready" : "configuration_required",
      intake_operator_feed: operatorFeedReady ? "ready" : "configuration_required",
    },
    corpus: CORPUS_METADATA,
    privacy: {
      corpus: "compiled_public_allowlist_only",
      provider_data_collection: "deny",
      provider_zero_data_retention: "required",
      tools: "disabled",
      logs: "metadata_only",
      same_origin_posts: "required",
    },
    limits: {
      chat_body_bytes: CHAT_MAX_BODY_BYTES,
      chat_messages: CHAT_MAX_MESSAGES,
      chat_message_chars: CHAT_MAX_MESSAGE_CHARS,
      chat_total_chars: CHAT_MAX_TOTAL_CHARS,
      chat_timeout_ms: CHAT_TIMEOUT_MS,
      inquiry_body_bytes: INQUIRY_MAX_BODY_BYTES,
      inquiry_retention_days: INQUIRY_RETENTION_DAYS,
    },
    intake,
  });
}
