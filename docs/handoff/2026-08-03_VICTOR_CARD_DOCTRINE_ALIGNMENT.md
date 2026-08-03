# Victor Card Doctrine Alignment

## Scope

Align the public `/dxcard` operator card with the current Context Hub doctrine while preserving the established identity, contact paths, product maturity boundaries, and whole-card no-scroll behavior.

## Public translation

- Lead with Hyperion's external frame: continuity infrastructure for fragmented operations.
- Replace generic AI positioning with the current continuity spine: state, provenance, context, and operator control.
- Express the internal operating invariant as six public-safe principles: capture state, preserve provenance, expose context, keep authority explicit, route action, and learn from reality.
- Preserve the stable doctrine title, `Build systems that survive contact with reality.`
- Reframe engagement around continuity assessments, systems architecture, local-first deployments, shipping operator identity systems, and workflow continuity design.
- Keep the product registry truthful: Hyperion consulting, CHR0N.OS beta continuity, and Forge by inquiry.

## Doctrine reviewed

- `15_HYPERION_GOVERNED_ECOSYSTEM.md`
- `16_CONTEXT_ARBITRATION_DOCTRINE.md`
- `18_PLUGIN_AUTHORITY_CONTRACT.md`
- `19_EXTERNAL_POSITIONING_AND_PITCH_BOUNDARIES.md`
- `22_RETRIEVAL_TRUTH_POSTURE.md`

## Boundaries

- No private Context Hub text or client/internal system names were published.
- No claims of unrestricted automation, unrestricted integration, or self-service Forge availability were introduced.
- Operator Identity / NFC remains **SHIPPING**; CHR0N.OS remains **BETA**; Forge remains **BY INQUIRY**.
- The existing portrait, identity, vCard, contact channels, external links, card geometry, and responsive scaling implementation are unchanged.
- The compiled operator-card runtime now receives a content-derived query version so returning visitors cannot combine fresh doctrine config with stale rendering logic.

## Verification

- `npm run build` — passed; the public card runtime was compiled and private legacy artifacts were removed.
- `npm run public:compiled-check` — passed across 449 public artifacts.
- `npm run seo:verify` — passed across 40 route shells, 38 sitemap URLs, and 17 redirects.
- `npm run seo:edge-test` — 25 of 25 tests passed.
- Playwright checks passed at 320 × 568, 390 × 844, and 844 × 390.
- Document width and height matched each viewport; front and back internal scroll heights matched their containers; the scan block remained inside the back face; module and channel gaps stayed uniform; browser errors were zero.
- Visual evidence: `output/playwright/doctrine-front-390x844-settled.png`, `output/playwright/doctrine-back-390x844.png`, and `output/playwright/doctrine-back-320x568.png` (local QA artifacts, not committed).
- Live deployment verification remains required after publish.

## Operational note

`npm ci` reported the repository's current audit baseline of four dependency findings (one low and three high). No unrelated blanket dependency rewrite was included in this card release.

## Source ownership

- Runtime copy: `public/assets/card/card.config.json`
- Offline fallback: `public/assets/card/app.jsx`
- Card metadata: `public/dxcard/index.html`, `public/dxcard/manifest.webmanifest`, and `src/data/seoRoutes.js`
- Compiled runtime versioning: `scripts/compile-legacy-public.mjs`
- Cache-boundary regression check: `scripts/verify-public-artifacts.mjs`
