import CinematicBackdrop from './CinematicBackdrop';
import { HYPERION_MEDIA_MANIFEST } from '../../data/mediaManifest';

export default function ForgeCinematicBackdrop({ controlTarget }) {
  return <CinematicBackdrop asset={HYPERION_MEDIA_MANIFEST.assets.forge_hero} className="forge-room-cinematic" label="Play Forge build film" controlTarget={controlTarget} autoplay />;
}
