# Victor Amani Live Card Update

## Scope

Refresh the public `/dxcard` experience from the supplied Victor Amani Operator Card export while preserving the production route's SEO, PWA, verified outbound links, QR, vCard, editor, and feedback behavior.

## Input reconciliation

- `Business Card. Dx. (1).zip` SHA-256: `2F58742D4C883F61D38166C0329E9E544403F80783DA7B5769971718B15D1C01`
- `Operator Card - Victor Amani.html` SHA-256: `6C39F89E4B4B811BE91541ABD45B859EFBC161586FDB77A6CA5B1DC6819C3759`
- `ezgif.com-effects.gif` SHA-256: `C422F32097B43699D752094FBDDDBD8046B73BEC3DAD819A388ED21869841A6C`
- The standalone HTML inside the archive matches the separately supplied HTML byte-for-byte.
- The archive contains one Victor portrait-state image and a Victor profile. The same archive also contains a Keshawn profile; that profile is intentionally outside this update.

## Implemented

- Published the supplied Victor `FOCUS` animation as the live card portrait source.
- Reset the inherited portrait crop to a centered `x: 0, y: 0` frame after live review showed the previous vertical offset clipping the animation.
- Re-encoded the 30.3 MB / 223-frame GIF as a 1.7 MB / 112-frame animated WebP for the public route while preserving the full 9.29-second loop. The original download remains untouched.
- Optimized public animation SHA-256: `A72DAE03F326E48BF04B197A0E9F4DF3739B88B3D77958F726D56B7BFBC40179`.
- Updated Victor's direct channel to the address in the supplied profile.
- Restored the supplied desktop registry/HUD marks around the production card, with the release revision advanced to July 2026.
- Kept the canonical public website and operational module links already used by the live production card. The alternate web domain in the supplied export currently serves a different surface, so it was not substituted for the canonical site URL.

## Verification gates

- `npm ci`
- `npm run build`
- `npm run seo:verify`
- Desktop and mobile Playwright smoke for `/dxcard`
- Activation, back-face flip, portrait crop, direct-channel link, save-contact control, console errors, and horizontal overflow
- Live deployment workflow and destination-side asset/config verification

## Maturity and boundary

Operator Identity / NFC remains **shipping**. This change updates the public operator card only; it does not alter NFC hardware provisioning or card fulfillment.
