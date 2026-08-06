export interface RateLimitBinding {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export interface EmailBinding {
  send(message: {
    to: string;
    from: string;
    subject: string;
    text: string;
  }): Promise<unknown>;
}

export interface Env {
  OPENROUTER_API_KEY?: string;
  OPENROUTER_MODEL?: string;
  SITE_ORIGIN?: string;
  INTAKE_API_ORIGIN?: string;
  INQUIRY_NOTIFY_TO?: string;
  INQUIRY_FROM_EMAIL?: string;
  INQUIRY_CONSENT_VERSION?: string;
  CHAT_RATE_LIMITER?: RateLimitBinding;
  INQUIRY_RATE_LIMITER?: RateLimitBinding;
  INTAKE_RESUME_RATE_LIMITER?: RateLimitBinding;
  INTAKE_SUBMISSION_RATE_LIMITER?: RateLimitBinding;
  INTAKE_OPERATOR_RATE_LIMITER?: RateLimitBinding;
  CARD_STUDIO_RATE_LIMITER?: RateLimitBinding;
  CARD_STUDIO_INVITE_REQUIRED?: string;
  CARD_STUDIO_SHOPIFY_STORE_DOMAIN?: string;
  CARD_STUDIO_SHOPIFY_STOREFRONT_API_VERSION?: string;
  CARD_STUDIO_SHOPIFY_STOREFRONT_TOKEN?: string;
  CARD_STUDIO_SHOPIFY_VARIANTS?: string;
  CARD_STUDIO_SHOPIFY_WEBHOOK_SECRET?: string;
  FOUNDER_COMMAND_PULL_KEY_ID?: string;
  FOUNDER_COMMAND_PULL_TOKEN_SHA256?: string;
  FOUNDER_COMMAND_PULL_PREVIOUS_TOKEN_SHA256?: string;
  FOUNDER_COMMAND_PULL_PREVIOUS_UNTIL?: string;
  INQUIRY_EMAIL?: EmailBinding;
  RESEND_API_KEY?: string;
  INTAKE_RESUME_FROM?: string;
  INTAKE_ACKNOWLEDGEMENT_FROM?: string;
  RESEND_WEBHOOK_SIGNING_SECRET?: string;
  INTAKE_COOKIE_NAME?: string;
  DB?: D1Database;
  CARD_STUDIO_ASSETS?: R2Bucket;
  CARD_STUDIO_UPLOAD_SCANNER?: Fetcher;
}

export interface RuntimeDependencies {
  fetcher: typeof fetch;
  now: () => Date;
  randomUUID: () => string;
  setTimer: (callback: () => void, delay: number) => number;
  clearTimer: (handle: number) => void;
}

export interface OperatorWorker {
  fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response>;
  scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void>;
}
