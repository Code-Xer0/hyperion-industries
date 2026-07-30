# Card Studio expansion handoff

Date: 2026-07-28
Branch: `codex/card-studio-expansion`
Maturity: release candidate pending production deployment

## Shipped scope

- `/card-studio` is the public library for 20 templates, 12 labeled demonstrations, and a device-local shelf capped at 24 drafts.
- `/card-studio/design` resumes the latest draft; `/card-studio/design/:starterId` accepts only catalog template and example IDs.
- Basic mode retains the bounded field editor. Advanced mode adds front/back artboards, 48 bundled artifacts, normalized layer geometry, move/resize, align/order/lock/visibility, reset, undo/redo, keyboard nudging, and native pointer handling.
- Local draft migration writes `card-studio-draft/2` before retaining the legacy draft record.
- The desktop and mobile headers expose Forge inquiry directly. Catalog links pass only an allowlisted lane and anonymous source posture to the configurator.
- The City Gate Signal now leads with Hyperion's company-level systems, custody, and serviceability posture; personal founder detail remains in the Operators and founder routes.
- Built-in artifact references are shared with the Worker allowlist. Unknown references fail preflight; non-built-in artwork remains project-bound and scanner-gated.

## Authority boundaries

- Browsing, examples, and local drafting are public.
- Staging still requires an invitation and creates an immutable `HELD FOR REVIEW` proposal.
- The public surface does not create checkout, charge a card, publish production art, upload files, promote CRM records, or mutate Founder Command.
- Existing `card-design-document/1`, `card-order-intent/1`, and `card-design-proposal/1` contracts remain the operator handoff.
- The Claude Design specimen matrix exists only behind `import.meta.env.DEV`; the production build does not contain its route or copy.

## Verification

- Root `npm run check`: lint, 17 Card Studio tests, production build, compiled-only, SEO, edge routing, Worker 84-test suite, and public MCP 7-test suite.
- Browser QA at 390, 768, and 1440 px: no horizontal overflow, named controls, legible company-level Signal framing, one-click Forge inquiry, gallery/deep-link flow, local draft recovery, modal focus containment/Escape/return focus, keyboard and pointer geometry, and front/back/digital proofs for all 20 templates.
- Production bundle inspection confirms the development specimen route is absent.

## Operator follow-up

After Pages and Worker deployment, smoke:

1. `/card-studio`
2. `/card-studio/design/axis`
3. `/forge/catalog`
4. `/forge/configurator?lane=creator&source=catalog`
5. `/intake/forge`
6. Worker status and a schema-only Card Studio validation request; do not create a real client proposal for smoke testing.
