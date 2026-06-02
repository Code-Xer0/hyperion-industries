# Hyperion Card Studio Source-Port Scaffold

The live `/card-studio` route wraps `public/card-studio/studio.html`, copied from:

`C:\Users\Inf3r\Downloads\Hyperion Card Studio (standalone).html`

This is intentionally a hybrid first pass. The standalone bundle remains the shipped tool surface while the React route provides Hyperion site navigation and deployment routing.

Future native port work should extract these parts from the standalone bundle:

- the Studio app shell and card canvas components
- the Scen.OS glass/HUD token set
- the tweak/state controls and persistence model
- the export/download/media handling
- any self-contained font/resource assets currently embedded in the bundle
