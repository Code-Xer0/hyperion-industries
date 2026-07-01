# Hyperion Portal Backend/Substrate Contract

Updated: 2026-06-25

This pass preserves a staged backend/data contract for future portal work while the React frontend stays rolled back to the current live route posture. It is not a visual redesign and it is not a public deployment approval.

## Stack And Deployment Boundary

- Frontend posture: live-style React routes remain in place until Claude Design ports the UI.
- Public deployment risk: pushes to `main` deploy GitHub Pages through `.github/workflows/deploy.yml`; public deployment is withheld without operator approval.
- Live hosting posture: `hyperion-industries.dev` is behind Cloudflare while GitHub Pages serves the static build.
- API posture: `api/` contains Vercel-style serverless functions, but the live GitHub Pages surface did not serve JSON for `/api/*` on 2026-06-25. Treat `api/public-intake.js` and `api/public-status.js` as staged contracts unless an API-capable deployment is approved.

## Public Contracts

Canonical registry:

- `src/data/portal.json`
- `src/server/public-intake-utils.js`
- `api/public-intake.js`
- `api/public-status.js`

The contract describes:

- portal zones: Gateway, Systems, Studio, Field, Doctrine, Access, Status
- rooms: Card Studio and Build Archive
- systems: CHR0N.OS, Mnem.OS, Hyperion Nest, Hyperion Connect, ARG.OS, SCEN.OS, HORUS/Decksmith, KAIR.OS, Future Systems
- access lanes: Contact / Intake and CHR0N.OS Public Beta
- intake model contracts
- public status records
- future route metadata and Open Graph metadata
- future legacy redirect intentions
- safety rules for public/private boundaries

Status vocabulary is intentionally limited to:

`planned`, `in_development`, `preview`, `public_beta`, `restricted`, `private`, `local_only`, `manual_update_required`, `unavailable`, `degraded`

Any stronger public claim needs a truth source and last checked date.

## Live Frontend Routes

- `/`
- `/systems`
- `/forge`
- `/build-archive`
- `/founders`
- `/founders/:slug`
- `/gallery`
- `/card-studio`
- `/contact`
- `/dev-diary`
- `/newsletter`
- `/store`
- `/dxcard/*`

The current frontend does not expose `/studio`, `/access`, `/field`, or `/status` through nav, sitemap, or React route config. Those paths may exist in `portal.json` only as staged contract metadata for future porting.

Current live Card Studio posture remains `/card-studio -> /assets/card-studio/studio.html`.

## CHR0N.OS Public Beta Record

The staged CHR0N public beta lane uses a static public release record:

- Version: `v0.2.2-beta.1`
- Release URL: `https://github.com/Code-Xer0/CHR0N.OS-Preview/releases/tag/v0.2.2-beta.1`
- Installer SHA256: `ae650a6ae8e8d6bc6aaecd2c5fc70a8396fa839477fe87a5b3cbdafdc2342e79`
- Portable ZIP SHA256: `dc5bfe56a6ccab7fcad07a81805bca97c213a6331f84bc0a4d48da6bc6e32864`
- MSI SHA256: `685267e2fc7d4700c28ccc8ba0f43b4fd3b4378f0812066870467e32875ae535`
- Known issues posture: `manual_update_required`

Private CHR0N console functions, internal build infrastructure, governed memory commits, and sensitive logs stay outside the public portal.

## Card Studio Record

The staged Card Studio contract models:

Studio -> Card Studio -> Identity Fabrication / Smart Business Card Lane

Current pricing source alignment:

- Digital card: `$0`
- PVC matte: `$39`
- PVC gloss: `$39`
- PVC soft-touch: `$49`
- Metal brushed: `$89`
- Metal matte black: `$99`
- Metal polished black: `$109`
- Metal gold accent: `$129`
- Pro: `$9/mo` or `$90/yr`
- Team: custom

Public checkout remains disabled. Payment and fulfillment stay operator-reviewed through draft invoices. The current live frontend still sends `/card-studio` to the standalone studio asset until Claude Design ports the UI.

## Verification

Run:

```bash
npm run lint
node scripts/verify-order-apis.mjs
npm run substrate:audit
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

Smoke these routes locally:

- `/`
- `/systems`
- `/forge`
- `/build-archive`
- `/gallery`
- `/card-studio`
- `/contact`
- `/newsletter`
- `/store`
- `/dxcard/`

Confirm `/studio/card-studio`, `/access`, `/field`, and `/status` are not linked from the live-style frontend.

## Design Team Handoff

Use `src/data/portal.json` as the staged data contract. Claude Design can treat the future portal as rooms, lanes, access points, and status records, but should port deliberately from the live route posture rather than assuming these contract routes are already public UI.

Do not add public UI for:

- operator consoles
- private memory
- agent deployment controls
- secrets or vaults
- client telemetry
- remote command surfaces
- governed memory commits
- internal build infrastructure
- sensitive logs
- private orchestration channels
