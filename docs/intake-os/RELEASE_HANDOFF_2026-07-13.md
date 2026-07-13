# Hyperion Site Intake OS v1 — Release Handoff

Date: 2026-07-13

## Outcome

Hyperion Site Intake OS v1 is deployed as a seven-lane public custody edge for Forge, Pandora, Continuity, Operator Identity, Support, Relationships, and General signals. Public evaluation, immutable D1 submission, and idempotent receipt replay are live. Magic-link resume remains configuration-gated pending Resend authorization.

The public release stops at **received for operator review**. It does not create or mutate CRM contacts, orders, jobs, tickets, payments, deliverables, memory, CHR0N records, Founder Command state, or domain-system records.

## Maturity and authority

| Surface | State | Authority |
| --- | --- | --- |
| React intake experience | Live / endpoint-binding release in progress | Capture, local draft recovery, deterministic preview, receipt display |
| Operator Worker and D1 migrations | Live / storage and evaluation ready | Validate, persist immutable public evidence, route deterministically, issue resume sessions, hold outbox records |
| Founder Command delivery feed | Source-complete / deployment-gated | Deliver immutable records and record per-item custody acknowledgments only |
| Founder Command review and promotion | Contracted / not activated | Future local review, preview, approval-receipt issue, and explicit operator-authorized apply |
| Domain adapters | Not implemented | No domain writes in v1 |
| Nest analysis | Disabled | No write or execution authority |
| Cloudflare Worker, D1, public Pages | Live / verified Worker endpoint | Public capture and immutable receipt only |
| Resend and scheduled retention | Configuration required | Resume email and daily purge remain disabled until their named gates pass |

## Public experience

- Lazy routes: `/intake`, `/intake/resume`, and `/intake/:lane`.
- Sequence: Aperture → Handshake → Signal → Load / Limits → Fit → Review → Dispatch.
- Shared contact/consent contract v1.0.1 for every lane.
- Local drafts expire after 14 days; identified cloud drafts expire after 30 days.
- Cloud save begins only after explicit resume consent and magic-link redemption.
- No public uploads. Secure evidence is requested only through a later operator-controlled channel.
- Full, reduced, and static effects modes use four approved Operator frames.
- Forge and Pandora return transparent evidence-linked profiles; other lanes return a proposed route or manual-review posture.

## Custody controls

- Canonical SHA-256 revision hashes and immutable supersession links.
- Same-ID/same-hash replay returns the original receipt.
- Same-ID/different-hash collisions are durably quarantined before a conflict response.
- Proposal provenance binds the input revision, policy version, analyzer identity/version, and minimized-projection hash.
- Founder Command feed acknowledgments name each outbox ID, revision hash, payload hash, local receipt ID, and outcome.
- A quarantined conflict can never be acknowledged as accepted business truth.
- Service-token validation uses constant-time hash comparison with current/previous rotation slots and a bounded overlap.
- Preview/apply must use a short-lived one-time approval receipt bound to intake, revision, proposal, target domain, and proposed changes. The downstream apply adapter is not active in v1.
- Review PATCH is contracted as a strict allowlist for owner, due date, custody note, review state, and tags only.

See `CUSTODY_CHAIN_V1.md` and `shared/intake/contracts/schemas/custody-control.schema.json`.

## Verification summary

- Worker corpus check and TypeScript check passed.
- Worker suite passed: 7 files, 58 tests.
- Site ESLint passed with zero errors and nine pre-existing radio-hook warnings.
- Order API posture and substrate audits passed.
- Production build passed.
- Main entry: 168.91 kB gzip, approximately 0.27 kB over the City baseline and below the 20 kB intake allowance.
- Intake route: 17.15 kB JavaScript gzip plus 4.46 kB CSS gzip, below the 150 kB route budget.
- Seven direct lane flows passed across 1280×720, 390×844, and 320 CSS px.
- Keyboard-only completion, error-summary focus, reduced/static motion, 200%-equivalent reflow, offline recovery, and zero horizontal overflow passed.
- Automated WCAG A/AA scan found only an empty document-title issue; the title ownership was corrected and the targeted rerun returned zero violations.
- Controlled local D1 acceptance persisted one synthetic submission, one decision, one audit event, and one `held_for_review` outbox record; idempotent replay returned the original receipt.

## Live deployment posture

- Wrangler is authenticated to the approved Cloudflare account.
- D1 `hyperion-operator` is bound and migrations `0001` through `0004` are applied.
- The verified runtime endpoint is `https://hyperion-operator.hyperion-industries-intake.workers.dev`; exact-origin credentialed CORS permits only the public site.
- Evaluation, immutable submission, and idempotent receipt replay passed live acceptance.
- The broad analytics edge Worker was retired only after its GA4 behavior was preserved in the compiled site.
- Resend authentication, the production `RESEND_API_KEY`, controlled magic-link delivery, and redemption remain pending. Resume status therefore stays `configuration_required`.
- The tested retention handler has no production cron because Cloudflare rejected schedule creation for the current OAuth scope. Run a bounded manual purge if required before the trigger is authorized.
- The Founder Command service-token digest is not configured; the operator feed remains unavailable and no downstream delivery is claimed.

## Rollback

- Revert the Intake OS commit to remove public routes and entry points while retaining the independent City baseline.
- Roll back the Worker with Wrangler version rollback.
- Retain additive D1 tables for evidence and recovery; do not destructively down-migrate during incident response.
- Disable public Worker routes or secrets before attempting data repair.
- Reconcile receipts and outbox acknowledgments before resuming delivery.
