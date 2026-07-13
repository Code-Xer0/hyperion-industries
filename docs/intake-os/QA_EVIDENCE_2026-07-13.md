# Hyperion Site Intake OS v1 — QA Evidence Index

Date: 2026-07-13

## Automated gates

| Gate | Result |
| --- | --- |
| `npm run check` in `workers/operator` | PASS — corpus current, TypeScript clean, 7 files / 54 tests |
| `npm run lint` | PASS — 0 errors, 9 pre-existing warnings |
| `npm run substrate:audit` | PASS — 11 contract routes, 9 systems, 7 intake models |
| `node scripts/verify-order-apis.mjs` | PASS |
| `npm run build` | PASS |
| `git diff --check` | Required immediately before commit |

## Worker coverage

The suite covers all seven valid lane fixtures, invalid lane/answer fixtures, schema rejection, Forge `FX`, Pandora `PX`, Support security routing, automated-classification opt-out, D1 batch rollback, duplicate idempotency, immutable collision quarantine, partial Resend failure, retention purge, strict origin checks, IDOR rejection, and PII-log redaction.

Magic-link coverage includes mocked Resend, provider idempotency, rate limiting, token hashing, 15-minute expiry, single use, replay rejection, Secure/HttpOnly/SameSite cookie posture, cross-device resume, optimistic-save conflict, and draft deletion.

Custody coverage includes per-record acknowledgments, conflict truth rejection, proposal provenance, strict review PATCH shape, single-flight lease shape, approval-receipt binding shape, constant-time service authentication, and previous-token overlap expiry.

## Browser evidence

Approved evidence assets are kept outside the public repository and placed only in the source-opaque release-evidence packet:

- `forge-receipt-1280.png`
- `pandora-390.png`

The browser matrix completed Forge, Pandora, Continuity, Operator Identity, Support, Relationships, and General paths. Viewports included 1280×720, 390×844, and 320 CSS px. Keyboard-only completion, focused error summary, reduced/static motion, 200%-equivalent reflow, local recovery through offline/reconnect, and no horizontal overflow passed.

## Local acceptance evidence

- `GET /api/intake/status` returned JSON with contract `1.0.1`, deterministic rules, seven lanes, and truthful configuration readiness.
- Forge evaluation returned evidence-linked `F1`.
- The synthetic submission returned `received for operator review`.
- Idempotent replay returned the original receipt.
- Local D1 counts: one submission, one routing decision, one audit event, and one held outbox record.

## Not yet accepted live

Cloudflare account authorization, production D1 migration, Resend sender/secret verification, live magic-link delivery, live public submission, public GitHub Pages commit/hash verification, and production console checks remain blocked pending approved credentials and deployment access. These are not reported as passing.
