import { cityRoutes } from './publicCity';
import cityMotion from './cityMotion.json';

const districtByPath = new Map(cityRoutes.map((district) => [district.path, district]));

const imagePreview = (src, alt, objectPosition = 'center', source = 'Hyperion public route artwork') => (
  src ? {
    type: 'image',
    src,
    poster: src,
    alt,
    objectPosition,
    source,
    truthClass: 'atmosphere',
  } : null
);

const forgeVideo = (id, alt, objectPosition = 'center') => ({
  type: 'video',
  src: `/assets/forge/media-v1/cards/hyperion-${id}-card.mp4`,
  poster: `/assets/forge/media-v1/posters/hyperion-${id}-card.jpg`,
  alt,
  objectPosition,
  source: 'Hyperion Forge field media',
  truthClass: 'product_capture',
});

const forgeNavigationStills = [
  {
    src: '/assets/forge/media-v1/stills/kuda-white-build-blue.jpg',
    alt: 'White Kuda workstation build with blue-lit fans',
  },
  {
    src: '/assets/forge/media-v1/stills/kuda-white-build-lime.jpg',
    alt: 'White Kuda workstation build with lime-lit fans',
  },
];

const route = (path, label, family, options = {}) => {
  const district = districtByPath.get(path);

  return {
    path,
    label,
    family,
    status: options.status ?? district?.status ?? 'PUBLIC ROUTE',
    tone: options.tone ?? district?.tone ?? 'map',
    keywords: options.keywords ?? [],
    previewImage: options.previewImage ?? district?.image ?? null,
    previewPosition: options.previewPosition ?? 'center',
    previewMedia: options.previewMedia ?? imagePreview(
      options.previewImage ?? district?.image,
      options.previewAlt ?? `${label} public route artwork`,
      options.previewPosition ?? 'center',
    ),
    mark: options.mark ?? null,
    markAlt: options.markAlt ?? '',
    markPlacement: options.markPlacement ?? 'left',
    previewStills: options.previewStills ?? [],
    external: options.external ?? false,
    utility: options.utility ?? false,
  };
};

export const cityFamilies = [
  {
    id: 'systems',
    label: 'Systems',
    description: 'Archive, memory, and the public software estate.',
    previewMedia: cityMotion.assets.systems,
    ambient: { primary: '33, 214, 232', secondary: '124, 231, 255', intensity: 0.92 },
    routes: [
      route('/systems', 'Systems Directory', 'systems', { status: 'PUBLIC-SAFE MAP', keywords: ['directory', 'products'] }),
      route('/chronos', 'CHR0N.OS Observatory', 'systems', { keywords: ['chronos', 'chrono', 'archive', 'recovery', 'stable beta'] }),
      route('/mnemos', 'Mnem.OS Archive', 'systems', { keywords: ['mnemos', 'memory', 'continuity', 'development'] }),
      route('/software-estate', 'Software Estate', 'systems', { keywords: ['local first', 'workloads', 'map'] }),
    ],
  },
  {
    id: 'infrastructure',
    label: 'Infrastructure',
    description: 'Fabrication, compute, control, and lifecycle doctrine.',
    previewMedia: cityMotion.assets.infrastructure,
    ambient: { primary: '255, 199, 44', secondary: '255, 119, 42', intensity: 0.94 },
    routes: [
      route('/forge', 'The Forge', 'infrastructure', {
        keywords: ['build', 'workstation', 'commercial'],
        previewMedia: forgeVideo('workstation-core', 'Kuda workstation core assembly'),
        previewStills: forgeNavigationStills,
      }),
      route('/pandora', 'Pandora Rackworks', 'infrastructure', { keywords: ['hardware', 'rack', 'poc'], previewMedia: forgeVideo('gpu-telemetry', 'GPU telemetry inside a Hyperion Forge build') }),
      route('/talos', 'Tal.OS Control Tower', 'infrastructure', { keywords: ['talos', 'control plane', 'governance'], previewMedia: forgeVideo('operator-console', 'Hyperion operator console and control surfaces') }),
      route('/succession', 'Lifecycle Succession', 'infrastructure', { keywords: ['gpu', 'migration', 'doctrine'], previewMedia: forgeVideo('workspace-systems', 'Hyperion workspace systems in the Forge environment') }),
      route('/pandora-lite', 'Pandora Lite', 'infrastructure', { keywords: ['civic', 'concept', 'second life'], previewMedia: forgeVideo('custom-workstation', 'Custom Hyperion workstation build detail') }),
    ],
  },
  {
    id: 'identity',
    label: 'Identity',
    description: 'Physical identity, NFC, and public operator surfaces.',
    previewMedia: cityMotion.assets.identity,
    ambient: { primary: '255, 75, 69', secondary: '33, 214, 232', intensity: 0.9 },
    routes: [
      route('/identity', 'Operator Identity Embassy', 'identity', { keywords: ['nfc', 'cards', 'shipping'] }),
      route('/card-studio', 'Card Studio', 'identity', { status: 'SHIPPING', tone: 'shipping', keywords: ['business card', 'studio'] }),
      route('/dxcard', 'Operator Card', 'identity', { status: 'SHIPPING', tone: 'shipping', keywords: ['dx card', 'profile'] }),
    ],
  },
  {
    id: 'record',
    label: 'Public Record',
    description: 'Proof, artifacts, notes, and approved operator profiles.',
    previewMedia: cityMotion.assets.record,
    ambient: { primary: '156, 108, 255', secondary: '255, 199, 44', intensity: 0.84 },
    routes: [
      route('/build-archive', 'Build Archive', 'record', { status: 'PUBLIC ARCHIVE', keywords: ['forge', 'proof', 'builds'] }),
      route('/gallery', 'Gallery', 'record', { status: 'PUBLIC ARCHIVE', keywords: ['artifacts', 'media', 'proof'] }),
      route('/dev-diary', 'Development Diary', 'record', { status: 'PUBLIC NOTES', keywords: ['updates', 'shipped', 'gaps'] }),
    ],
  },
  {
    id: 'alignment',
    label: 'Alignment',
    description: 'Commercial fit, inquiry routing, and public utility lanes.',
    previewMedia: cityMotion.assets.alignment,
    ambient: { primary: '114, 221, 177', secondary: '255, 199, 44', intensity: 0.82 },
    routes: [
      route('/alignment', 'Alignment Hall', 'alignment', { keywords: ['partners', 'grants', 'customers'] }),
      route('/contact', 'Contact Signal', 'alignment', { status: 'PUBLIC SIGNAL', keywords: ['inquiry', 'support', 'email'] }),
      route('/newsletter', 'Newsletter', 'alignment', { status: 'STAGED', tone: 'concept', utility: true }),
      route('/store', 'Store', 'alignment', { status: 'STAGED · NO CHECKOUT', tone: 'concept', utility: true }),
    ],
  },
  {
    id: 'operators',
    label: 'Operators',
    description: 'The public founders roster and approved operator dossiers.',
    previewImage: '/assets/operators/founders-cross-signal.jpeg',
    previewMedia: cityMotion.assets.operators,
    ambient: { primary: '255, 46, 46', secondary: '90, 160, 255', intensity: 1 },
    routes: [
      route('/founders', 'Meet the Founders', 'operators', {
        status: 'PUBLIC PROFILES',
        keywords: ['founders', 'operators', 'roster'],
      }),
      route('/founders/victor-amani', 'Victor Amani / Δeus χ', 'operators', {
        status: 'FULL PUBLIC PROFILE',
        tone: 'live',
        keywords: ['victor', 'amani', 'deus', 'founder', 'systems architect'],
        previewImage: '/assets/operators/victor-transmission.gif',
        previewPosition: 'center',
        previewMedia: {
          type: 'image',
          src: '/assets/operators/victor-transmission.gif',
          poster: '/assets/operators/victor-transmission.gif',
          alt: 'Victor Amani public operator transmission',
          objectPosition: 'center',
          source: 'Approved public founder media',
          truthClass: 'approved_public_media',
        },
        mark: '/assets/operators/victor-operator-mark.png',
        markAlt: 'Victor Amani Hyperion operator mark',
        markPlacement: 'right',
      }),
      route('/founders/keshawn-rowe', 'Keshawn Rowe', 'operators', {
        status: 'PROFILE IN PROGRESS',
        tone: 'concept',
        keywords: ['keshawn', 'rowe', 'founder', 'operations'],
        previewImage: '/assets/operators/keshawn-rowe-dossier.jpeg',
        previewPosition: 'center 30%',
        previewMedia: {
          type: 'image',
          src: '/assets/operators/keshawn-rowe-dossier.jpeg',
          poster: '/assets/operators/keshawn-rowe-dossier.jpeg',
          alt: 'Keshawn Rowe public profile dossier',
          objectPosition: 'center 30%',
          source: 'Approved public founder media',
          truthClass: 'approved_public_media',
        },
        mark: '/assets/operators/keshawn-wraith-mark.jpeg',
        markAlt: 'WRAITH — Ghostly & Lethal',
      }),
    ],
  },
];

export const cityDestinations = cityFamilies.flatMap((family) => family.routes);
export const cityMotionManifest = cityMotion;

export const cityUtilities = [
  { label: 'Gate', path: '/' },
  { label: 'Architecture', path: '/architecture' },
  { label: 'Gallery', path: '/gallery' },
  { label: 'Founders', path: '/founders' },
  { label: 'Email', href: 'mailto:hello@hyperion-industries.dev' },
];

export function getCityDestination(pathname) {
  const exact = cityDestinations.find((destination) => destination.path === pathname);
  if (exact) return exact;
  if (pathname.startsWith('/founders/')) {
    return route('/founders', 'Operator Profile', 'operators', { status: 'PUBLIC PROFILE' });
  }
  return pathname === '/' ? { path: '/', label: 'City Gate', family: 'gate', status: 'PUBLIC EDGE', tone: 'map' } : null;
}

const gateAmbient = { primary: '255, 199, 44', secondary: '33, 214, 232', intensity: 0.9 };

export function getCityAmbientProfile(pathname) {
  if (pathname === '/') return { id: 'gate', ...gateAmbient };

  const destination = getCityDestination(pathname);
  const family = cityFamilies.find((candidate) => candidate.id === destination?.family);

  return family ? { id: family.id, ...family.ambient } : { id: 'gate', ...gateAmbient };
}
