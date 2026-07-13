# Hyperion Card Studio Source-Port Scaffold

The live `/card-studio` path serves the Business Card DX landing bundle directly on the static host. The fallback standalone asset is mirrored at `public/assets/card-studio/studio.html`, copied from the Business Card DX template:

`<workspace>\hyperion-studio\Business Card. Dx. (Template)\Hyperion Card Studio (standalone).html`

The shipped default state is the Ivory card template with the gold accent:

- `accent`: `#cba35a`
- `heroTemplate`: `ivory`

This is intentionally a hybrid first pass. The standalone bundle remains the shipped tool surface while the React route only redirects during local Vite development. The live GitHub Pages path includes `public/card-studio/index.html` so `/card-studio` resolves as the canonical clean landing URL without SPA fallback or iframe chrome. The compatibility route `/card-studio/studio.html` and matching static redirect file both point to the non-conflicting static asset path.

Future native port work should extract these parts from the standalone bundle:

- the Studio app shell and card canvas components
- the Scen.OS glass/HUD token set
- the tweak/state controls and persistence model
- the export/download/media handling
- any self-contained font/resource assets currently embedded in the bundle
