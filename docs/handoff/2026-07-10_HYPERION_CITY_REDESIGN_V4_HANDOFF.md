# Hyperion City Redesign v4 Handoff

Date: 2026-07-12

Status: interactive City navigation and cinematic transit chamber complete on `codex/Chonoslanding`; public deployment withheld.

## Outcome

The public homepage is now a concise Hyperion City Gate rather than a long product brochure. The supplied brand opener is the full-bleed hero media, the existing `HeroCanvas` remains active, and the Hyperion Operator appears as a simple waving visual with no filler text panel.

The public city is data-driven from `src/data/publicCity.js`. Every district carries a maturity label, public boundary, next action, related routes, SEO metadata, and either audited proof media or a public-safe diagram.

## Interactive City Uplift

- The floating link bar and duplicate hero transit were replaced by one edge-to-edge, route-aware transit spine.
- `Open City` launches a full-screen public route map grouped into Systems, Infrastructure, Identity, Public Record, and Alignment.
- The launcher supports route search, `Ctrl/Cmd+K`, Escape, keyboard result selection, focus trapping, and mobile full-screen navigation.
- Large footer navigation moved into the City launcher utility layer.
- Every public React route is now bounded as an interactive room. Card Studio and DX Card remain independent static surfaces.
- District stations use `#overview`, `#proof`, `#boundary`, and `#next`; hashes remain shareable and preserve browser history without adding sitemap routes.
- Gate stations are `#signal`, `#city`, `#proof`, and `#doctrine`.
- Systems, Archive, Gallery, Diary, Contact, Newsletter, Store, Founders, and the full founder profile use route-specific stations rather than stacked public sections.
- Desktop document height is viewport-bounded; dense collections scroll only inside their active panel. Mobile uses a bottom station dock.
- Founder telemetry is opt-in through `VITE_TELEMETRY_ENDPOINT`; static GitHub Pages preview makes no telemetry request by default.

## Cinematic Transit Chamber

- `Enter City` now opens a bounded transit chamber instead of a five-column route directory.
- Five color-coded district lines select one route family at a time: Systems, Infrastructure, Identity, Public Record, and Alignment.
- The selected family opens into a route list and cinematic destination preview; hover, focus, and keyboard selection all update the acquired destination state.
- The chamber carries current-location context, searchable routing, explicit exit controls, and existing `Ctrl/Cmd+K` and Escape behavior.
- The desktop chamber remains viewport-bounded. Mobile converts district lines into a horizontal transit strip and keeps destination content within the remaining viewport.
- `World Engine` is available as an operator-controlled score. It never autoplays, starts paused at time zero, and is stopped whenever the chamber closes or a route is selected.
- Reduced-motion users receive the static Hyperion signal image instead of the looping brand film, with route-image transforms disabled.

## Routes Added

- `/chronos`
- `/pandora`
- `/talos`
- `/identity`
- `/mnemos`
- `/software-estate`
- `/succession`
- `/pandora-lite`
- `/architecture`
- `/alignment`

Existing routes remain available, including `/systems`, `/forge`, `/build-archive`, `/gallery`, `/dev-diary`, `/card-studio`, `/contact`, `/newsletter`, `/store`, `/founders`, and `/dxcard/*`.

`/card-studio` still redirects to `/assets/card-studio/studio.html`. `/dxcard/*` still redirects to `/dxcard/index.html`.

## Public Media Provenance

- Gate film: redesign v4 package `assets/gate-opener.mp4`.
- Hyperion mark: redesign v4 package `assets/hyperion-mark.svg`.
- CHR0N.OS: `CHR0N.OS-Preview/assets/extracted_10.png`; synthetic public-beta demo corpus.
- Mnem.OS: `Mnem.OS/output/playwright/mnem-packaged-retention-1440x900.png`; packaged development smoke.
- Operator Identity: existing Card Studio route smoke from the prior cinematic portal QA lane.
- Operator wave: four public-safe frames from the prior cinematic portal Operator lane.
- Forge: existing public build-archive artifact.
- City transit art: operator-supplied `ChatGPT Image Jul 11, 2026, 07_48_38 PM.png`, exported to `public/assets/city/navigation/city-transit.jpg`.
- Transit fallback signal: operator-supplied `ChatGPT Image Jul 12, 2026, 06_23_05 PM.png`, exported to `public/assets/city/navigation/hyperion-signal.jpg`.
- Transit core mark: operator-supplied `ChatGPT Image Jul 12, 2026, 06_21_38 PM.png`, exported to `public/assets/city/navigation/hyperion-core.jpg` and used as the chamber insignia.
- Optional transit score: operator-supplied `World Engine.mp3`, copied to `public/assets/city/navigation/world-engine.mp3` and wired as opt-in audio only.

All copied assets live under `public/assets/city/`. Captions identify capture posture and source lane.

## Media Withheld

- Hyperion Connect smoke captures show game identities and player names.
- Hyperion Nest captures expose private operator/runtime surfaces.
- Mnem.OS current-state captures containing local paths, bridge names, or internal project state were not used.
- Tal.OS has no comparable public-safe smoke image, so its route remains diagram-led and explicitly in development.
- Pandora remains diagram-led because no documented public rack capture was available.
- `20260711-2308-00.5008242.mp4` shows a private command and telemetry surface and was explicitly withheld from the public asset tree.
- The remaining supplied cover-art films and music tracks were not needed for this transit pass and remain outside the repository.

## Guardrails

- No public checkout, credentials, account numbers, API keys, private paths, or command controls were added.
- No `/access`, `/studio`, `/field`, or `/status` route was added to React navigation or the sitemap.
- Kair remains internal/private in the staged substrate contract and is removed from public route metadata and founder-facing copy.
- CHR0N.OS is labeled `LIVE · STABLE BETA`.
- Forge is labeled `BY INQUIRY · COMMERCIAL LANE`.
- Operator Identity is labeled `SHIPPING`.
- Mnem.OS and Tal.OS are labeled `IN DEVELOPMENT`.
- Pandora is labeled `ENTERPRISE POC · HARDWARE LAYER`.
- Pandora Lite and the wider architecture remain concept/research.

## Verification

- `npm run lint` passes with 10 pre-existing warnings in radio/founder code and no errors.
- `node scripts/verify-order-apis.mjs` passes.
- `npm run substrate:audit` passes.
- `npm run build` passes.
- Final production assets: `index-DzLG6N1J.js` and `index-3pNlZ75e.css`.
- Built preview served at `http://127.0.0.1:4180/` during QA.
- Twenty-five canonical, city, founder, static Card Studio, and DX card URLs returned HTTP 200.
- Browser console reported no warnings or errors on final tested routes; the former unconfigured telemetry 404 was removed.
- Desktop and mobile overflow checks matched `scrollWidth === clientWidth`.
- Desktop QA covered the Gate, City launcher, CHR0N.OS, Gallery, and Build Archive.
- Mobile QA covered the Gate, Systems directory, City launcher, and founder profile with media controls above the station dock.
- CHR0N.OS hash QA confirmed `#proof`, viewport-bounded document height, and panel-only overflow.
- Light and dark Gate states were both inspected.
- Cinematic transit QA covered desktop at 1280 x 720 and mobile at 390 x 844.
- Mobile transit QA confirmed `scrollWidth === clientWidth` and `scrollHeight === clientHeight` while the chamber is open.
- Transit audio QA confirmed the score is paused at `currentTime: 0` on initial open.
- Explicit score activation was browser-tested and plays at the capped `0.28` volume level.
- Search aliases cover natural spellings for CHR0N.OS/Chronos, Mnem.OS/Mnemos, and Tal.OS/Talos.
- Guardrail scans over the production build found no Kair exposure, private local paths, private command-capture strings, forbidden public route links, or securities language.

## Known Gaps

- Dependency install reports three low and one high advisory in the existing lockfile. No automatic dependency rewrite was applied.
- The main bundle remains above the Vite 500 kB warning threshold at approximately 535 kB before gzip.
- Connect, Nest, Tal.OS, and Pandora need deliberately public-safe future captures before they should receive screenshot proof.
- The public contact route remains email/inquiry based; no new backend, form service, payment path, or credential flow was introduced.

## Operator Handoff

No commit, push, merge, or deployment was performed. Pushing the live branch remains an operator-gated publish action because `main` deploys GitHub Pages.

Before publish, review the homepage film frame timing, maturity labels, founder copy, and the three public proof screenshots at both desktop and mobile widths.
