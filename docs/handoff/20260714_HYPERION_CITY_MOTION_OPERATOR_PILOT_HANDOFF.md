# Hyperion City Motion and Operator Pilot Handoff

## Scope

- Repo: `hyperion-industries-publish` clean motion-pilot worktree.
- Branch: `codex/city-motion-operator-pilot`
- Baseline: latest reviewed `hyperion/main` at branch creation.
- Publish target: `hyperion/main`. The operator authorized live promotion after this run's green gates.
- Dirty intake and Operator Lane checkouts were preserved and not modified.

## Implemented

- Added the versioned `hyperion.city_motion_manifest.v1` contract for Gate and six district masters.
- Added a reusable active-media surface for muted video, image fallback, hidden-tab pause, and truth-class metadata.
- Wired the current Gate film and reviewed Forge footage as interim video. Remaining districts keep existing public stills until their commissioned loops arrive.
- Replaced the unreadable traced header wordmark with a crisp semantic `Hyperion / Industries` lockup beside the existing orbit mark.
- Added an opt-in `Operator Pilot` control to global transit and the City launcher.
- Defaulted the pilot off and persisted explicit choice under `hyperion.operatorPilot.enabled.v1`.
- Deferred the runtime script and HY60-v2 assets until opt-in.
- Added Worker capability probing. Chat renders only when both the build flag and public capability report `ready`.
- Replaced the resident's duplicate inquiry form with `Guided Mode · Experimental`, curated routes, and route-aware Intake OS handoff.
- Kept roaming behind `VITE_OPERATOR_ROAM_ENABLED=false`; route anchors remain deterministic and mobile stays docked.
- Added runtime timeout fallback, hidden-tab suspension, low-frame-rate suspension, and opt-out cleanup.

## Environment Controls

- `VITE_OPERATOR_PILOT_AVAILABLE=true`
- `VITE_OPERATOR_PILOT_DEFAULT=false`
- `VITE_OPERATOR_CHAT_ENABLED=false`
- `VITE_OPERATOR_ROAM_ENABLED=false`
- `VITE_OPERATOR_API_BASE=/api/operator`

## Media Boundaries

- Generated loops use `truthClass: atmosphere`.
- Reviewed software recordings use `truthClass: product_capture`.
- Generated media never functions as evidence that a system ships or performs a capability.
- The HY60-v2 resident pack remains the stable runtime. Dirty HY120 work was not copied or staged.
- Flow/Omni briefs and recording review rules are in `docs/city-motion-commission.md`.

## Verification

- `npm run lint` passed with zero errors and ten pre-existing `RadioContext.jsx` hook warnings.
- `node scripts/verify-order-apis.mjs` passed: `order API posture checks passed`.
- `npm run substrate:audit` passed: 11 contract routes, 9 systems, and 7 intake models.
- `npm run seo:verify` passed: 34 route shells, 33 sitemap URLs, and 16 redirects.
- `npm run seo:edge-test` passed all five routing tests.
- `npm --prefix workers/operator run check` passed corpus validation, TypeScript, and all 58 Worker tests.
- `npm run build` passed with Vite 8.0.11.
- `git diff --check` passed.
- The City manifest audit confirmed seven complete preview contracts and their truth classes.
- Public build scans found no internal-tool promotion, private Windows paths, unsafe platform references, fake deployment claims, or securities language.
- Forbidden `/access`, `/studio`, `/field`, and `/status` routes remain absent from the generated sitemap.
- Twenty-five public City, founder, intake, Card Studio, and DX Card smoke URLs returned HTTP 200.
- Every current manifest asset plus the HY60 runtime and manifest returned HTTP 200.
- The Intake OS browser flow completed against a disposable local Worker and migrated local D1 database: lane selection, contact consent, required answers, server-verified routing, client review, dispatch, and receipt all passed.
- Receipt `AE775599420F` resolved to revision 1 with an active `MANUAL` proposal, `general` route, `submission_received` audit event, and `held_for_review` outbox state. No production intake record was created by the test.

## Browser Evidence

- Preview: `http://127.0.0.1:4182/`
- Desktop Gate and repaired wordmark: `.playwright-cli/page-2026-07-14T12-56-55-149Z.png`
- Desktop City launcher: `.playwright-cli/page-2026-07-14T13-11-44-500Z.png`
- Mobile Gate, light theme: `.playwright-cli/page-2026-07-14T14-08-45-425Z.png`
- Mobile City launcher: `.playwright-cli/page-2026-07-14T14-15-30-518Z.png`
- Mobile Gate, dark theme: `.playwright-cli/page-2026-07-14T14-25-10-888Z.png`
- Mobile document width matched the 390 px viewport with no horizontal overflow.
- All six district selectors rendered their correct active preview and truth class.
- Infrastructure mounted exactly one launcher video and exactly one playing video.
- Before opt-in, no Operator runtime script, custom element, or Worker request existed.
- After opt-in, the HY60 custom element mounted and the static preview's unavailable API rendered truthful guided mode without a prompt.
- From `/forge`, `Open matching intake` resolved to `/intake/forge`.
- Opt-out persisted `false` and removed the resident surface.
- The browser-to-Worker intake test returned `Received for operator review.` and reference `AE775599420F` through `http://127.0.0.1:4183/intake/general`.

## Known Gaps

- The six commissioned Flow loops and revised Gate loop do not exist yet. Existing stills, Gate film, and reviewed Forge capture remain interim.
- The static Vite preview cannot serve the API-capable Worker route, so Operator Pilot intentionally exercised `guided mode · worker offline`. Intake persistence was verified separately through Vite's local Worker proxy. Production chat remains blocked by `VITE_OPERATOR_CHAT_ENABLED=false` until capability and deployment review approve it.
- Real software recordings have not yet been ingested. They must pass the review lane in `docs/city-motion-commission.md` before they can replace room atmosphere.
- Runtime error fallback is static by design. Random roaming remains disabled by default.
- The dirty HY120 Operator Lane was not copied, edited, or staged.
