# Site Intake OS v1 — Path Ownership Map

This map assigns implementation paths without transferring domain authority. Paths marked **protected overlap** already contain user or adjacent-agent work and require an ownership check before editing.

## Public acquisition repo

Canonical root: `D:\Lab\Git\hyperion-industries-publish`

| Path | Owner / purpose | WO-00 rule |
| --- | --- | --- |
| `src/features/intake/` | New compiled client experience, lane router, form presentation, receipts | New path; site team owns presentation only. |
| `src/App.jsx` | Public route registration | **Protected overlap**; currently modified. Make only a narrow route change after reconciling existing work. |
| `src/components/portal/OperatorMascot.jsx` | Existing lightweight Operator presentation | Reuse only after visual owner review; keep static and reduced-motion fallbacks. |
| `public/assets/operators/` | Existing static Operator imagery | Do not add large animation atlases until rights and performance gates pass. |
| `workers/operator/` | Existing untracked public Operator chat/inquiry Worker | **Protected overlap**. Do not absorb the Intake OS into this lane until its owner and deployment posture are named. |
| `workers/intake/` | Recommended new public intake API, D1 store, outbox, validation, receipts, and commerce webhook boundary | New isolated lane. It may share reviewed utilities later; it must not expose domain credentials. |
| `api/public-intake.js` | Existing staged Vercel handler | Preserve as a truth-surface/mock test; do not call it production persistence. |
| `api/order-intake.js` | Existing staged order-intent handler | Preserve until Worker replacement passes parity tests. |
| `api/shopify/*` | Existing staged server-only Shopify handlers | Reference implementation; production handler belongs behind the deployed Worker with durable dedupe. |
| `docs/intake-os/wo-00/` | Verification, ownership, ADR, and execution handoff | Internal evidence; not part of the public compiled bundle. |

## Domain repositories

| Canonical repo | Owned paths | Allowed intake responsibility | Prohibited responsibility |
| --- | --- | --- | --- |
| `D:\Lab\Git\HypRM-Command` | `server/hyprm/api.py`, `server/hyprm/storage.py`, `server/hyprm/interop/civicrm/`, `app/` | Operator-approved promotion into CRM, client, relationship, intake, quote, job, payment, deliverable, external reference, and audit records | Public capture, browser auth, public secrets, or becoming Founder Command |
| `D:\Lab\Git\HypRM-Founder-Command` | `server/hyprm/api.py`, command store, `app/src/features/founder/contracts/` | Idempotent Founder Command context-card and decision projection | CRM source-of-truth or public intake storage |
| `D:\Lab\Git\Frameworks` | `server/api.py` and a new isolated structured-intake module | Durable CHR0N submission snapshot/provenance after approval | Treating an intake request as completed work or memory |
| `D:\Lab\Git\Mnem.OS` | proposal/review routes and continuity services | Candidate-only continuity or memory proposal after approval | Automatic durable memory promotion from public input |
| `D:\Lab\Git\Hyperion-Connect` | `relay/service_fabric.py`, `relay/connect_outbox.py`, transport/status modules | Cloud-to-local pull, signed transport, delivery receipts, replay and reconciliation | Owning CRM/order/ticket/memory records |
| `D:\Lab\Git\Hyperion-Nest` | new `src/builder/intakeCompilerApi.ts` plus explicit server route | Schema-constrained proposal compiler with no tools, writes, or execution | Reusing the current write/execute-enabled builder as a public endpoint |
| `D:\Lab\Git\Arg.OS` | authenticated authority ticket API and a narrow intake adapter | Operator-approved Support ticket creation and status projection | Anonymous public ticket mutation |

## Record authority

| Record | Authority | Public Intake OS copy |
| --- | --- | --- |
| Submission and consent receipt | Public intake D1 store | Authoritative for original captured payload and consent evidence |
| Delivery attempts and idempotency keys | Public intake outbox until acknowledged; receiving domain thereafter | Append-only delivery and reconciliation state |
| Client, relationship, CRM intake | HypRM CRM | Projection ID and status only |
| Quote, job, payment, deliverable, operational ticket | HypRM operations spine | Intent/projection ID and status only |
| Founder decision/context card | Founder Command | Projection ID and status only |
| CHR0N evidence snapshot | CHR0N.OS | Artifact/job ID and status only |
| Memory candidate | Mnem.OS review boundary | Proposal ID and review status only |
| Support ticket | Arg.OS when that adapter is selected | Ticket ID and status only |
| Transport receipt | Hyperion Connect | Correlation and delivery receipt only |
| Shopify draft order | Shopify plus HypRM external reference | Provider ID, lifecycle state, and reconciliation record only |

## Mutation sequence

`browser -> intake Worker -> D1 submission + outbox -> operator review -> Connect pull/reconcile -> domain-specific idempotent adapters`

Each arrow is independently observable and retryable. A failure after capture must not erase the receipt or retry already-successful projections.
