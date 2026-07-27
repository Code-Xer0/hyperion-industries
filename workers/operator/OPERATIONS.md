# Operator Worker operations

## Binding posture

The two POST routes fail closed when their Cloudflare Rate Limiting binding is absent or errors. Chat also fails closed without `OPENROUTER_API_KEY`. Inquiry storage fails closed without D1; email is different because the inquiry is already durable, so missing or failed notification is reported as partial success.

Configure the template bindings as follows:

| Binding or variable | Purpose |
| --- | --- |
| `DB` | D1 inquiry storage and retention purge |
| `CHAT_RATE_LIMITER` | Anonymous abuse limit for model traffic |
| `INQUIRY_RATE_LIMITER` | Anonymous abuse limit for intake traffic |
| `INQUIRY_EMAIL` | Fixed-destination notification binding |
| `OPENROUTER_API_KEY` | Wrangler secret, never a plain variable |
| `FOUNDER_COMMAND_PULL_TOKEN_SHA256` | Wrangler secret containing only the pull-token SHA-256 digest |
| `FOUNDER_COMMAND_PULL_KEY_ID` | Non-secret current key version identifier |
| `FOUNDER_COMMAND_PULL_PREVIOUS_TOKEN_SHA256` | Optional previous digest during a bounded rotation overlap |
| `FOUNDER_COMMAND_PULL_PREVIOUS_UNTIL` | ISO-8601 deadline after which the previous digest fails closed |
| `CARD_STUDIO_RATE_LIMITER` | Abuse limit for project, revision, submit, and upload-session traffic |
| `CARD_STUDIO_INVITE_REQUIRED` | Defaults to fail-closed invite enforcement; set `false` only for bounded local tests |
| `CARD_STUDIO_ASSETS` | Private R2 quarantine bucket; absence disables artwork sessions |
| `CARD_STUDIO_UPLOAD_SCANNER` | Internal upload/scanning broker; absence disables artwork sessions |
| `CARD_STUDIO_SHOPIFY_STORE_DOMAIN` | Released `*.myshopify.com` store domain |
| `CARD_STUDIO_SHOPIFY_STOREFRONT_API_VERSION` | Pinned quarterly Storefront API version |
| `CARD_STUDIO_SHOPIFY_STOREFRONT_TOKEN` | Wrangler secret for Storefront cart creation |
| `CARD_STUDIO_SHOPIFY_VARIANTS` | JSON map from fixed Card Studio SKU to released ProductVariant GID |
| `CARD_STUDIO_SHOPIFY_WEBHOOK_SECRET` | Wrangler secret used to verify the exact raw webhook body |
| `OPENROUTER_MODEL` | Server-only model override |
| `SITE_ORIGIN` | Canonical HTTPS origin used by strict POST checks |
| `INQUIRY_NOTIFY_TO` | Verified notification destination |
| `INQUIRY_FROM_EMAIL` | Sender on the Email Service domain |
| `INQUIRY_CONSENT_VERSION` | Server-stamped consent notice version |

The Worker must be routed at `/api/operator/*` on `SITE_ORIGIN`. It emits no CORS allow-origin header, requires an exact `Origin` match for POSTs, and rejects cross-site `Sec-Fetch-Site` values. Local HTTP is accepted only for localhost addresses.

## Stream normalization

OpenRouter SSE is parsed inside the Worker and is never passed through. The public stream is limited to named `status`, `delta`, `sources`, `done`, and `error` events. Only `choices[0].delta.content` text is eligible for a `delta`; provider metadata, reasoning, usage, tool calls, citations, comments, and provider error bodies are discarded. A successful stream requires upstream `[DONE]`, followed by Worker-generated allowlisted corpus sources and a normalized `done` event.

## D1 and retention

Apply all migrations in order before enabling intake. `0002_operator_inquiry_budget.sql` adds the optional bounded budget field without rewriting the initial migration. Each submitted row receives an `expires_at` value exactly 90 days after receipt. Expired rows are deleted in the same D1 batch as each new insert and by the daily scheduled handler. The expiry index keeps the scheduled delete bounded.

Inquiry records contain submitted contact data by design. Worker logs do not: the logger accepts only request IDs, routes, status/reason codes, durations, counts, byte sizes, model name, notification state, and purge counts. Upstream error bodies and exception messages are never consumed into logs.

The intake operator feed is delivery-only. Acknowledgments are per outbox record and require the source revision hash plus the local receipt ID. `conflict_quarantined` can never be acknowledged as accepted business truth. Service tokens are hashed before constant-time comparison; logs include only the non-secret key ID and whether the current or previous rotation slot matched.

Card Studio uses the same authenticated feed and token rotation. Run migrations
`0005_card_studio_v1.sql` and `0006_card_studio_shopify_v1.sql` before exposing Card Studio routes. Issue invite rows
out of band; raw invite tokens are never stored, only SHA-256 digests. Project
session tokens are returned once and stored only as digests.

Artwork stays in a private quarantine lane. The scanner broker owns the actual
upload target and scan transition; this Worker stores bounded metadata and
opaque references. Do not bind a public R2 bucket. Until both bindings are
healthy, `POST /api/card-studio/uploads/sessions` returns
`503 secure_upload_unavailable`.

`release_checkout` stages a `commerce-order-projection/1` record only. The
authenticated `/api/card-studio/operator/checkout` action then verifies the
released SKU mapping and creates a Storefront cart. The Worker writes a unique
reserved attempt before network access; uncertain provider outcomes become
`ambiguous` and require reconciliation instead of an unsafe automatic retry.
Shopify webhooks are verified against the exact raw body, recorded by event ID
and hash, and projected into local order state without retaining the raw body.
Provider secrets are Wrangler secrets and never browser-visible.

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
- `409 order_intent_conflict_quarantined`: a reused public intent identifier carried different content.
- `409 checkout_not_eligible`: an operator attempted to release a review-required proposal.
- `409 checkout_attempt_requires_reconciliation`: a prior provider call may have succeeded and cannot be retried automatically.
- `503 shopify_not_configured`: provider secrets or store configuration are incomplete.
- `503 secure_upload_unavailable`: R2 quarantine or the scanning broker is unavailable.

Deployment is intentionally outside this package's test and verification commands.
