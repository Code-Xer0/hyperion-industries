import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { INTAKE_LANE_SEO, INTAKE_PUBLIC_CONTRACT_VERSION } from '../shared/intake/lane-seo.js';
import {
  DEFAULT_OG_IMAGE,
  ENTITY_SPINE,
  SEO_REDIRECTS,
  SEO_ROUTES,
  SITE_ORIGIN,
} from '../src/data/seoRoutes.js';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const defaultRoot = path.resolve(scriptDir, '..');

const OFFERING_ROUTE_IDS = Object.freeze({
  forge: 'forge',
  chronos: 'chronos',
  mnemos: 'mnemos',
  identity: 'identity',
  alignment: 'alignment',
  'card-studio': 'card-studio',
});

const IDENTITY_RECORDS = Object.freeze([
  {
    id: 'hyperion-industries',
    type: 'organization',
    name: 'Hyperion Industries',
    alternateNames: ['Hyperion Industries LLC'],
    canonicalUrl: `${SITE_ORIGIN}/`,
    relationship: 'Public company and institutional surface.',
  },
  {
    id: 'victor-amani',
    type: 'person',
    name: 'Victor Amani',
    alternateNames: ['Kushinda Furaha Zeleke', 'code_xer0', 'Code-Xer0', 'Δeus χ'],
    canonicalUrl: `${SITE_ORIGIN}/founders/victor-amani`,
    relationship: ENTITY_SPINE,
  },
  {
    id: 'keshawn-rowe',
    type: 'person',
    name: 'Keshawn Rowe',
    alternateNames: [],
    canonicalUrl: `${SITE_ORIGIN}/founders/keshawn-rowe`,
    relationship: 'Founding operator focused on operations, deployment, field systems, build intake, and client handoff.',
  },
]);

const COMPANY = Object.freeze({
  id: 'hyperion-industries',
  name: 'Hyperion Industries',
  legalName: 'Hyperion Industries LLC',
  canonicalUrl: `${SITE_ORIGIN}/`,
  email: 'hello@hyperion-industries.dev',
  location: 'Minneapolis, Minnesota',
  serviceArea: 'Minneapolis-Saint Paul metropolitan area',
  availability: 'Soft launch; limited requests and contracting time are considered after scope discussion.',
  summary: 'Hyperion Industries builds governed, local-first continuity infrastructure that preserves state and routes action across fragmented operations.',
  logo: `${SITE_ORIGIN}/assets/branding/hyperion/Hyblkvert.png`,
  profiles: ['https://www.linkedin.com/company/hyperion-industries-llc/'],
});

function readCorpus(rootDir) {
  const corpusPath = path.join(rootDir, 'workers', 'operator', 'corpus', 'public-corpus.source.json');
  const corpus = JSON.parse(fs.readFileSync(corpusPath, 'utf8'));
  return {
    id: corpus.corpusId,
    revision: corpus.revision,
    entries: corpus.entries.map(({ id, title, sourcePath, visibility, content }) => ({
      id,
      title,
      route: sourcePath,
      visibility,
      content,
    })),
  };
}

function publicRoute(route) {
  return {
    id: route.path === '/' ? 'home' : route.path.slice(1).replaceAll('/', '--'),
    path: route.path,
    canonicalUrl: route.canonical,
    title: route.title,
    description: route.description,
    summary: route.summary,
    maturity: route.maturity,
    schemaType: route.schemaType,
    indexable: route.indexable,
    image: new URL(route.ogImage || DEFAULT_OG_IMAGE, SITE_ORIGIN).href,
    relatedRoutes: route.relatedPaths || [],
    intakeLane: route.intakeLane || undefined,
  };
}

function offeringFor(route, id) {
  return {
    id,
    name: route.title.replace(/\s*\|.*$/, ''),
    route: route.path,
    canonicalUrl: route.canonical,
    summary: route.summary,
    maturity: route.maturity,
    availability: route.path === '/forge' || route.path === '/identity' || route.path === '/card-studio'
      ? 'Limited scoped requests are accepted after operator review.'
      : 'Public information and inquiry only; no automatic engagement or deployment claim.',
    intakeLane: route.path === '/forge'
      ? 'forge'
      : route.path === '/identity' || route.path === '/card-studio'
        ? 'operator-identity'
        : 'general',
  };
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function buildPublicRetrievalManifest({ rootDir = defaultRoot } = {}) {
  const corpus = readCorpus(rootDir);
  const routes = SEO_ROUTES.filter((route) => route.indexable).map(publicRoute);
  const routesByPath = new Map(SEO_ROUTES.map((route) => [route.path, route]));
  const offerings = Object.entries(OFFERING_ROUTE_IDS).map(([id, routeId]) => {
    const route = routesByPath.get(`/${routeId}`);
    if (!route) throw new Error(`Missing public offering route: /${routeId}`);
    return offeringFor(route, id);
  });
  const projection = {
    schemaVersion: '1.0.0',
    server: {
      id: 'dev.hyperion-industries/public-retrieval',
      version: '0.1.0',
      endpoint: 'https://mcp.hyperion-industries.dev/mcp',
      documentation: `${SITE_ORIGIN}/mcp`,
    },
    revision: corpus.revision,
    company: COMPANY,
    identities: IDENTITY_RECORDS,
    routes,
    offerings,
    intake: {
      contractVersion: INTAKE_PUBLIC_CONTRACT_VERSION,
      reviewBoundary: 'Operator review is required. Submission does not imply acceptance, contracting, or response time.',
      uploadsSupported: false,
      lanes: INTAKE_LANE_SEO.map(({ id, title, description, summary }) => ({
        id,
        route: `/intake/${id}`,
        title,
        description,
        summary,
      })),
    },
    redirects: [...SEO_REDIRECTS].map(([from, to]) => ({ from, to })),
    corpus,
  };
  const sha256 = createHash('sha256').update(stableStringify(projection)).digest('hex');
  return { ...projection, sha256 };
}

export function assertSafePublicProjection(manifest) {
  const serialized = JSON.stringify(manifest);
  const forbidden = [
    'sourceFiles',
    'sourcefiles',
    'repositoryPath',
    'filesystem',
    'D:\\\\',
    'C:\\\\Users',
    '/founder\"',
    'OPENROUTER_API_KEY',
    'RESEND_API_KEY',
  ];
  for (const needle of forbidden) {
    if (serialized.includes(needle)) throw new Error(`Unsafe public retrieval projection contains: ${needle}`);
  }
  for (const route of manifest.routes) {
    if (!route.canonicalUrl.startsWith(SITE_ORIGIN)) throw new Error(`Non-canonical public route: ${route.path}`);
  }
  return manifest;
}

export function renderLlmsText(manifest) {
  const routeLines = manifest.routes.map((route) => `- [${route.title}](${route.canonicalUrl}): ${route.summary}`);
  const offeringLines = manifest.offerings.map((offering) => `- ${offering.name} (${offering.maturity}): ${offering.summary}`);
  return `# Hyperion Industries\n\n> ${manifest.company.summary}\n\n${manifest.company.availability}\n\n## Canonical identity\n\n${ENTITY_SPINE}\n\n## Public routes\n\n${routeLines.join('\n')}\n\n## Offerings\n\n${offeringLines.join('\n')}\n\n## Public retrieval MCP\n\n- Endpoint: ${manifest.server.endpoint}\n- Documentation: ${manifest.server.documentation}\n- Corpus revision: ${manifest.revision}\n- Manifest SHA-256: ${manifest.sha256}\n\nThe MCP is deterministic and corpus-bound. It does not browse the web, call a language model, or expose private source, telemetry, drafts, or operator systems.\n`;
}

export function renderGeneratedManifestModule(manifest) {
  return `// Generated by scripts/generate-seo-artifacts.mjs. Do not edit.\nexport const PUBLIC_RETRIEVAL_MANIFEST = ${JSON.stringify(manifest, null, 2)} as const;\n`;
}
