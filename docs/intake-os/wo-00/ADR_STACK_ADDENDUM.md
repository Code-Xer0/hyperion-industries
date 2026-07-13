# Site Intake OS v1 — ADR Stack Addendum

These decisions reconcile the supplied architecture with the verified 2026-07-13 workspace. Status labels are part of each decision and do not imply deployment.

## A-01 — Public execution boundary

**Status: selected for implementation; not deployed.**

Use a dedicated Cloudflare Worker at `workers/intake/` for public intake APIs. The current GitHub Pages deployment is static and returns the SPA shell for `/api/*`. Preserve the Vercel-style handlers as staged references until the Worker passes parity tests.

## A-02 — Public persistence and delivery

**Status: selected for implementation; mocked today.**

Use D1 for submissions, consent evidence, immutable normalized snapshots, outbox records, adapter attempts, and receipt lookup. Every write carries a stable intake ID and idempotency key. The public response acknowledges capture only; it does not wait for all projections.

## A-03 — Cloud-to-local trust boundary

**Status: selected posture; transport design pending named test.**

Local domain services remain loopback-only. Hyperion Connect should pull or reconcile signed, operator-approved outbox items; the public Worker must not hold local service credentials or open direct inbound access to the machine. A direct cloud push remains blocked until a narrower authenticated ingress is designed and tested.

## A-04 — CRM and operating spine

**Status: selected.**

HypRM CRM is the Hyperion-native owner for CRM, clients, relationships, intakes, orders/jobs, payments, deliverables, and operational records. CiviCRM remains a compatibility edge, not the core runtime. The supplied CiviCRM adapter contract is retained as an optional export/import mapping.

## A-05 — Commerce provider

**Status: Shopify Draft Orders retained; Stripe adoption deferred.**

The current repository truthfully stages Shopify Draft Orders and explicitly avoids a public cart. WO-06 must build on that posture unless the commerce owner makes a separate provider decision. Webhook HMAC verification is necessary but insufficient; dedupe and fulfillment state must be durable.

## A-06 — Compiler authority

**Status: contract selected; runtime blocked.**

The intake compiler is proposal-only, schema-constrained, and evidence-linked. It receives an immutable normalized snapshot and may emit classifications, rationale, missing-evidence flags, and proposed actions. It has no tools, network-side mutations, filesystem writes, execution authority, or ability to mark work accepted. The current Nest builder reports write and execution authority and therefore cannot serve this role unchanged.

## A-07 — Forms and deterministic rules

**Status: selected for the first slice.**

Keep JSON Schema 2020-12 for validation and a deterministic server-side rule layer for Forge profiles, Pandora readiness, routing, and required evidence. The browser may mirror rules for responsiveness but is not authoritative. Defer a new state-machine dependency until the first vertical slice proves that a reducer plus explicit state transitions is insufficient.

## A-08 — Event envelope

**Status: selected.**

Use CloudEvents-compatible envelopes around domain payloads. Event type, source, subject, time, schema version, correlation ID, causation ID, and idempotency key are mandatory. Payload schemas remain versioned Hyperion contracts.

## A-09 — Identity and access

**Status: anonymous v1 selected; authenticated resume blocked.**

The Forge thin slice may accept anonymous submissions with consent, rate limiting, abuse controls, and receipt tokens that disclose no sensitive record data. Magic-link accounts, authenticated resume, and relationship history require a separate identity-provider and deletion-policy decision.

## A-10 — Uploads

**Status: excluded from the first vertical slice.**

V1 is text-only. Uploads stay blocked until object storage, short-lived upload grants, extension and MIME validation, size limits, randomized names, quarantine, malware scanning, retention, deletion, and operator-safe retrieval are verified end to end.

## A-11 — Observability and privacy

**Status: required for WO-01.**

Propagate one correlation ID from browser receipt through outbox and every adapter. Log metadata and status transitions, not raw intake bodies. Store consent version and retention class. Provide a reconciliation view and dead-letter state before enabling more than one downstream adapter.

## A-12 — Operator animation

**Status: design approved in principle; assets blocked.**

Ship semantic interaction before cinematic weight. Mobile, static, and reduced-motion experiences are first-class. Large untracked animation atlases and WebM packs require named rights/provenance, an asset owner, lazy loading, and a performance budget. No source asset pipeline may be exposed on the public surface.
