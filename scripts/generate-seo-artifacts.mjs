import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildStructuredData,
  DEFAULT_OG_IMAGE,
  SEO_REDIRECTS,
  SEO_ROUTE_BY_PATH,
  SEO_ROUTES,
  SITE_ORIGIN,
} from '../src/data/seoRoutes.js';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const defaultRoot = path.resolve(scriptDir, '..');
const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const stripManagedHead = (html) => html
  .replace(/\s*<title>[\s\S]*?<\/title>/gi, '')
  .replace(/\s*<meta\s+(?:name|property)=["'](?:description|robots|og:[^"']+|twitter:[^"']+)["'][^>]*>/gi, '')
  .replace(/\s*<link\s+rel=["']canonical["'][^>]*>/gi, '')
  .replace(/\s*<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '');

function newestCommitDate(rootDir, files) {
  const existing = files.filter((file) => fs.existsSync(path.resolve(rootDir, file)));
  if (!existing.length) return null;
  try {
    const output = execFileSync(
      'git',
      ['log', '-1', '--format=%cI', '--', ...existing],
      { cwd: rootDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    ).trim();
    return output ? output.slice(0, 10) : null;
  } catch {
    return null;
  }
}

function metadataFor(route) {
  const image = new URL(route.ogImage || DEFAULT_OG_IMAGE, SITE_ORIGIN).href;
  const robots = route.indexable
    ? 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'
    : 'noindex,follow';
  const schema = JSON.stringify(buildStructuredData(route)).replaceAll('</script', '<\\/script');

  return `
    <title>${escapeHtml(route.title)}</title>
    <meta name="description" content="${escapeHtml(route.description)}" />
    <meta name="robots" content="${robots}" />
    <link rel="canonical" href="${escapeHtml(route.canonical)}" />
    <meta property="og:site_name" content="Hyperion Industries" />
    <meta property="og:title" content="${escapeHtml(route.title)}" />
    <meta property="og:description" content="${escapeHtml(route.description)}" />
    <meta property="og:type" content="${route.schemaType === 'ProfilePage' ? 'profile' : 'website'}" />
    <meta property="og:url" content="${escapeHtml(route.canonical)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:image:alt" content="${escapeHtml(`${route.title} — Hyperion Industries`)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(route.title)}" />
    <meta name="twitter:description" content="${escapeHtml(route.description)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />
    <script type="application/ld+json">${schema}</script>
    <style id="seo-route-shell">.seo-route-fallback{max-width:72rem;margin:0 auto;padding:6rem 1.5rem;color:#f4f0e8;background:#07080a;font:16px/1.6 system-ui,sans-serif}.seo-route-fallback a{color:#ffc72c}.seo-route-fallback__status{font:700 12px/1.4 ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase;color:#ffc72c}</style>`;
}

function fallbackFor(route) {
  const links = route.relatedPaths
    .map((relatedPath) => SEO_ROUTE_BY_PATH.get(relatedPath))
    .filter(Boolean)
    .map((related) => `<li><a href="${escapeHtml(related.path)}">${escapeHtml(related.title.replace(/\s*\|.*$/, ''))}</a></li>`)
    .join('');
  return `<div id="root"><main class="seo-route-fallback"><p class="seo-route-fallback__status">${escapeHtml(route.maturity)}</p><h1>${escapeHtml(route.title.replace(/\s*\|.*$/, ''))}</h1><p>${escapeHtml(route.summary)}</p>${links ? `<nav aria-label="Related Hyperion routes"><ul>${links}</ul></nav>` : ''}<p><a href="/contact">Discuss a limited scoped request</a></p></main></div>`;
}

function renderRouteShell(baseHtml, route) {
  const clean = stripManagedHead(baseHtml);
  return clean
    .replace('</head>', `${metadataFor(route)}\n  </head>`)
    .replace('<div id="root"></div>', fallbackFor(route));
}

function writeSitemap(rootDir, outDir) {
  const entries = SEO_ROUTES.filter((route) => route.indexable).map((route) => {
    const lastmod = newestCommitDate(rootDir, route.sourceFiles || []);
    return `  <url>\n    <loc>${escapeHtml(route.canonical)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}\n  </url>`;
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;
  fs.writeFileSync(path.join(outDir, 'sitemap.xml'), xml);
}

function writeRedirects(outDir) {
  const aliasLines = [...SEO_REDIRECTS].map(([from, to]) => `${from} ${to} 301`);
  const rewriteLines = SEO_ROUTES
    .filter((route) => !route.staticArtifact)
    .map((route) => route.path === '/' ? '/ /index.html 200' : `${route.path} ${route.path}/index.html 200`);
  fs.writeFileSync(path.join(outDir, '_redirects'), `${[...aliasLines, ...rewriteLines].join('\n')}\n`);
  fs.writeFileSync(path.join(outDir, 'seo-route-manifest.json'), `${JSON.stringify({ routes: SEO_ROUTES, redirects: Object.fromEntries(SEO_REDIRECTS) }, null, 2)}\n`);
}

function writeNotFound(outDir) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Route Not Found | Hyperion Industries</title><meta name="description" content="The requested public Hyperion route does not exist."><meta name="robots" content="noindex,nofollow"><style>body{margin:0;display:grid;min-height:100vh;place-items:center;background:#07080a;color:#f4f0e8;font:16px/1.6 system-ui,sans-serif}main{max-width:42rem;padding:2rem}a{color:#ffc72c}</style></head><body><main><p>PUBLIC ROUTE / 404</p><h1>That route is not in the public city.</h1><p>The address may be stale, private, or outside the approved public topology.</p><p><a href="/">Return to Hyperion Industries</a></p></main></body></html>\n`;
  fs.writeFileSync(path.join(outDir, '404.html'), html);
}

export function generateSeoArtifacts({ rootDir = defaultRoot, outDir = path.join(rootDir, 'dist') } = {}) {
  const basePath = path.join(outDir, 'index.html');
  if (!fs.existsSync(basePath)) throw new Error(`Missing Vite output: ${basePath}`);
  const baseHtml = fs.readFileSync(basePath, 'utf8');

  for (const route of SEO_ROUTES) {
    if (route.staticArtifact) continue;
    const destination = route.path === '/'
      ? basePath
      : path.join(outDir, route.path.slice(1), 'index.html');
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, renderRouteShell(baseHtml, route));
  }

  writeSitemap(rootDir, outDir);
  writeRedirects(outDir);
  writeNotFound(outDir);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  generateSeoArtifacts();
}
