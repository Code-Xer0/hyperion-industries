# Hyperion Card Studio native public preview

`/card-studio` is the compiled React Card Studio surface. It provides a bounded design-document editor, eight guarded templates, front/back/digital proofs, deterministic preflight feedback, local draft recovery, and a future Worker submission adapter.

Public posture:

- `PUBLIC PREVIEW · ORDERING NOT LIVE`
- every staged brief is `HELD FOR REVIEW`
- every proof is `NOT A QUOTE`
- no browser action publishes a profile, programs NFC, creates checkout, takes payment, or confirms fulfillment

The adapter posts `card-studio-order/1` to `VITE_CARD_STUDIO_API_PATH` or `/api/card-studio/intents`. Until the Worker lane exists, a failed request leaves the local draft intact and reports that the review lane is staged.

The previous browser-global runtime remains available only at `/card-studio/legacy` for temporary parity review. It is noindex, explicitly non-operational, and should be removed after native visual parity is accepted.

Focused model tests live beside the model and run with:

`node --test src/features/card-studio/cardStudioModel.test.js`
