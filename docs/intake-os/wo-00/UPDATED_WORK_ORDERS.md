# Site Intake OS v1 — Updated Work Orders

These amendments replace placeholder repo names and speculative interfaces with verified owners and commands. They do not authorize writes to dirty adjacent repos. Every work order begins by rechecking its branch, status, and live process owner.

## WO-00 — Runtime and repository verification

**State: complete for the 2026-07-13 baseline.**

Outputs are the six files in this directory. No product code, deployment, provider write, commit, or push was performed.

## WO-01 — Forge capture, store, outbox, and receipt

**Implementation repo:** `D:\Lab\Git\hyperion-industries-publish`
**New paths:** `src/features/intake/`, `workers/intake/`
**Protected overlap:** `src/App.jsx`, `workers/operator/`, existing staged `api/` handlers

Deliver the Forge thin slice only: schema-driven client form, server validation, consent capture, D1 transaction for submission plus outbox, idempotent replay, review state, and truthful receipt. Do not implement uploads, accounts, payments, or domain writes.

Required gates:

```powershell
npm run lint
npm run build
npm run substrate:audit
node scripts/verify-order-apis.mjs
npm --prefix workers/intake run typecheck
npm --prefix workers/intake test
```

Live acceptance: root stays compiled-only; intake route returns JSON; duplicate idempotency key returns the original receipt; forced email/outbox failure is recoverable; no response claims a downstream record exists.

## WO-02 — Deterministic profiles and routing

**Implementation owner:** `workers/intake/src/domain/`
**Presentation mirror:** `src/features/intake/`
**Contract source:** the five schemas and eight forms in the supplied package, imported and versioned during the work order

Implement server-authoritative Forge profiles, Pandora readiness, general routing, required evidence, and explanation codes as pure deterministic functions. The client renders results but cannot upgrade readiness or authority.

Required gates: table tests for all rules, schema validation fixtures for every lane, property tests for idempotent normalization, and the WO-01 gates.

## WO-03 — Operator-gated domain adapters

**Transport coordinator:** `D:\Lab\Git\Hyperion-Connect\relay\service_fabric.py` and `relay\connect_outbox.py`
**CRM/operations projection:** `D:\Lab\Git\HypRM-Command\server\hyprm\api.py` and `storage.py`
**Founder projection:** `D:\Lab\Git\HypRM-Founder-Command\server\hyprm\api.py` plus `app\src\features\founder\contracts\`
**CHR0N snapshot:** `D:\Lab\Git\Frameworks\server\api.py` plus a new isolated structured-intake module
**Mnem proposal:** `D:\Lab\Git\Mnem.OS` proposal/review service
**Support ticket:** `D:\Lab\Git\Arg.OS\negotiator` authenticated ticket API

Add one adapter at a time. Start with HypRM CRM. Each receiving domain owns its endpoint, idempotency record, audit entry, and rollback/compensation semantics. Connect owns transport and delivery receipts only.

Repo gates before handoff:

```powershell
# HypRM CRM
npm run check
npm run smoke:api

# Founder Command
npm run check
npm run smoke:api

# Hyperion Connect
npm run check

# Mnem source gate
npm run check

# Arg.OS source gate
npm run build
npm run test:runtime
```

CHR0N must use its repo-native Python tests and a disposable ingest fixture; do not run a production write as a smoke test.

## WO-04 — Proposal-only intake compiler

**Implementation repo:** `D:\Lab\Git\Hyperion-Nest`
**New path:** `src/builder/intakeCompilerApi.ts` with an explicit server route such as `/api/intake/compiler/compile`

Implement a versioned input/output contract around immutable normalized snapshots. The runtime must hard-disable tool calls, filesystem writes, command execution, and downstream network mutations. Reject non-conforming model output. Store compiler proposals separately from operator decisions.

Required gates:

```powershell
npm run build
npm test
npm run verify:providers
npm run verify:live-posture
npm run verify:honesty-audit
```

Add dedicated tests proving tool denial, invalid-output rejection, evidence linkage, timeout handling, and zero downstream mutation.

## WO-05 — Cinematic intake experience

**Implementation repo:** `D:\Lab\Git\hyperion-industries-publish`
**Primary path:** `src/features/intake/presentation/`
**Reference path:** `D:\Lab\Git\Scen.OS\src\renderer\styles\scenos.css`

Implement compact-at-rest, expand-on-focus interactions after WO-01 is stable. Start with current lightweight public Operator assets. Large animation packs remain blocked until rights/provenance and asset budgets are signed off.

Acceptance adds keyboard-only completion, screen-reader labels and error summary, reduced-motion behavior, static fallback, narrow mobile layout, lazy-loaded non-critical visuals, and no regression to the existing 543.23 kB main-chunk baseline without explicit approval.

## WO-06 — Draft-order commerce and reconciliation

**Public boundary:** `workers/intake/src/commerce/`
**Reference implementation:** `D:\Lab\Git\hyperion-industries-publish\api\shopify\`
**Operations authority:** `D:\Lab\Git\HypRM-Command` order/payment/external-reference records

Retain operator-reviewed Shopify Draft Orders. Create drafts only after approval; persist provider IDs and webhook event IDs; verify signatures against the raw body; reconcile provider lifecycle into HypRM; never mark fulfillment from the browser redirect alone.

Acceptance requires a development store, durable webhook dedupe, replay tests, partial-failure recovery, refund/cancel posture, tax/shipping ownership, secret rotation, and truthful no-provider-config behavior.

## Sequencing gate

Begin WO-01 only after the owner of `workers/operator` confirms whether the new intake Worker is a sibling lane or a coordinated consolidation. WO-02 may proceed inside the isolated intake lane. WO-03 starts with HypRM only after WO-01 proves capture/outbox/replay. WO-04, WO-05, and WO-06 remain behind their specific authority, rights, and provider gates.
