export const SERVICE_NAME = "hyperion-operator";
export const DEFAULT_OPENROUTER_MODEL = "openai/gpt-5.2";
export const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
export const DEFAULT_CONSENT_VERSION = "2026-07-13";

export const CHAT_MAX_BODY_BYTES = 32 * 1024;
export const CHAT_MAX_MESSAGES = 12;
export const CHAT_MAX_MESSAGE_CHARS = 4_000;
export const CHAT_MAX_TOTAL_CHARS = 12_000;
export const CHAT_MAX_COMPLETION_TOKENS = 1_200;
export const CHAT_MAX_STREAM_BYTES = 1_500_000;
export const CHAT_MAX_NORMALIZED_STREAM_BYTES = 1_500_000;
export const CHAT_MAX_UPSTREAM_EVENT_BYTES = 64 * 1024;
export const CHAT_TIMEOUT_MS = 45_000;

export const INQUIRY_MAX_BODY_BYTES = 32 * 1024;
export const INQUIRY_RETENTION_DAYS = 90;
export const INQUIRY_EMAIL_TIMEOUT_MS = 5_000;

export const INTAKE_MAX_BODY_BYTES = 256 * 1024;
export const INTAKE_DRAFT_MAX_BODY_BYTES = 128 * 1024;
export const INTAKE_MAGIC_LINK_MINUTES = 15;
export const INTAKE_ANONYMOUS_DRAFT_DAYS = 14;
export const INTAKE_IDENTIFIED_DRAFT_DAYS = 30;
export const INTAKE_PUBLIC_COPY_DAYS = 90;
export const INTAKE_COOKIE_DAYS = 30;
export const INTAKE_COOKIE_NAME = "hyperion_resume";
