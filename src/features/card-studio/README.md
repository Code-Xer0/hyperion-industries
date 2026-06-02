# Hyperion Card Studio Source-Port Scaffold

The live `/card-studio` route wraps `public/assets/card-studio/studio.html`, copied from the Business Card DX template:

`C:\Users\Inf3r\Git\hyperion-studio\Business Card. Dx. (Template)\Hyperion Card Studio (standalone).html`

The shipped default state is the Ivory card template with the gold accent:

- `accent`: `#cba35a`
- `heroTemplate`: `ivory`

This is intentionally a hybrid first pass. The standalone bundle remains the shipped tool surface while the React route provides Hyperion site navigation and deployment routing. The live GitHub Pages path also includes `public/card-studio/index.html` so `/card-studio` resolves on a static host without SPA fallback. The compatibility route `/card-studio/studio.html` and matching static redirect file both point to the non-conflicting static asset path.

Future native port work should extract these parts from the standalone bundle:

- the Studio app shell and card canvas components
- the Scen.OS glass/HUD token set
- the tweak/state controls and persistence model
- the export/download/media handling
- any self-contained font/resource assets currently embedded in the bundle
