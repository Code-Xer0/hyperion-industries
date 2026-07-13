import { handleChat } from "./chat";
import { enforceSameOrigin, errorResponse, finalizeResponse, HttpError, jsonResponse } from "./http";
import { handleInquiry, purgeExpiredInquiries } from "./inquiries";
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
]);

const DRAFT_ROUTE = /^\/api\/intake\/drafts\/(drf_[A-Za-z0-9_-]{12,64})$/;

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
      let response: Response;
      let reason: string | undefined;

      try {
        const draftMatch = url.pathname.match(DRAFT_ROUTE);
        const expectedMethod = ROUTES.get(url.pathname);
        if (!expectedMethod && !draftMatch) throw new HttpError(404, "not_found", "Route not found.");
        if (draftMatch && !["GET", "PUT", "DELETE"].includes(request.method)) {
          throw new HttpError(405, "method_not_allowed", "Method not allowed.", { allow: "GET, PUT, DELETE" });
        }
        if (expectedMethod && request.method !== expectedMethod) {
          throw new HttpError(405, "method_not_allowed", "Method not allowed.", { allow: expectedMethod });
        }

        if (["POST", "PUT", "DELETE"].includes(request.method)) enforceSameOrigin(request, env);

        if (draftMatch) response = await handleDraft(request, env, draftMatch[1] ?? "", deps);
        else if (url.pathname === "/api/operator/status") response = handleStatus(env);
        else if (url.pathname === "/api/operator/chat") response = await handleChat(request, env, requestId, deps);
        else if (url.pathname === "/api/operator/inquiries") response = await handleInquiry(request, env, requestId, deps);
        else if (url.pathname === "/api/intake/status") response = handleIntakeStatus(env);
        else if (url.pathname === "/api/intake/evaluate") response = await handleIntakeEvaluate(request);
        else if (url.pathname === "/api/intake/resume/request") response = await handleResumeRequest(request, env, requestId, deps);
        else if (url.pathname === "/api/intake/resume/exchange") response = await handleResumeExchange(request, env, deps);
        else response = await handleSubmission(request, env, requestId, deps);
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
        route: ROUTES.has(url.pathname) ? url.pathname : DRAFT_ROUTE.test(url.pathname) ? "/api/intake/drafts/:id" : "unmatched",
        method: request.method,
        status: response.status,
        duration_ms: Math.max(0, deps.now().getTime() - startedAt),
        reason,
      });
      return finalizeResponse(response, requestId);
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
