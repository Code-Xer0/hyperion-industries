# WO-00 Verification Evidence Index

All observations are read-only unless the command is explicitly a local build/test. No external write, deployment, staging, commit, or push was performed.

## Package evidence

| Evidence | Result |
| --- | --- |
| ZIP SHA-256 | `2320F6E2691854DC88F73D6525850D432EFB96AC82D4853E608E423D563FE81C` |
| Archive inventory | 36 archive entries; 31 extracted files |
| Package verification report | Package JSON validates; it does not claim runtime verification |
| WO-00 requirement | Classify every dependency as verified, mocked, blocked, or unknown pending a named test |

## Site and Worker gates

Run from `D:\Lab\Git\hyperion-industries-publish` on 2026-07-13:

| Command | Result |
| --- | --- |
| `npm run substrate:audit` | PASS — 11 contract routes, 9 systems, 7 intake models |
| `node scripts/verify-order-apis.mjs` | PASS — order API posture checks |
| `npm run build` | PASS — Vite 8.0.11; 2,243 modules; JS 543.23 kB minified / 166.92 kB gzip; size warning |
| `npm run lint` | PASS with 0 errors and 9 existing React hook warnings in `RadioContext.jsx` |
| `npm --prefix workers/operator run corpus:check` | PASS — public corpus valid and current |
| `npm --prefix workers/operator run typecheck` | PASS |
| `npm --prefix workers/operator test -- --run` | PASS — 4 files, 16 tests |

## Live read-only probes

Observed at `2026-07-13T09:45:50Z`:

| Target | Result | Interpretation |
| --- | --- | --- |
| `https://hyperion-industries.dev/` | 200 `text/html`, 8,808 bytes | Public compiled site is live. |
| `https://hyperion-industries.dev/api/public-status` | 200 `text/html`, 8,808 bytes | SPA fallback; status API is not live. |
| `https://hyperion-industries.dev/api/public-intake` | 200 `text/html`, 8,808 bytes | SPA fallback; intake API is not live. |
| `127.0.0.1:3284/api/hyperion/connect/status` | 200 JSON, `hub-online` | Hyperion Connect relay is live locally. |
| `127.0.0.1:4042/api/healthz` | 200 JSON, online 1.0.0 | Arg.OS authority is live locally. |
| `127.0.0.1:7474/api/version` | 200 JSON, CHR0N.OS 0.2.2 | Installed CHR0N runtime is live locally. |
| `127.0.0.1:8765/api/health` | 200 JSON, Mnem 0.1.0-operator.13 | Mnem operator runtime is live locally. |
| `127.0.0.1:8781/api/health` | 200 JSON, HypRM 0.1.0 / SQLite | Hyperion-native CRM and operations spine is live locally. |
| `127.0.0.1:8787/api/health` | 200 JSON, Hyperion Nest | Nest main service is live locally. |
| `127.0.0.1:8791/health` | 200 JSON, writes and execution allowed | Current builder is not a safe public intake compiler. |

## Source-interface evidence

| Owner | Verified source fact |
| --- | --- |
| Site | Staged intake/order handlers are in-memory and truthfully report `persisted: false`; GitHub Pages cannot execute them. |
| HypRM CRM | Storage definitions include clients, relationships, intakes, quotes, jobs, tickets, payments, deliverables, external references, and audit events. |
| Founder Command | Command summary, context, decision queue, connector contracts, and context-card storage exist. |
| CHR0N.OS | `/api/ingest` provides hashed durable file intake and job/provenance tracking. A structured submission snapshot contract is not yet verified. |
| Mnem.OS | Proposal and continuity routes exist; the memory proposal path must be prevented from defaulting to confirmed promotion. |
| Connect | Relay/service-fabric/outbox code exists. It is transport and reconciliation, not domain ownership. |
| Nest | Provider and agent infrastructure exists, but the live builder authority is broader than the proposal-only intake contract. |
| Arg.OS | Authenticated ticket list/create/update/action routes exist. |

## Named tests still required

1. Deploy a non-production intake Worker; confirm JSON content type, same-origin policy, rate limiting, D1 persistence, idempotent replay, and truthful receipts.
2. Force one downstream adapter failure and prove independent retry without duplicating successful projections.
3. Promote a disposable intake into HypRM through an explicit endpoint; verify audit event and external reference.
4. Generate a Founder Command context card on a non-conflicting temp port.
5. Send a candidate-only Mnem proposal and prove that no durable memory is promoted without operator action.
6. Compile a submission through a no-tool/no-write Nest route and reject an invalid schema result.
7. Create and delete a disposable Arg.OS ticket through authenticated operator authority.
8. Create a Shopify development-store draft and replay a signed webhook against durable dedupe storage.
9. Prove retention purge, consent withdrawal, and subject deletion across intake and projections.
