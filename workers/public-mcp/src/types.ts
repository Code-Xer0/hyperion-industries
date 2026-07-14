export interface RateLimitBinding {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export interface ServiceBinding {
  fetch(request: Request): Promise<Response>;
}

export interface Env {
  SITE_ORIGIN?: string;
  MCP_ORIGIN?: string;
  MCP_CONFIRMATION_SECRET?: string;
  OPERATOR_SERVICE?: ServiceBinding;
  DISCOVERY_RATE_LIMITER?: RateLimitBinding;
  SEARCH_RATE_LIMITER?: RateLimitBinding;
  EVALUATE_RATE_LIMITER?: RateLimitBinding;
  PREPARE_RATE_LIMITER?: RateLimitBinding;
  SUBMIT_RATE_LIMITER?: RateLimitBinding;
  RESUME_RATE_LIMITER?: RateLimitBinding;
}

export interface RuntimeDependencies {
  now: () => Date;
  randomUUID: () => string;
  log: (event: string, metadata: Record<string, string | number | boolean | undefined>) => void;
}
