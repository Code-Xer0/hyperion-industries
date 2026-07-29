import { INTAKE_LANE_SEO } from '../../shared/intake/lane-seo.js';
import { cityRoutes } from './publicCity.js';
import { SITE_CONTENT_PAGES } from '../generated/siteContent.js';

export const SITE_ORIGIN = 'https://hyperion-industries.dev';
export const ENTITY_SPINE = 'Victor Amani is the professional name of Kushinda Furaha Zeleke, founder and systems architect of Hyperion Industries in Minneapolis.';
export const DEFAULT_OG_IMAGE = '/assets/branding/hyperion/hyperion-link-preview.jpeg';

const fixedRoutes = [
  {
    path: '/',
    title: 'Hyperion Industries | Local-First Intelligent Infrastructure',
    description: 'Hyperion Industries is a Minneapolis systems company in soft launch, accepting limited local-first software, infrastructure, identity, and custom-systems requests after scope review.',
    summary: 'A public city for local-first software, custom hardware, operator identity, continuity, and limited scoped contracting.',
    maturity: 'PUBLIC EDGE · SOFT LAUNCH',
    schemaType: 'WebSite',
    sourceFiles: ['src/pages/HomePage.jsx', 'src/data/publicCity.js', 'src/data/seoRoutes.js'],
    relatedPaths: ['/systems', '/forge', '/founders/victor-amani', '/intake'],
  },
  {
    path: '/systems',
    title: 'Systems Directory | Hyperion Industries',
    description: 'Public directory for Hyperion software, archive, memory, infrastructure, and local-first operating systems.',
    summary: 'A public-safe directory of Hyperion systems and their current maturity.',
    maturity: 'PUBLIC-SAFE MAP',
    schemaType: 'CollectionPage',
    sourceFiles: ['src/pages/SystemsPage.jsx', 'site-content/collections/systems.json'],
    relatedPaths: ['/chronos', '/mnemos', '/software-estate'],
  },
  {
    path: '/build-archive',
    title: 'Forge Build Archive | Hyperion Industries',
    description: 'Public archive of custom computers, workstations, cooling, operator environments, and physical systems built by Hyperion.',
    summary: 'Completed physical systems and operator-centered workstation evidence from the Hyperion Forge.',
    maturity: 'PUBLIC ARCHIVE',
    schemaType: 'CollectionPage',
    ogImage: '/assets/builds/20230803_133211.jpg',
    sourceFiles: ['src/pages/BuildArchivePage.jsx', 'site-content/collections/showcase.json'],
    relatedPaths: ['/forge', '/gallery', '/forge/catalog'],
  },
  {
    path: '/forge/catalog',
    title: 'Forge Systems Catalog | Hyperion Industries',
    description: 'Explore Hyperion Forge gaming, creator, local-AI, compact, and custom-loop system lanes before operator review.',
    summary: 'Five source-opaque system patterns from HypOM, presented as inquiry lanes rather than shelf inventory or instant quotes.',
    maturity: 'PUBLIC CATALOG · REVIEW REQUIRED',
    schemaType: 'CollectionPage',
    ogImage: '/assets/forge/media-v1/posters/hyperion-workstation-triptych-1280x720.jpg',
    sourceFiles: ['src/features/forge-catalog/ForgeCatalogPage.jsx', 'src/data/forgeProductViews.js'],
    relatedPaths: ['/forge', '/forge/configurator', '/build-archive'],
  },
  {
    path: '/gallery',
    title: 'Artifact Gallery | Hyperion Industries',
    description: 'Public-safe Hyperion imagery spanning systems, builds, interfaces, identity, and operator environments.',
    summary: 'A public record of selected Hyperion systems, builds, visual language, and operator environments.',
    maturity: 'PUBLIC ARCHIVE',
    schemaType: 'CollectionPage',
    ogImage: '/assets/operators/deus-x-portrait-complete.png',
    sourceFiles: ['src/pages/GalleryPage.jsx', 'site-content/collections/gallery.json'],
    relatedPaths: ['/build-archive', '/identity', '/founders'],
  },
  {
    path: '/dev-diary',
    title: 'Development Diary | Hyperion Industries',
    description: 'Public notes on what Hyperion has shipped, what is being built, and which gaps remain open.',
    summary: 'A truthful public build record separating shipped work, active development, and known gaps.',
    maturity: 'PUBLIC NOTES',
    schemaType: 'Blog',
    sourceFiles: ['src/pages/DevDiaryPage.jsx'],
    relatedPaths: ['/architecture', '/systems', '/contact'],
  },
  {
    path: '/card-studio',
    title: 'Hyperion Card Studio Invite Preview | Smart Operator Identity',
    description: 'Compose a guarded operator-card design brief with live front, back, and digital proofs in Hyperion\'s invite-only soft-launch lane.',
    summary: 'An invite-only native studio for deterministic card proofs and operator-reviewed identity handoff.',
    maturity: 'INVITE-ONLY PREVIEW',
    schemaType: 'SoftwareApplication',
    ogImage: '/assets/city/proof/card-studio-smoke.png',
    aliases: ['/card-studio/', '/card-studio/studio.html', '/assets/card-studio/studio.html', '/studio/card-studio'],
    sourceFiles: ['src/pages/CardStudioPage.jsx', 'src/features/card-studio/CardStudioEditor.jsx'],
    relatedPaths: ['/identity', '/dxcard', '/intake/operator-identity'],
  },
  {
    path: '/contact',
    title: 'Contact Hyperion Industries | Limited Scoped Requests',
    description: 'Hyperion is preparing for soft launch and accepting a limited number of requests and contracting engagements after scope discussion.',
    summary: 'An appointment-based contact surface for limited requests, support, partnerships, and scoped contracting.',
    maturity: 'PUBLIC SIGNAL · LIMITED AVAILABILITY',
    schemaType: 'ContactPage',
    sourceFiles: ['src/pages/ContactPage.jsx'],
    relatedPaths: ['/intake', '/forge', '/chronos'],
  },
  {
    path: '/mcp',
    title: 'Public Retrieval MCP | Hyperion Industries',
    description: 'Connect AI clients to Hyperion\'s public, corpus-bound retrieval server and governed intake tools without exposing private source or operator systems.',
    summary: 'An unlisted soft-launch MCP for deterministic public retrieval and operator-reviewed intake.',
    maturity: 'SOFT LAUNCH · UNLISTED PUBLIC MCP',
    schemaType: 'WebPage',
    sourceFiles: ['src/pages/McpPage.jsx', 'scripts/public-retrieval.mjs', 'workers/public-mcp/src/index.ts'],
    relatedPaths: ['/systems', '/intake', '/contact'],
  },
  {
    path: '/newsletter',
    title: 'Hyperion Newsletter Status | Hyperion Industries',
    description: 'Status page for Hyperion public updates; the newsletter remains staged and does not pretend to accept subscriptions.',
    summary: 'A staged communications lane with honest publication posture.',
    maturity: 'STAGED',
    schemaType: 'WebPage',
    sourceFiles: ['src/pages/NewsletterPage.jsx'],
    relatedPaths: ['/dev-diary', '/contact'],
  },
  {
    path: '/store',
    title: 'Hyperion Store Status | Products by Inquiry',
    description: 'Current Hyperion product and service lanes without invented inventory, payment capture, or public checkout.',
    summary: 'A truthful product-lane directory for systems currently available by scoped inquiry.',
    maturity: 'STAGED · NO CHECKOUT',
    schemaType: 'CollectionPage',
    sourceFiles: ['src/pages/StorePage.jsx', 'site-content/collections/commerce.json'],
    relatedPaths: ['/forge', '/identity', '/contact'],
  },
  {
    path: '/founders',
    title: 'Meet the Founders | Hyperion Industries',
    description: 'The founding operators behind Hyperion Industries systems, infrastructure, operations, and deployment posture.',
    summary: 'The public roster behind Hyperion Industries.',
    maturity: 'PUBLIC PROFILES',
    schemaType: 'CollectionPage',
    sourceFiles: ['src/pages/FoundersPage.jsx', 'site-content/collections/operators.json'],
    relatedPaths: ['/founders/victor-amani', '/founders/keshawn-rowe', '/contact'],
  },
  {
    path: '/founders/victor-amani',
    title: 'Victor Amani (Kushinda Furaha Zeleke) | Hyperion Founder',
    description: 'Victor Amani, the professional name of Kushinda Furaha Zeleke, is the Minneapolis founder and systems architect behind Hyperion Industries.',
    summary: ENTITY_SPINE,
    maturity: 'FULL PUBLIC PROFILE',
    schemaType: 'ProfilePage',
    ogImage: '/assets/operators/victor-city-operating-edge.png',
    sourceFiles: ['src/pages/FounderPage.jsx', 'site-content/collections/operators.json'],
    relatedPaths: ['/', '/systems', '/contact'],
  },
  {
    path: '/founders/keshawn-rowe',
    title: 'Keshawn Rowe | Founder, Hyperion Industries',
    description: 'Keshawn Rowe is a founding Hyperion operator focused on operations, deployment, field systems, build intake, and client handoff.',
    summary: 'A deliberately limited public founder dossier for Hyperion operations and deployment.',
    maturity: 'PROFILE IN PROGRESS',
    schemaType: 'ProfilePage',
    ogImage: '/assets/operators/keshawn-rowe-dossier.jpeg',
    sourceFiles: ['src/pages/FounderPage.jsx', 'site-content/collections/operators.json'],
    relatedPaths: ['/founders', '/forge', '/contact'],
  },
  {
    path: '/dxcard',
    title: 'Δeus χ | Victor Amani Operator Card',
    description: 'Public operator card for Victor Amani, founder and systems architect of Hyperion Industries.',
    summary: 'A compact public identity and contact surface for the Hyperion founding operator.',
    maturity: 'SHIPPING',
    schemaType: 'ProfilePage',
    ogImage: '/assets/operators/deus-x-wide-brand.png',
    aliases: ['/dxcard/', '/dxcard/index.html'],
    staticArtifact: true,
    sourceFiles: ['public/dxcard/index.html'],
    relatedPaths: ['/founders/victor-amani', '/identity', '/contact'],
  },
];

const districtSchema = {
  chronos: 'SoftwareApplication',
  mnemos: 'SoftwareApplication',
  forge: 'Service',
  identity: 'Service',
  alignment: 'Service',
  pandora: 'TechArticle',
  talos: 'TechArticle',
  'software-estate': 'TechArticle',
  succession: 'TechArticle',
  'pandora-lite': 'TechArticle',
  architecture: 'TechArticle',
};

const districtRoutes = cityRoutes.map((district) => ({
  path: district.path,
  title: district.seoTitle,
  description: district.seoDescription,
  summary: district.summary,
  maturity: district.status,
  schemaType: districtSchema[district.id] || 'WebPage',
  ogImage: district.media?.src,
  sourceFiles: ['src/data/publicCity.js', 'src/pages/DistrictPage.jsx'],
  relatedPaths: (district.related || [])
    .map((id) => cityRoutes.find((candidate) => candidate.id === id)?.path)
    .filter(Boolean),
}));

const intakeRoutes = [
  {
    path: '/forge/configurator',
    title: 'Forge Concierge | Guided System Discovery | Hyperion Industries',
    description: 'Take a source-backed, one-question-at-a-time route toward a workstation, gaming system, local-AI machine, sim rig, or upgrade brief.',
    summary: 'A warm guided Forge itinerary with explicit unknowns, evidence drawers, system neighborhoods, and a held-review handoff.',
    maturity: 'COMMERCIAL LANE · REVIEW REQUIRED',
    schemaType: 'Service',
    sourceFiles: ['src/features/forge-configurator/ForgeConfiguratorPage.jsx', 'shared/intake/contracts/forms/forge-configurator.form.json'],
    relatedPaths: ['/forge', '/forge/catalog', '/build-archive', '/contact'],
    aliases: ['/intake/forge'],
  },
  {
    path: '/intake',
    title: 'Hyperion Intake OS | Limited Requests and Scoped Contracting',
    description: 'Choose a truthful Hyperion intake lane for limited soft-launch requests, scoped contracting, support, identity, continuity, or partnership review.',
    summary: 'Seven public routes, one operator-review boundary, and no automatic promise of acceptance or engagement.',
    maturity: 'SOFT LAUNCH · LIMITED INTAKE',
    schemaType: 'ContactPage',
    sourceFiles: ['src/features/intake/IntakePage.jsx', 'shared/intake/model.ts', 'shared/intake/lane-seo.js'],
    relatedPaths: ['/forge', '/contact', '/alignment'],
  },
  ...INTAKE_LANE_SEO.map((lane) => ({
    path: `/intake/${lane.id}`,
    title: lane.title,
    description: lane.description,
    summary: lane.summary,
    maturity: 'LIMITED REQUESTS · OPERATOR REVIEW',
    schemaType: 'ContactPage',
    sourceFiles: ['src/features/intake/IntakePage.jsx', 'shared/intake/model.ts', 'shared/intake/lane-seo.js'],
    relatedPaths: ['/intake', '/contact'],
    intakeLane: lane.id,
  })),
  {
    path: '/intake/resume',
    title: 'Resume Hyperion Intake',
    description: 'Resume a previously authorized Hyperion intake draft.',
    summary: 'A private continuation surface for an existing intake draft.',
    maturity: 'UTILITY · NOT INDEXED',
    schemaType: 'WebPage',
    indexable: false,
    sourceFiles: ['src/features/intake/IntakePage.jsx'],
  },
];

const legacyAliases = {
  '/systems.html': '/systems',
  '/forge.html': '/forge',
  '/showcase.html': '/build-archive',
  '/gallery.html': '/gallery',
  '/contact.html': '/contact',
  '/builds.html': '/build-archive',
  '/build-archive.html': '/build-archive',
  '/dev-diary.html': '/dev-diary',
  '/newsletter.html': '/newsletter',
  '/store.html': '/store',
};

const governedContentRoutes = SITE_CONTENT_PAGES.map((page) => ({
  path: page.path,
  title: `${page.title} | Hyperion Industries`,
  description: page.description,
  summary: page.summary || page.description,
  maturity: page.maturity,
  schemaType: page.template === 'collection' ? 'CollectionPage' : 'WebPage',
  indexable: page.indexable,
  ogImage: page.og_asset || DEFAULT_OG_IMAGE,
  sourceFiles: [`site-content/pages/${page.id.replace(/^page_/, '')}.json`],
  relatedPaths: page.related_paths || [],
}));

export const SEO_ROUTES = Object.freeze(
  [...fixedRoutes, ...districtRoutes, ...intakeRoutes, ...governedContentRoutes].map((route) => ({
    indexable: true,
    ogImage: DEFAULT_OG_IMAGE,
    relatedPaths: [],
    aliases: [],
    ...route,
    canonical: `${SITE_ORIGIN}${route.path === '/' ? '/' : route.path}`,
  })),
);

export const SEO_ROUTE_BY_PATH = new Map(SEO_ROUTES.map((route) => [route.path, route]));
export const SEO_REDIRECTS = new Map([
  ...SEO_ROUTES.flatMap((route) => route.aliases.map((alias) => [alias, route.path])),
  ...Object.entries(legacyAliases),
]);

export function getSeoRoute(pathname) {
  return SEO_ROUTE_BY_PATH.get(pathname) || null;
}

export function getSeoRedirect(pathname) {
  return SEO_REDIRECTS.get(pathname) || null;
}

const organization = {
  '@type': 'Organization',
  '@id': `${SITE_ORIGIN}/#organization`,
  name: 'Hyperion Industries',
  legalName: 'Hyperion Industries LLC',
  alternateName: 'Hyperion Industries LLC',
  url: `${SITE_ORIGIN}/`,
  email: 'hello@hyperion-industries.dev',
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_ORIGIN}/assets/branding/hyperion/Hyblkvert.png`,
    contentUrl: `${SITE_ORIGIN}/assets/branding/hyperion/Hyblkvert.png`,
    caption: 'Hyperion Industries logo',
  },
  description: 'Minneapolis-based local-first intelligent infrastructure, systems architecture, custom compute, identity, continuity, and scoped contracting.',
  founder: { '@id': `${SITE_ORIGIN}/founders/victor-amani#person` },
  areaServed: {
    '@type': 'AdministrativeArea',
    name: 'Minneapolis–Saint Paul metropolitan area',
  },
  sameAs: ['https://www.linkedin.com/company/hyperion-industries-llc/'],
};

const person = {
  '@type': 'Person',
  '@id': `${SITE_ORIGIN}/founders/victor-amani#person`,
  name: 'Victor Amani',
  alternateName: ['Kushinda Furaha Zeleke', 'code_xer0', 'Δeus χ'],
  jobTitle: 'Founder and Systems Architect',
  worksFor: { '@id': `${SITE_ORIGIN}/#organization` },
  url: `${SITE_ORIGIN}/founders/victor-amani`,
  sameAs: [
    'https://github.com/Code-Xer0',
    'https://www.linkedin.com/in/victor-a-1231a975/',
    'https://victoramani.substack.com/',
  ],
};

function breadcrumbFor(route) {
  if (route.path === '/') return null;
  return {
    '@type': 'BreadcrumbList',
    '@id': `${route.canonical}#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Hyperion Industries', item: `${SITE_ORIGIN}/` },
      { '@type': 'ListItem', position: 2, name: route.title.replace(/\s*\|.*$/, ''), item: route.canonical },
    ],
  };
}

export function buildStructuredData(route) {
  const pageType = ['ContactPage', 'CollectionPage', 'ProfilePage', 'TechArticle', 'Blog'].includes(route.schemaType)
    ? route.schemaType
    : 'WebPage';
  const page = {
    '@type': pageType,
    '@id': `${route.canonical}#webpage`,
    url: route.canonical,
    name: route.title,
    description: route.description,
    isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
    about: { '@id': `${SITE_ORIGIN}/#organization` },
    breadcrumb: route.path === '/' ? undefined : { '@id': `${route.canonical}#breadcrumb` },
  };
  const graph = [page];

  if (route.path === '/') {
    graph.unshift(organization, person, {
      '@type': 'WebSite',
      '@id': `${SITE_ORIGIN}/#website`,
      name: 'Hyperion Industries',
      url: `${SITE_ORIGIN}/`,
      publisher: { '@id': `${SITE_ORIGIN}/#organization` },
    });
  } else if (route.path === '/founders/victor-amani') {
    graph.unshift(person);
  }

  if (route.ogImage) {
    graph.push({
      '@type': 'ImageObject',
      '@id': `${route.canonical}#primaryimage`,
      contentUrl: new URL(route.ogImage, SITE_ORIGIN).href,
      url: new URL(route.ogImage, SITE_ORIGIN).href,
      caption: `${route.title.replace(/\s*\|.*$/, '')} — Hyperion Industries`,
      representativeOfPage: true,
      width: route.ogImageWidth || undefined,
      height: route.ogImageHeight || undefined,
    });
    page.primaryImageOfPage = { '@id': `${route.canonical}#primaryimage` };
  }

  if (route.schemaType === 'SoftwareApplication') {
    graph.push({
      '@type': 'SoftwareApplication',
      '@id': `${route.canonical}#software`,
      name: route.title.replace(/\s*\|.*$/, ''),
      url: route.canonical,
      description: route.description,
      applicationCategory: 'BusinessApplication',
      creator: { '@id': `${SITE_ORIGIN}/#organization` },
    });
    page.mainEntity = { '@id': `${route.canonical}#software` };
  } else if (route.schemaType === 'Service') {
    graph.push({
      '@type': 'Service',
      '@id': `${route.canonical}#service`,
      name: route.title.replace(/\s*\|.*$/, ''),
      url: route.canonical,
      description: route.description,
      provider: { '@id': `${SITE_ORIGIN}/#organization` },
      areaServed: { '@type': 'AdministrativeArea', name: 'Minneapolis–Saint Paul metropolitan area' },
    });
    page.mainEntity = { '@id': `${route.canonical}#service` };
  } else if (route.schemaType === 'ProfilePage' && route.path.includes('victor-amani')) {
    page.mainEntity = { '@id': `${SITE_ORIGIN}/founders/victor-amani#person` };
  }

  const breadcrumb = breadcrumbFor(route);
  if (breadcrumb) graph.push(breadcrumb);

  return { '@context': 'https://schema.org', '@graph': graph };
}
