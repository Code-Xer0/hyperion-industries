const SOURCE_PATTERN = /^[a-z0-9][a-z0-9._-]{1,79}$/;
const PATH_PATTERN = /^\/[a-z0-9/_-]*$/i;

const pathSurface = (pathname) => {
  const normalized = pathname.replace(/^\/+|\/+$/g, '').replaceAll('/', '.') || 'home';
  const candidate = normalized.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').slice(0, 80);
  return SOURCE_PATTERN.test(candidate) ? candidate : 'public-site';
};

const safeSource = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return SOURCE_PATTERN.test(normalized) ? normalized : '';
};

export function publicIntakeAttribution(locationLike = globalThis.location, referrer = globalThis.document?.referrer || '') {
  const url = new URL(locationLike?.href || 'https://hyperion-industries.dev/intake');
  const entryPath = PATH_PATTERN.test(url.pathname) ? url.pathname : '/intake';
  let referrerCategory = 'direct';
  let referrerSurface = '';

  if (referrer) {
    try {
      const referrerUrl = new URL(referrer);
      referrerCategory = referrerUrl.origin === url.origin ? 'internal' : 'external';
      if (referrerCategory === 'internal') referrerSurface = pathSurface(referrerUrl.pathname);
    } catch {
      referrerCategory = 'unknown';
    }
  }

  return {
    entry_url: `${url.origin}${entryPath}`,
    entry_path: entryPath,
    referrer_category: referrerCategory,
    source_surface: safeSource(url.searchParams.get('source')) || referrerSurface || pathSurface(entryPath),
  };
}
