# Operator Worker operations

## Binding posture

The two POST routes fail closed when their Cloudflare Rate Limiting binding is absent or errors. Chat also fails closed without `OPENROUTER_API_KEY`. Inquiry storage fails closed without D1; email is different because the inquiry is already durable, so missing or failed notification is reported as partial success.

Configure the template bindings as follows:

| Binding or variable | Purpose |
| --- | --- |
| `DB` | D1 inquiry storage and retention purge |
| `CHAT_RATE_LIMITER` | Anonymous abuse limit for model traffic |
| `INQUIRY_RATE_LIMITER` | Anonymous abuse limit for intake traffic |
| `INTAKE_RESUME_RATE_LIMITER` | Anonymous abuse limit for resume-email requests |
| `INTAKE_SUBMISSION_RATE_LIMITER` | Anonymous abuse limit for intake submissions |
| `INTAKE_OPERATOR_RATE_LIMITER` | Service-token limit for the Founder Command feed |
| `INQUIRY_EMAIL` | Verified-destination notification binding |
| `OPENROUTER_API_KEY` | Wrangler secret, never a plain variable |
| `RESEND_API_KEY` | Wrangler secret for intake resume email |
| `FOUNDER_COMMAND_PULL_TOKEN_SHA256` | Wrangler secret containing only the pull-token SHA-256 digest |
| `FOUNDER_COMMAND_PULL_KEY_ID` | Non-secret current key version identifier |
| `FOUNDER_COMMAND_PULL_PREVIOUS_TOKEN_SHA256` | Optional previous digest during a bounded rotation overlap |
| `FOUNDER_COMMAND_PULL_PREVIOUS_UNTIL` | ISO-8601 deadline after which the previous digest fails closed |
| `OPENROUTER_MODEL` | Server-only model override |
| `SITE_ORIGIN` | Canonical HTTPS origin used by strict POST checks |
| `INQUIRY_NOTIFY_TO` | Secret containing the verified general inquiry destination |
| `FORGE_NOTIFY_TO` | Secret containing the verified primary Forge destination |
| `FORGE_NOTIFY_CC` | Secret containing the verified Forge operator-copy destination |
| `INQUIRY_FROM_EMAIL` | Sender on the Email Service domain |
| `INQUIRY_CONSENT_VERSION` | Server-stamped consent notice version |

Production routes the Worker at `/api/operator/*` and `/api/intake/*` on `SITE_ORIGIN`, with `workers.dev` and preview URLs disabled. Browser intake is same-origin only: there is no alternate browser API origin, the Worker emits no CORS allow-origin header, requires an exact `Origin` match for state-changing browser requests, and rejects cross-site `Sec-Fetch-Site` values. Bearer-authenticated `/api/intake/operator/*` service routes remain exempt from browser-origin checks. Local HTTP is accepted only for localhost addresses.

Intake pages do not load third-party analytics. The site edge applies an intake-only CSP that limits scripts and API connections to the first-party origin. Browser persistence contains only opaque draft/session identifiers and non-sensitive progress metadata; identity and answers remain in memory or in authorized Worker draft storage.

Required production Wrangler secrets are `OPENROUTER_API_KEY`, `RESEND_API_KEY`, `FOUNDER_COMMAND_PULL_TOKEN_SHA256`, `INQUIRY_NOTIFY_TO`, `FORGE_NOTIFY_TO`, and `FORGE_NOTIFY_CC`. `FOUNDER_COMMAND_PULL_PREVIOUS_TOKEN_SHA256` is optional during a bounded rotation overlap. Never place secret values in source control.

## Stream normalization

OpenRouter SSE is parsed inside the Worker and is never passed through. The public stream is limited to named `status`, `delta`, `sources`, `done`, and `error` events. Only `choices[0].delta.content` text is eligible for a `delta`; provider metadata, reasoning, usage, tool calls, citations, comments, and provider error bodies are discarded. A successful stream requires upstream `[DONE]`, followed by Worker-generated allowlisted corpus sources and a normalized `done` event.

## D1 and retention

Apply all migrations in order before enabling intake. `0002_operator_inquiry_budget.sql` adds the optional bounded budget field without rewriting the initial migration. Each submitted row receives an `expires_at` value exactly 90 days after receipt. Expired rows are deleted in the same D1 batch as each new insert and by the daily scheduled handler. The expiry index keeps the scheduled delete bounded.

Inquiry records contain submitted contact data by design. Worker logs do not: the logger accepts only request IDs, routes, status/reason codes, durations, counts, byte sizes, model name, notification state, and purge counts. Upstream error bodies and exception messages are never consumed into logs.

Direct inbound mail to `forge@hyperion-industries.dev` is handled separately by `workers/forge-mail-router`. That Worker forwards to the primary owner first and sends an operator continuity copy without inspecting or persisting content. Its required secret names are `FORGE_PRIMARY_DESTINATION` and `FORGE_OPERATOR_COPY_DESTINATION`.

The intake operator feed is delivery-only and advertises `hyperion.intake.operator-feed/2.0`. Its fixed transport metadata scopes `held_for_review` to the Worker delivery outbox; Founder owner, SLA, business-review, approval, and promotion state are deliberately absent. Consumer receipts are append-only: an exact acknowledgement replay is idempotent, while any changed receipt ID, outcome, revision hash, payload hash, or business-truth value returns `409 acknowledgement_conflict` without updating the stored receipt. `conflict_quarantined` can never be acknowledged as accepted business truth. Service tokens are hashed before constant-time comparison; logs include only the non-secret key ID and whether the current or previous rotation slot matched.

## Public corpus updates

Edit only `corpus/public-corpus.source.json`, keep every item explicitly public, and regenerate. CI or local verification should run `npm run corpus:check`; it compares the whole generated module and SHA-256 digest, so an unreviewed runtime corpus change cannot hide behind a stale artifact.

## Failure semantics

- `429 rate_limited`: binding denied the request.
- `503 rate_limit_unavailable`: protective binding missing or errored; request was not processed.
- `503 chat_not_configured`: OpenRouter secret missing.
- `502 upstream_unavailable`: provider status/content type/fetch failure; provider details are withheld.
- `504 upstream_timeout`: provider did not establish the stream inside the bounded lifetime.
- `503 inquiry_storage_unavailable`: nothing was accepted or emailed.
- `202 notification_pending`: inquiry status is `submitted`, but notification delivery or state confirmation is incomplete.

## Deploy verification

Deployment is intentionally outside this package's test and verification commands. Before an authorized deploy, run `npm run check` in this directory and a Wrangler dry run against `wrangler.toml`. After deployment, verify that `GET https://hyperion-industries.dev/api/operator/status` and `GET https://hyperion-industries.dev/api/intake/status` return the Worker status responses, and confirm neither response includes `Access-Control-Allow-Origin`. Confirm a cross-origin `OPTIONS` request is rejected. Do not read `/api/intake/operator/feed` as a deployment check.

The production retention schedule remains a separate Cloudflare scheduled trigger. Verify it independently after route deployment so trigger permissions cannot roll back the API routes.
