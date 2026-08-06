import { handleChat } from "./chat";
import {
  handleCardCatalog,
  handleCardOperatorCheckout,
  handleCardOperatorDecision,
  handleCardOperatorStatus,
  handleCardShopifyWebhook,
  handleOrderStatus,
  handleOrderSubmit,
  handleProjectCreate,
  handleProjectRead,
  handleRevisionCreate,
  handleUploadSession,
} from "./card-studio";
import { browserCorsOrigin, enforceSameOrigin, errorResponse, finalizeResponse, HttpError, jsonResponse } from "./http";
import { handleInquiry, purgeExpiredInquiries } from "./inquiries";
import { handleResendWebhook } from "./intake-acknowledgement";
import {
  handleDraft,
  handleIntakeEvaluate,
  handleIntakeStatus,
  handleResumeExchange,
  handleResumeRequest,
  handleSubmission,
  purgeExpiredIntake,
} from "./intake";
import { logMetadata } from "./log";
import { handleOperatorAck, handleOperatorFeed, handleOperatorStatus } from "./operator-feed";
import { handleStatus } from "./status";
import type { Env, OperatorWorker, RuntimeDependencies } from "./types";

const ROUTES = new Map([
  ["/api/operator/status", "GET"],
  ["/api/operator/chat", "POST"],
  ["/api/operator/inquiries", "POST"],
  ["/api/intake/status", "GET"],
  ["/api/intake/evaluate", "POST"],
  ["/api/intake/resume/request", "POST"],
  ["/api/intake/resume/exchange", "POST"],
  ["/api/intake/submissions", "POST"],
  ["/api/intake/webhooks/resend", "POST"],
  ["/api/intake/operator/status", "GET"],
  ["/api/intake/operator/feed", "GET"],
  ["/api/intake/operator/ack", "POST"],
  ["/api/card-studio/catalog", "GET"],
  ["/api/card-studio/projects", "POST"],
  ["/api/card-studio/uploads/sessions", "POST"],
  ["/api/card-studio/operator/status", "GET"],
  ["/api/card-studio/operator/decisions", "POST"],
  ["/api/card-studio/operator/checkout", "POST"],
  ["/api/card-studio/webhooks/shopify", "POST"],
]);

const DRAFT_ROUTE = /^\/api\/intake\/drafts\/(drf_[A-Za-z0-9_-]{12,64})$/;
const CARD_PROJECT_ROUTE = /^\/api\/card-studio\/projects\/(csp_[A-Za-z0-9_-]{12,64})$/;
const CARD_REVISION_ROUTE = /^\/api\/card-studio\/projects\/(csp_[A-Za-z0-9_-]{12,64})\/revisions$/;
const CARD_SUBMIT_ROUTE = /^\/api\/card-studio\/projects\/(csp_[A-Za-z0-9_-]{12,64})\/submit$/;
const CARD_STATUS_ROUTE = /^\/api\/card-studio\/orders\/(coi_[A-Za-z0-9_-]{12,64})\/status$/;

const defaultDependencies: RuntimeDependencies = {
  fetcher: (input, init) => globalThis.fetch(input, init),
  now: () => new Date(),
  randomUUID: () => crypto.randomUUID(),
  setTimer: (callback: () => void, delay: number) => setTimeout(callback, delay) ?? 0,
  clearTimer: (handle: number) => clearTimeout(handle),
};

export function createWorker(overrides: Partial<RuntimeDependencies> = {}): OperatorWorker {
  const deps: RuntimeDependencies = { ...defaultDependencies, ...overrides };

  return {
    async fetch(request, env) {
      const requestId = deps.randomUUID();
      const startedAt = deps.now().getTime();
      const url = new URL(request.url);
      const operatorOwnedPath = url.pathname.startsWith("/api/operator")
        || url.pathname.startsWith("/api/intake")
        || url.pathname.startsWith("/api/card-studio");

      // This Worker is the zone's edge owner. Preserve every unrelated public
      // route by forwarding it to the configured origin without inspection.
      if (!operatorOwnedPath) return deps.fetcher(request);

      const corsOrigin = browserCorsOrigin(request, env);
      if (request.method === "OPTIONS") {
        const requestedMethod = request.headers.get("access-control-request-method")?.toUpperCase();
        const requestedHeaders = (request.headers.get("access-control-request-headers") ?? "")
          .split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
        const supportedHeaders = new Set(["content-type", "idempotency-key", "x-card-session"]);
        if (!corsOrigin || !requestedMethod || !["GET", "POST", "PUT", "DELETE"].includes(requestedMethod)
          || requestedHeaders.some((value) => !supportedHeaders.has(value))) {
          return finalizeResponse(errorResponse(new HttpError(403, "cors_preflight_rejected", "CORS preflight rejected.")), requestId);
        }
        return finalizeResponse(new Response(null, {
          status: 204,
          headers: {
            "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
            "access-control-allow-headers": "content-type, idempotency-key, x-card-session",
            "access-control-max-age": "600",
          },
        }), requestId, corsOrigin);
      }

      let response: Response;
      let reason: string | undefined;

      try {
        const draftMatch = url.pathname.match(DRAFT_ROUTE);
        const cardProjectMatch = url.pathname.match(CARD_PROJECT_ROUTE);
        const cardRevisionMatch = url.pathname.match(CARD_REVISION_ROUTE);
        const cardSubmitMatch = url.pathname.match(CARD_SUBMIT_ROUTE);
        const cardStatusMatch = url.pathname.match(CARD_STATUS_ROUTE);
        const expectedMethod = ROUTES.get(url.pathname);
        const dynamicCardRoute = cardProjectMatch || cardRevisionMatch || cardSubmitMatch || cardStatusMatch;
        if (!expectedMethod && !draftMatch && !dynamicCardRoute) throw new HttpError(404, "not_found", "Route not found.");
        if (draftMatch && !["GET", "PUT", "DELETE"].includes(request.method)) {
          throw new HttpError(405, "method_not_allowed", "Method not allowed.", { allow: "GET, PUT, DELETE" });
        }
        if (expectedMethod && request.method !== expectedMethod) {
          throw new HttpError(405, "method_not_allowed", "Method not allowed.", { allow: expectedMethod });
        }
        if (cardProjectMatch && request.method !== "GET") {
          throw new HttpError(405, "method_not_allowed", "Method not allowed.", { allow: "GET" });
        }
        if ((cardRevisionMatch || cardSubmitMatch) && request.method !== "POST") {
          throw new HttpError(405, "method_not_allowed", "Method not allowed.", { allow: "POST" });
        }
        if (cardStatusMatch && request.method !== "GET") {
          throw new HttpError(405, "method_not_allowed", "Method not allowed.", { allow: "GET" });
        }

        const shopifyWebhookRoute = url.pathname === "/api/card-studio/webhooks/shopify";
        const providerWebhookRoute = url.pathname === "/api/intake/webhooks/resend";
        const operatorFeedRoute = url.pathname.startsWith("/api/intake/operator/")
          || url.pathname.startsWith("/api/card-studio/operator/");
        if (["POST", "PUT", "DELETE"].includes(request.method)
          && !operatorFeedRoute && !providerWebhookRoute && !shopifyWebhookRoute) {
          enforceSameOrigin(request, env);
        }

        if (draftMatch) response = await handleDraft(request, env, draftMatch[1] ?? "", deps);
        else if (cardProjectMatch) response = await handleProjectRead(request, env, cardProjectMatch[1] ?? "");
        else if (cardRevisionMatch) response = await handleRevisionCreate(request, env, cardRevisionMatch[1] ?? "", deps);
        else if (cardSubmitMatch) response = await handleOrderSubmit(request, env, cardSubmitMatch[1] ?? "", requestId, deps);
        else if (cardStatusMatch) response = await handleOrderStatus(request, env, cardStatusMatch[1] ?? "");
        else if (url.pathname === "/api/operator/status") response = handleStatus(env);
        else if (url.pathname === "/api/operator/chat") response = await handleChat(request, env, requestId, deps);
        else if (url.pathname === "/api/operator/inquiries") response = await handleInquiry(request, env, requestId, deps);
        else if (url.pathname === "/api/intake/operator/status") response = await handleOperatorStatus(request, env, deps);
        else if (url.pathname === "/api/intake/operator/feed") response = await handleOperatorFeed(request, env, deps);
        else if (url.pathname === "/api/intake/operator/ack") response = await handleOperatorAck(request, env, deps);
        else if (url.pathname === "/api/intake/status") response = handleIntakeStatus(env);
        else if (url.pathname === "/api/intake/evaluate") response = await handleIntakeEvaluate(request);
        else if (url.pathname === "/api/intake/resume/request") response = await handleResumeRequest(request, env, requestId, deps);
        else if (url.pathname === "/api/intake/resume/exchange") response = await handleResumeExchange(request, env, deps);
        else if (url.pathname === "/api/intake/webhooks/resend") response = await handleResendWebhook(request, env, deps);
        else if (url.pathname === "/api/intake/submissions") response = await handleSubmission(request, env, requestId, deps);
        else if (url.pathname === "/api/card-studio/catalog") response = handleCardCatalog();
        else if (url.pathname === "/api/card-studio/projects") response = await handleProjectCreate(request, env, deps);
        else if (url.pathname === "/api/card-studio/uploads/sessions") response = await handleUploadSession(request, env, deps);
        else if (url.pathname === "/api/card-studio/operator/status") response = await handleCardOperatorStatus(request, env, deps);
        else if (url.pathname === "/api/card-studio/operator/checkout") response = await handleCardOperatorCheckout(request, env, requestId, deps);
        else if (url.pathname === "/api/card-studio/webhooks/shopify") response = await handleCardShopifyWebhook(request, env, deps);
        else response = await handleCardOperatorDecision(request, env, requestId, deps);
      } catch (error) {
        if (error instanceof HttpError) {
          reason = error.code;
          response = errorResponse(error);
        } else {
          reason = "internal_error";
          response = jsonResponse(
            { ok: false, error: { code: "internal_error", message: "An internal error occurred." } },
            500,
          );
        }
      }

      logMetadata("api_request", {
        request_id: requestId,
        route: ROUTES.has(url.pathname) ? url.pathname
          : DRAFT_ROUTE.test(url.pathname) ? "/api/intake/drafts/:id"
          : CARD_PROJECT_ROUTE.test(url.pathname) ? "/api/card-studio/projects/:id"
          : CARD_REVISION_ROUTE.test(url.pathname) ? "/api/card-studio/projects/:id/revisions"
          : CARD_SUBMIT_ROUTE.test(url.pathname) ? "/api/card-studio/projects/:id/submit"
          : CARD_STATUS_ROUTE.test(url.pathname) ? "/api/card-studio/orders/:id/status"
          : "unmatched",
        method: request.method,
        status: response.status,
        duration_ms: Math.max(0, deps.now().getTime() - startedAt),
        reason,
      });
      return finalizeResponse(response, requestId, corsOrigin);
    },

    async scheduled(_controller, env, ctx) {
      if (!env.DB) {
        logMetadata("inquiry_purge_skipped", { reason: "d1_unavailable" });
        return;
      }
      ctx.waitUntil(
        Promise.all([purgeExpiredInquiries(env.DB, deps.now()), purgeExpiredIntake(env.DB, deps.now())])
          .then(([purgedRows, intake]) => logMetadata("retention_purge_complete", {
            purged_rows: purgedRows,
            purged_grants: intake.grants,
            purged_drafts: intake.drafts,
            purged_submissions: intake.submissions,
          }))
          .catch(() => logMetadata("retention_purge_failed", { reason: "d1_delete_failed" })),
      );
    },
  };
}

export default createWorker();
