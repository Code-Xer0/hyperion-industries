# Hyperion City Motion Commission

## Delivery Contract

Create one master loop for the Gate and each of the six public districts. Omni supplies a clean 1920 x 1080 keyframe and matching poster. Flow turns the approved keyframe into an 8-second seamless 16:9 loop at 24 or 30 fps.

- Slow, continuous camera movement with no cuts or abrupt speed changes.
- No audio, readable text, invented software UI, unapproved people, or visible platform watermark.
- Preserve a clean lower-left area for route copy.
- Deliver H.264 MP4 at approximately 3-5 MB plus a matching WebP poster.
- Generated district media is atmosphere, never product proof.

## Commission Briefs

### City Gate

**Omni keyframe:** A black-and-gold transit aperture opening onto a sovereign near-future city, restrained cyan guidance signals, deep mechanical architecture, deliberate forward approach, cinematic but legible, no text, no logos, clean lower-left copy area.

**Flow motion:** Move slowly forward through the aperture while concentric transit rings index and distant city signals breathe. End on the same framing and light state as the opening frame for a seamless loop.

Target: `public/assets/city/districts/gate-loop-v2.mp4` and `gate-loop-v2.webp`.

### Systems

**Omni keyframe:** A cyan archive observatory with provenance threads, memory constellations, and orbital indexing instruments, abstract infrastructure rather than literal software screens, black glass and silver structure, no text.

**Flow motion:** Orbit the central archive slowly as provenance threads resolve, index, and return to their starting geometry. Keep the motion calm and precise.

Target: `systems-loop-v1.mp4` and `systems-loop-v1.webp`.

### Infrastructure

**Omni keyframe:** A gold-and-amber Forge and rackworks district with compute silhouettes, cooling paths, power rails, mechanical depth, and visible human-scale access corridors, no deployed-fleet implication.

**Flow motion:** Track laterally through the district as power and cooling traces move through the structure. Avoid sparks, explosions, frantic machinery, or fake status screens.

Target: `infrastructure-loop-v1.mp4` and `infrastructure-loop-v1.webp`.

### Identity

**Omni keyframe:** A red-and-cyan operator identity embassy where a physical NFC card emits a bounded verification pulse into a public signal surface, no face scan, biometric imagery, account data, or readable UI.

**Flow motion:** Let one pulse travel from card to public signal, resolve, and recede while the camera makes a restrained arc. Return all light and signal states for a seamless loop.

Target: `identity-loop-v1.mp4` and `identity-loop-v1.webp`.

### Public Record

**Omni keyframe:** A violet-and-gold archive gallery with artifact plates, timeline rails, and public proof objects moving into ordered continuity, museum-like depth, no private documents or readable labels.

**Flow motion:** Glide past the archive as a small group of artifact plates align along the timeline, then reset through a continuous orbital move.

Target: `record-loop-v1.mp4` and `record-loop-v1.webp`.

### Alignment

**Omni keyframe:** A green-and-gold signal hall where separate public routes converge at a human-held decision point, civic and commercial seriousness without money, equity, investment, or handshake cliches.

**Flow motion:** Follow converging light paths toward the decision point, pause in visual balance, and let the paths circulate back to their opening positions.

Target: `alignment-loop-v1.mp4` and `alignment-loop-v1.webp`.

### Operators

Source: approved `public/assets/operators/founders-cross-signal.jpeg` artwork. Do not regenerate either founder's face or identity.

**Flow motion:** Add restrained red/navy parallax, fabric movement, rain reflection, and signal traces. Preserve both founder silhouettes and the approved composition. No new biography, costume detail, typography, or facial generation.

Target: `operators-loop-v1.mp4` and `operators-loop-v1.webp`.

## Product Recording Intake

Store reviewed captures by product under `public/assets/city/proof/<product>/`. Each published capture needs:

- A compressed MP4 or WebM and matching WebP poster.
- A short public caption, exact maturity label, capture date, and source product/version.
- A completed public-safety review record naming the reviewer and review date.
- `truthClass: product_capture` in the City motion manifest or room override.

Before publication, scan every frame and notification surface for usernames, Windows paths, email addresses, customer or client data, tokens, API keys, telemetry identifiers, private records, browser history, and accidental notifications. Crop or redact before compression. A product capture may override atmospheric media only in its matching room.

## Manifest Promotion

The live component reads `src/data/cityMotion.json`. Replace the relevant `src` and `poster`, preserve the `source` and `truthClass`, update the manifest version, and run the full public build and browser smoke. Do not rename the component or add hardcoded media paths to the launcher.
