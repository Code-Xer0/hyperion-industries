# Connected Client Experience and Operator Expansion Flight

Updated: 2026-10-20

This ledger tracks the recovered flight in the current repository checkout and distinguishes its pushed branch from the public production site. The implementation snapshot described here was pushed as `72c3cbace2133e2c73d44d07d5f5b3421b2acfac` on `codex/intake-lead-visibility`; subsequent commits on that branch update these handoff documents. No production deployment, service activation, payment, or release was performed.

## Public site observed on 2026-10-20

The public site was opened directly at [hyperion-industries.dev](https://hyperion-industries.dev/) and its live City Gate, Store, Forge, and Account routes were inspected in the browser. This is the production experience at observation time; a pushed source branch does not establish that its changes are deployed.

The live response is not just an old browser tab: a fresh request with a unique query string and `Cache-Control: no-cache, no-store` still returned the Continuity Infrastructure document, with `Last-Modified: 2026-09-07 08:11:27 GMT`. GitHub’s latest successful Pages workflow is [run 34099102308](https://github.com/Code-Xer0/hyperion-industries/actions/runs/34099102308), which deployed `main` at `b340bbfd75982a99094c2161f911c3bb3fb9b2d0` on 2026-09-07. The workflow in `.github/workflows/deploy.yml` deploys on pushes to `main` (or manual dispatch). At the compared revision `c770f5af45693f05f3f1af174c6c526f1ce741bb`, `codex/intake-lead-visibility` diverged from the deployed `main` (four commits ahead and three behind), and the flight changes were not incorporated into the production deployment. This confirms a deployment gap, not a local-browser cache issue.

The attached F: volume is labeled `Overflow`. The expected `F:\HyperionWorktrees\connected-client-experience` directory is absent, and Git reports its old Founder Command worktree registration as prunable. The site repository found on F: is `F:\Lab\Git\HI React fork\hyperion-industries`, on local `main` at `aa40fac5d1d9c5f3d9d60c1001d056d48ee3f742` (2026-05-20); that checkout’s `origin/main` tracking ref is stale relative to the live remote `main` at `b340bbf`. It contains three build videos under `public/assets/builds`, while a source search found no route playback references for those clips in that checkout. The pushed feature branch is in `C:\HYPERION\02_REPOS\HI React fork\hyperion-industries`.

- **City Gate (`/`)** is live with five selectable stations (Signal, Method, City, Proof, Inquiry), the City Gate title, and the current Signal panel headed “Build the machine. Keep the advantage.” The panel describes custom computers, identity, and continuity systems and links to Start a Project, Configure a Forge Build, and See the Work. A cinematic background/poster is visible, but its control reads “Play film,” so motion is user-started on entry. The footer still leads with “Continuity infrastructure for fragmented operations.”
- **Forge (`/forge`)** is live with a cinematic workstation hero and a guided five-step Forge sequence. Its performance, creator, local-AI, small-footprint, and custom-loop lanes each expose an explicit “Play … cinematic” control. The experience remains assessment-first and directs customers to a reviewed build profile/proposal.
- **Store (`/store`)** is live as “Choose the work. Keep the gate.” It lists Forge Builds, Card Studio, CHR0N.OS, and Live Site Series. The page explicitly says “Sandbox setup · payments not yet active,” requires an approved proposal or proof, and states “No live capture · no one-click order.” The $19 Agent Policy, $29 Flight Pack, and $49 Routing Starter Kit are not visible in the production Store.
- **Account (`/account`)** is live as Private Client Room with a private magic-link entry. Its copy says links expire after 15 minutes and work once, sessions are HttpOnly and last 14 days, and HypRM owns identity and relationship truth. This is the currently deployed HypRM-owned identity/projection design; it does not prove the planned edge-owned account cutover or full My Projects room is complete.
- The live route titles and copy remain continuity/Forge/City-Gate oriented. The Stratified Systems hero and the two new commercial doors in the pushed branch are not reflected in the inspected production home page.

**Deployment status:** The restored City Gate/Forge treatments and Stratified Systems/product-preview changes are present in the pushed feature branch, but are absent from the deployed `main` snapshot. Production has the City Gate and Forge pages with explicit playback controls, the old continuity-led footer, and a four-lane proposal-first Store with payments inactive. The new homepage language and three-product storefront remain branch-only. The public site was inspected read-only; no deployment or payment action was taken.

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
- The current feature branch has already been pushed as an incomplete handoff. After all release acceptance passes, prepare the concrete deployment and commercial terms and present the separately required production activation authorization before deploying or activating live commerce. The branch push is not a production release.

Founder Command check, packaged-resource, and installed-service evidence is tracked separately in `C:\HYPERION\02_REPOS\HypRM-Founder-Command\docs\handoff\2026-10-20_FOUNDER_COMMAND_FLIGHT_EVIDENCE.md`.
