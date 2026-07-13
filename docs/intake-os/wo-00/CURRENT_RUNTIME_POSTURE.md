# Site Intake OS v1 — Current Runtime Posture

Observed: 2026-07-13T09:45:50Z
Classification: INTERNAL / implementation planning and verification evidence
Package: `HYPERION_SITE_INTAKE_OS_v1.zip`
Package SHA-256: `2320F6E2691854DC88F73D6525850D432EFB96AC82D4853E608E423D563FE81C`

## Executive posture

The package is architecture-ready, but the end-to-end intake operating spine is not deployed. The public site is a verified static GitHub Pages surface. Its `/api/*` paths currently return the site HTML shell, not JSON. A source-complete Cloudflare Worker exists under untracked work in `workers/operator`, but deployment, D1, email, and secret bindings remain unknown pending named tests.

The safest v1 boundary is:

1. Capture and validate the submission in a dedicated public Worker and durable D1 outbox.
2. Return a receipt without promising downstream completion.
3. Let an authenticated operator review the submission.
4. Pull/reconcile approved projections into the domain owners.
5. Record each projection result independently so partial failures can be retried idempotently.

Direct browser writes to CHR0N.OS, Mnem.OS, HypRM, Founder Command, Arg.OS, Hyperion Connect, or commerce providers are not authorized.

## Dependency classifications

| Dependency | Classification | Evidence | Constraint / next named test |
| --- | --- | --- | --- |
| Public React/Vite site | **verified** | Build, substrate audit, order posture check, and lint completed on 2026-07-13. | Existing dirty product work must be preserved. Main bundle is 543.23 kB minified. |
| Public deployment | **verified static / blocked API** | Root, `/api/public-status`, and `/api/public-intake` all returned HTTP 200 `text/html` with the same 8,808-byte shell. | Deploy a Worker and prove JSON content type, CORS, rate limiting, and receipt persistence. |
| `workers/operator` source | **verified source / unknown deployment** | Typecheck, corpus check, and 16 tests passed. | Confirm current owner, Cloudflare account, D1 migration, email binding, secrets, and live route before changing it. |
| Public intake store and outbox | **mocked** | Current Vercel-style handlers are explicitly in-memory and report `persisted: false`. | Add D1 tables and an idempotent outbox in a dedicated intake lane. |
| HypRM CRM and operations spine | **verified local runtime** | `127.0.0.1:8781/api/health` returned `hyprm` 0.1.0, SQLite, contract `hyprm-api/0.1`. Source owns clients, relationships, intakes, quotes, jobs, tickets, payments, deliverables, and CRM projections. | Add an explicit idempotent site-intake promotion endpoint; do not use a generic public entity write. |
| CiviCRM | **blocked / not selected as core** | HypRM health reports Civi core as reference-only; repo posture says Hyperion-native spine with Civi-compatible edges. | Only test import/export compatibility if an external Civi deployment is named. |
| Founder Command | **verified source / blocked runtime** | Command repo owns context cards and decision surfaces. The shared default port 8781 is currently occupied by HypRM CRM. | Add an explicit context-card projection endpoint and run a temp-port smoke test. |
| CHR0N.OS | **verified local runtime** | Installed service at 7474 reported CHR0N.OS 0.2.2; source exposes durable file ingest and intake jobs. | Define a structured, non-file submission snapshot envelope and test with a disposable fixture. No production write was performed. |
| Mnem.OS | **verified local runtime / mocked adapter** | Health returned 0.1.0-operator.13 and `operator_ready`. Proposal and continuity routes exist. | Add or verify a candidate-only endpoint that cannot default to operator-confirmed durable memory. |
| Hyperion Connect | **verified local transport runtime** | Port 3284 reported `hub-online`; source includes service fabric, outbox, and proposal transport work. | Decide and test cloud-to-local pull/reconcile. Connect transports records; it does not become the CRM or order authority. |
| Hyperion Nest | **verified local runtime / blocked compiler** | Main service at 8787 is live. Builder at 8791 reported `write_allowed=true` and `execute_allowed=true`. | Create a dedicated schema-constrained, proposal-only compiler route with tools, writes, and execution disabled. |
| Arg.OS support | **verified local runtime / mocked adapter** | Authority at 4042 reported online 1.0.0; authenticated ticket routes exist in source. | Add an operator-approved support-ticket projection and run an authenticated disposable-fixture test. |
| Commerce | **staged / blocked live** | Site contains staged Shopify Draft Order and webhook handlers; public deployment cannot serve them and current shell has no provider bindings. | Keep Shopify Draft Orders as v1 posture; verify a development-store draft and durable webhook dedupe. Stripe is not adopted by this sweep. |
| Public auth / magic link | **unknown pending named test** | No deployed public auth or session store was found. | Choose provider and test issuance, expiry, replay rejection, and account deletion before authenticated resume. |
| Upload pipeline | **blocked for v1** | No verified quarantine, malware scan, object store, or retention job exists at the public boundary. | Keep v1 text-only; later prove presigned upload, content validation, scan, quarantine, and purge. |
| Observability | **partial** | Request IDs and metadata-only logging exist in source; no verified cross-system trace or live alert was found. | Persist correlation IDs through intake, outbox, and each adapter; test one partial failure and replay. |
| Cinematic Operator assets | **blocked pending rights and budget** | Static public images exist; larger animation packs are untracked and materially larger than the current app bundle. | Name asset owner/license, set mobile/static/reduced-motion fallbacks, and pass a performance budget before shipping. |

## Truthful public language

Until the public API and adapters pass their named tests, the site may say that a request was **received for review**. It must not say that a CRM record, order, ticket, payment, CHR0N archive, Mnem memory, Founder Command card, or downstream job was created.

## Protected worktree state

The site repo already contains tracked and untracked product work, including `src/App.jsx`, public-city data, UI/content changes, and `workers/operator`. WO-00 did not rewrite, stage, commit, deploy, or push any of that work. Future implementation must coordinate ownership before editing overlapping files.
