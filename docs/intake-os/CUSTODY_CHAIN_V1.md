# Hyperion Site Intake OS v1 — Governed Custody Chain

## Release boundary

The public Worker owns immutable intake receipt evidence. Founder Command is the intended owner of local delivery, review, synchronization, and automation state. Domain systems own only records promoted after explicit operator approval. Nest may later analyze minimized projections, but it receives no execution or write authority.

**Implemented in this release:** immutable D1 submissions, revision hashes, supersession links, deterministic proposal provenance, per-submission held outbox records, same-ID/different-hash quarantine, metadata-only audit evidence, and truthful public receipts.

**Contracted but not activated in this release:** Founder Command delivery APIs, acknowledgment writes, review PATCH, approval receipts, domain promotion, reconciliation, Nest analysis, and service credentials. No public or local interface may claim these are live until the downstream owner implements and tests them.

The custody sequence is:

`Receive → persist → acknowledge delivery → normalize → triage → notify → enrich → review → preview → authorize → promote → reconcile`

Every transition requires its own durable receipt. Classification, task creation, notification, or proposal generation is never equivalent to successful processing or promotion.

## Immutable public receipt and collision handling

The Worker computes a canonical SHA-256 revision hash after server-side normalization. It commits the submission, deterministic proposal, receipt, outbox record, and audit event atomically before returning success.

- An existing idempotency key returns the original receipt.
- The same submission ID with the same revision hash returns the original receipt.
- The same submission ID with a different revision hash is durably written to `intake_revision_conflicts` and returned as `revision_collision_quarantined`.
- A correction creates a new immutable submission linked by `supersedes_submission_id`; it never rewrites the previous revision.
- Stale proposals may expire, but receipt, supersession, and conflict evidence follow the approved retention basis.

## Individual outbox acknowledgments

Founder Command must acknowledge records individually. A page-level cursor update is not evidence that every page member was accepted.

Each acknowledgment is bound to:

- `outbox_id`
- `revision_hash`
- `local_receipt_id`
- outcome: `received`, `duplicate`, `conflict_quarantined`, or `rejected`
- acknowledgment timestamp

A quarantined conflict may be acknowledged as durably received while `accepted_business_truth` remains `false`. Cursor advancement is allowed only after every record before the cursor has a durable local receipt or an explicit quarantine receipt.

## Single-flight synchronization

Founder Command must use one durable synchronization lease shared by startup, five-minute polling, manual sync, wake-from-sleep, and network-restoration triggers.

- Only the current lease owner may advance the cursor.
- Each run is bounded by a record limit and lease expiry.
- Wake and network restoration trigger an immediate bounded sync.
- Lease expiry permits safe recovery after a crash; it does not erase per-record receipts.
- Cursor position is committed only after individual acknowledgments are durable.

## Proposal provenance and staleness

Every proposal stores:

- input revision hash
- deterministic policy version
- analyzer kind, ID, and version
- minimized-projection hash
- proposal creation timestamp and state

For v1, the analyzer is the deterministic Hyperion intake router. Nest remains disabled. A proposal becomes `stale` before approval if the input revision, policy, analyzer version, minimized projection, or target-domain preview changes. Stale or expired proposals cannot issue approval receipts.

## Operator approval receipt

An apply operation must not treat `X-HypRM-Confirm: true` as proof of authority. The preview step must issue a short-lived, one-time approval receipt bound to the canonical hash of:

`intake_id + revision_hash + proposal_id + target_domain + proposed_changes`

The apply operation must present that receipt, compare its binding in constant time, confirm it is unexpired and unused, and consume it atomically with the promotion attempt. Replay, stale-revision, changed-preview, changed-domain, or changed-policy attempts fail closed and create metadata-only audit evidence.

## Review PATCH whitelist

`PATCH /api/intake/{intake_id}` is reserved for the downstream Founder Command adapter and may update only:

- owner
- due date
- custody note
- review state
- tags

Unknown fields are rejected. Source answers, identity, routing evidence, receipts, revision hashes, proposal provenance, outbox evidence, and supersession links are immutable through this interface.

## Rotatable service credentials

The downstream service-token record begins with `key_id`, current token hash, previous token hash, and a bounded overlap deadline. Raw tokens never enter source, logs, Drive artifacts, audit events, or prompts.

- Compare presented-token hashes in constant time.
- Accept the previous hash only inside the explicit rotation overlap.
- Log the non-secret key version and result, never the token, token hash, identity, or submission payload.
- Expire the previous hash automatically after overlap.

The machine-readable rules are in `shared/intake/contracts/schemas/custody-control.schema.json` and are covered by the Worker contract tests.
