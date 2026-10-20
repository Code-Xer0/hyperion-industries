# Connected Client Experience and Operator Expansion Flight

Updated: 2026-10-20

This ledger tracks the recovered flight in the current repository checkout. The original `E:\HyperionWorktrees\connected-client-experience\site` and `founder-command` directories were not present during this pass. No production service activation, payment, deployment, or release was performed.

## Completed in this checkout

- Restored the City Gate and Forge ambient films with poster-first rendering, explicit playback controls, reduced-motion and data-saving behavior, viewport-aware playback, and mutually exclusive video playback. The Forge Proof station retains its separate evidence lane.
- Repaired the City Gate presentation regression: light mode no longer washes the movie out with a pale panel, the cinematic remains legible in either global theme, the duplicate room summary is removed, and the title scale gives the film and both commercial doors space in the opening viewport. The home route now visibly plays the City film with a working pause control; City navigation retains the Forge moving-media shelf.
- Repositioned the homepage and shared doctrine around Stratified Systems, continuity, the two commercial doors, and direct Start, Resume, My Projects, Forge, and Card Studio routes. Added illustrative operating configurations and updated navigation, founder copy, metadata, route shells, public retrieval, MCP content, and legacy card descriptions from the current source data.
- Added three distinct product previews and deterministic package recipes at $19, $29, and $49, free representative samples, versioned configuration and receipt schemas, identity watermarks, a bounded configurator, and explicit sandbox-only commerce posture.
- Made the package compiler validate customer configurations and generated manifests against the checked-in JSON Schemas. `manifest.json` now matches the returned manifest and does not claim to hash itself.
- Strengthened the service assessment intake around objective, current state, existing tools, blocker, success criteria, budget, deadline, and requested strategy or implementation help.
- Hardened Card Studio idempotency against changed-content/cross-project key reuse and required exact proof approval before operator-released checkout.

## Verification evidence

- `npm run check` — passed on 2026-10-20 after the product-copy and watermark-safety edits. Includes lint, site-content consistency, Card Studio (17), configurator (15), doctrine (4), intake attribution (3), production build, public compiled-only check (468 artifacts), SEO verification (43 route shells, 41 sitemap URLs, 17 redirects), site-edge tests (25), Operator Worker (116), and public MCP (7).
- `npm run build` — passed after the City Gate visual fix; generated the production build and compiled public artifacts. Shared CSS is 15.60 KB gzip and initial JavaScript is 101.28 KB gzip.
- Local source preview at `http://127.0.0.1:4193/` showed the City Gate film playing with an accessible pause control, the two commercial doors, continuity statement, and Start, Resume, My Projects, Forge, and Card Studio links in the opening view. The static preview at `4194` was stale until the build completed; it now serves the rebuilt output.
- Playwright production preview at `http://127.0.0.1:4194/`: document width equaled viewport width at 390, 768, and 1440 pixels. At 390 pixels the hero video reached ready state 4 and played. With `prefers-reduced-motion: reduce`, it paused while retaining its poster.
- The Forge route accessibility state exposed the active control as “Pause Forge build film,” confirming runtime playback. Initial JavaScript was 101.28 KB gzip; shared CSS was 15.54 KB gzip.

## Still required before the flight is complete

- Replace the remaining HypRM-owned login/session proxy with edge-owned authentication and additive record migration; implement explicit project grants and complete room endpoints and account UI.
- Finish frozen/recoverable Client Room submissions, publications, exact-revision reviews, offline-safe project requests, private scanned uploads and receipts, and project-room delivery.
- Complete the planned Wave 1 and follow-on connector receipts, then verify Founder Command against the installed service and complete its soak.
- Implement sandbox payment creation and reconciliation, entitlement issuance, sealed private package storage and delivery, account recovery, refund/dispute handling, and the payment race/failure acceptance cases. Current product pages and APIs remain preview-only; checkout is disabled.
- Run the remaining keyboard/mobile flow matrix, real mobile-lab LCP/CLS checks, scanner/outage recovery checks, and installed-service acceptance.
- After all release acceptance passes, present the concrete deployment and commercial terms for the separately required production activation authorization. Only then commit and push the completed flight.

Founder Command check, packaged-resource, and installed-service evidence is tracked separately in `C:\HYPERION\02_REPOS\HypRM-Founder-Command\docs\handoff\2026-10-20_FOUNDER_COMMAND_FLIGHT_EVIDENCE.md`.
