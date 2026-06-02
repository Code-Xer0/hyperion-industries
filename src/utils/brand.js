export const HYPERION_MARK_DARK = '/assets/branding/hyperion/hyperion-mark-dark.svg';
export const HYPERION_MARK_LIGHT = '/assets/branding/hyperion/hyperion-mark-light.svg';
export const HYPERION_MARK_DEFAULT = HYPERION_MARK_DARK;

export function hyperionMarkForTheme(isLightMode) {
  return isLightMode ? HYPERION_MARK_LIGHT : HYPERION_MARK_DARK;
}
