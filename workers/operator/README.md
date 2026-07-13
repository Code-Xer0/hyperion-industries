# Hyperion Operator Worker

Cloudflare Worker backend for the public Operator surface. This package is intentionally isolated from the React application and performs no deployment by itself.

## Routes

### `GET /api/operator/status`

Returns configuration readiness, the selected model name, compiled corpus identity/hash, privacy posture, and public limits. It never returns binding values or the OpenRouter key. A `degraded` response is truthful configuration state, not an outage claim.

### `POST /api/operator/chat`

Accepts only:

```json
{
  "messages": [
    { "role": "user", "content": "What does Hyperion build?" }
  ]
}
```

The first and final roles must be `user`. Client model, system, tool, plugin, provider, URL, file, and context fields are rejected. The Worker prepends the generated public corpus and calls OpenRouter at `https://openrouter.ai/api/v1/chat/completions` with:

- model `openai/gpt-5.2`, overridable only by `OPENROUTER_MODEL`
- SSE streaming
- `provider.data_collection = "deny"`
- `provider.zdr = true`
- `provider.require_parameters = true`
- empty tools/plugins and `tool_choice = "none"`
- bounded request, messages, output stream, and 45-second upstream lifetime

The Worker parses upstream SSE and emits only this normalized public protocol:

```text
event: status
data: {"status":"streaming"}

event: delta
data: {"text":"assistant text only"}

event: sources
data: {"sources":[{"id":"company-overview","title":"Hyperion Industries","href":"https://hyperion-industries.dev/"}]}

event: done
data: {"status":"complete"}
```

Failures after streaming begins use `event: error` with a bounded public code. Upstream comment keep-alives are ignored. Provider IDs, model/provider metadata, usage, reasoning, citations, tool calls, error details, and non-text deltas are never relayed. `sources` contains only links compiled from the allowlisted public corpus and is emitted immediately before `done`.

### `POST /api/operator/inquiries`

Accepts the structured fields `name`, `email`, optional `organization`, `inquiryType`, optional `timeline`, optional `budget`, `message`, optional public `sourcePath`, `consent`, and the honeypot field `website`. `budget` is a single-line string capped at 120 characters. `consent` must be exactly `true`.

Allowed inquiry types are `contact`, `field_work`, `card_studio_order`, `beta_access`, `demo_request`, `chronos_beta_issue`, and `partnership_funding`.

Successful submission plus notification returns HTTP `201` with `status: "submitted"`, `notification: "notified"`, and `partial: false`. If D1 persistence succeeds but email is unavailable, times out, fails, or cannot be confirmed, the endpoint returns HTTP `202` with `status: "submitted"`, `notification: "notification_pending"`, and `partial: true`. Honeypot submissions return `204` and are neither persisted nor emailed.

## Local verification

No secrets or Cloudflare account are required:

```powershell
npm install
npm run corpus:generate
npm run check
```

Tests mock OpenRouter, D1, rate-limit bindings, and email. Live chat in `wrangler dev` is the only local operation that needs an OpenRouter key.

## Files

- `wrangler.toml`: binding and cron template with a zero D1 placeholder; no secret values

## Founder Command intake feed

The source-complete, deployment-gated `/api/intake/operator/*` routes expose held-for-review intake revisions to the local Founder Command adapter. Each delivery acknowledgement names the exact outbox ID, revision hash, payload hash, local receipt ID, and outcome. It writes only `intake_consumer_receipts`; it never changes the source `intake_outbox` state or authorizes domain work.

Store the raw pull token only in Founder Command's Windows Credential Manager. Store only its lowercase SHA-256 digest in the Worker secret `FOUNDER_COMMAND_PULL_TOKEN_SHA256`. Rotation uses a non-secret `FOUNDER_COMMAND_PULL_KEY_ID`, an optional previous hash, and a bounded overlap deadline. Comparisons are constant-time and logs identify only the key ID/version.

The downstream preview/apply, strict review PATCH, single-flight synchronization lease, and promotion authority contracts are defined in `docs/intake-os/CUSTODY_CHAIN_V1.md`. They are not activated by this Worker release.

- `migrations/0001_operator_inquiries.sql`: initial structured D1 schema
- `migrations/0002_operator_inquiry_budget.sql`: forward migration for optional budget
- `migrations/0003_intake_os_v1.sql`: immutable public intake, proposal provenance, outbox, collision, and audit records
- `migrations/0004_intake_operator_feed.sql`: per-consumer delivery receipts without business-outbox mutation
- `corpus/public-corpus.source.json`: reviewed public allowlist
- `corpus/public-corpus.schema.json`: corpus contract
- `src/generated/public-corpus.generated.ts`: deterministic compiled corpus
- `OPERATIONS.md`: configuration, retention, and failure behavior
