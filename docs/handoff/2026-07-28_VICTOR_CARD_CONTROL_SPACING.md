# Victor Card Control Spacing

## Scope

Normalize the lower module and channel controls on the public `/dxcard` route while preserving the whole-card viewport-fit behavior and the no-scroll contract.

## Implemented

- Added shared control tokens for gap, height, and label tracking.
- Gave all three module buttons identical two-line name and subtitle tracks so wrapped copy does not shift the lower label baseline.
- Removed the Forge-only padding imbalance.
- Changed the four channel controls from 30 px squares pinned to the start of oversized grid tracks into four equal-width, full-track targets.
- Kept the existing card-level viewport transform as the single scaling authority across desktop, phone, and landscape displays.

## Verification

- `npm run build`
- `npm run seo:verify`
- `npm run seo:edge-test`
- Playwright visual check at 390 × 844
- Playwright geometry checks at 320 × 568 and 844 × 390
- At every checked viewport, document width and height equal the viewport width and height; module subtitle baselines match; channel target widths and gaps are equal; console errors are zero.

## Maturity

Operator Identity / NFC remains **shipping**. This is a public card presentation and responsive-control correction only; it does not change NFC provisioning or card fulfillment.
