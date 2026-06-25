# Hyperion Card Studio Product Room

The live `/card-studio` path serves the final static Card Studio product room. The standalone editor artifact remains available at `public/assets/card-studio/studio.html`, copied from the Business Card DX final source:

`C:\Users\Inf3r\Git\business-card-dx\Business Card. Dx. (Final)`

The final artifact includes the room pages, shared catalog, standalone studio, template components, physical card preview, image-slot behavior, and order wizard.

The shipped default state is the Ivory card template with the gold accent:

- `accent`: `#cba35a`
- `heroTemplate`: `ivory`

The route is intentionally direct: `/card-studio` redirects into `public/assets/card-studio/Hyperion Card Studio.html`, while `/card-studio/studio.html` preserves the non-conflicting standalone editor path.

Ordering posture:

- Digital portrait card is primary.
- Physical NFC card preview is secondary fulfillment.
- Live catalog pricing: Digital `$0`, PVC from `$39`, Metal from `$89`, Pro `$9/mo` or `$90/yr`, Team custom.
- Final pricing authority lives in `public/assets/card-studio/catalog.jsx`.

Future native port work should extract these parts from the standalone bundle:

- the Studio app shell and card canvas components
- the Scen.OS glass/HUD token set
- the tweak/state controls and persistence model
- the export/download/media handling
- any self-contained font/resource assets currently embedded in the bundle
