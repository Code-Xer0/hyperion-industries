# Hyperion Card Studio native public preview

`/card-studio` is the compiled React Card Studio surface. It provides a bounded design-document editor, eight guarded templates, front/back/digital proofs, deterministic preflight feedback, local draft recovery, and an invite-gated Worker submission adapter.

Public posture:

- `INVITE-ONLY PREVIEW`
- every staged brief is `HELD FOR REVIEW`
- every proof is `NOT A QUOTE`
- eligible fixed-SKU briefs can be marked checkout-eligible, but only a revision-bound operator action can release checkout
- no browser action publishes a profile, programs NFC, creates checkout, takes payment, or confirms fulfillment

The adapter uses the durable `/api/card-studio` project → immutable revision → proposal sequence. It compiles the native editor state into `card-design-document/1` and `card-order-intent/1`, supplies an idempotency key, and preserves the local draft when any network stage fails.

The previous browser-global runtime has been removed from the public copy tree. Legacy static entrypoints redirect to `/card-studio`, so production publishes only compiled application assets for this feature.

Focused model, contract adapter, and public-boundary tests live beside the model and run with:

`npm run card-studio:check`
