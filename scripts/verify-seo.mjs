import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { SEO_REDIRECTS, SEO_ROUTES } from '../src/data/seoRoutes.js';
import { assertSafePublicProjection, buildPublicRetrievalManifest } from './public-retrieval.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(rootDir, 'dist');
const failures = [];
const titles = new Map();
const canonicals = new Map();
const fail = (message) => failures.push(message);
const readRoute = (route) => fs.readFileSync(route.path === '/'
  ? path.join(outDir, 'index.html')
  : path.join(outDir, route.path.slice(1), 'index.html'), 'utf8');

for (const route of SEO_ROUTES) {
  const file = route.path === '/' ? path.join(outDir, 'index.html') : path.join(outDir, route.path.slice(1), 'index.html');
  if (!fs.existsSync(file)) {
    fail(`${route.path}: missing ${path.relative(rootDir, file)}`);
    continue;
  }
  const html = readRoute(route);
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1];
  const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1];
  const description = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)?.[1];
  const robots = html.match(/<meta\s+name="robots"\s+content="([^"]+)"/i)?.[1];
  if (!title) fail(`${route.path}: missing title`);
  if (!description) fail(`${route.path}: missing description`);
  if (canonical !== route.canonical) fail(`${route.path}: canonical ${canonical || 'missing'} != ${route.canonical}`);
  if (route.indexable && !robots?.startsWith('index,follow')) fail(`${route.path}: expected index,follow robots`);
  if (!route.indexable && robots !== 'noindex,follow') fail(`${route.path}: expected noindex,follow robots`);
  if (!html.includes('application/ld+json')) fail(`${route.path}: missing JSON-LD`);
  if (title && titles.has(title)) fail(`${route.path}: duplicate title also used by ${titles.get(title)}`);
  if (canonical && canonicals.has(canonical)) fail(`${route.path}: duplicate canonical also used by ${canonicals.get(canonical)}`);
  if (title) titles.set(title, route.path);
  if (canonical) canonicals.set(canonical, route.path);
}

const sitemap = fs.readFileSync(path.join(outDir, 'sitemap.xml'), 'utf8');
const actualUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]).sort();
const expectedUrls = SEO_ROUTES.filter((route) => route.indexable).map((route) => route.canonical).sort();
if (JSON.stringify(actualUrls) !== JSON.stringify(expectedUrls)) fail('sitemap.xml does not exactly match the indexable canonical registry');
if (sitemap.includes('<priority>')) fail('sitemap.xml contains manual priority values');
if (!sitemap.includes('xmlns:image=')) fail('sitemap.xml is missing the image sitemap namespace');
for (const route of SEO_ROUTES.filter((entry) => entry.indexable && entry.ogImage && !entry.ogImage.endsWith('hyperion-link-preview.jpeg'))) {
  if (!sitemap.includes(`<loc>${route.canonical}</loc>`) || !sitemap.includes(new URL(route.ogImage, route.canonical).href)) {
    fail(`${route.path}: route-owned image is missing from sitemap.xml`);
  }
}

const publicManifestPath = path.join(outDir, 'seo-route-manifest.json');
const retrievalManifestPath = path.join(outDir, 'public-retrieval-manifest.json');
const publicManifestText = fs.readFileSync(publicManifestPath, 'utf8');
const retrievalManifestText = fs.readFileSync(retrievalManifestPath, 'utf8');
if (publicManifestText !== retrievalManifestText) fail('public retrieval manifests have drifted');
const publicManifest = JSON.parse(publicManifestText);
try { assertSafePublicProjection(publicManifest); } catch (error) { fail(error.message); }
const expectedManifest = buildPublicRetrievalManifest({ rootDir });
if (JSON.stringify(publicManifest) !== JSON.stringify(expectedManifest)) fail('public retrieval manifest does not match the canonical projection');
if (!fs.readFileSync(path.join(outDir, 'llms.txt'), 'utf8').includes(publicManifest.sha256)) fail('llms.txt does not reference the current public manifest hash');

const rootHtml = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
const initialScript = rootHtml.match(/<script[^>]+type="module"[^>]+src="([^"]+)"/)?.[1];
const initialCss = rootHtml.match(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/)?.[1];
const gzipKb = (file) => gzipSync(fs.readFileSync(file)).byteLength / 1024;
if (!initialScript) fail('homepage initial JavaScript asset could not be resolved');
else if (gzipKb(path.join(outDir, initialScript.replace(/^\//, ''))) > 140) fail('homepage initial JavaScript exceeds 140 KB gzip');
if (!initialCss) fail('homepage shared CSS asset could not be resolved');
else if (gzipKb(path.join(outDir, initialCss.replace(/^\//, ''))) > 35) fail('homepage shared CSS exceeds 35 KB gzip');
for (const asset of fs.readdirSync(path.join(outDir, 'assets')).filter((name) => name.endsWith('.js'))) {
  const publicPath = `/assets/${asset}`;
  if (publicPath === initialScript) continue;
  if (gzipKb(path.join(outDir, 'assets', asset)) > 80) fail(`${asset}: asynchronous JavaScript exceeds 80 KB gzip`);
}

const notFound = fs.readFileSync(path.join(outDir, '404.html'), 'utf8');
if (!notFound.includes('noindex,nofollow')) fail('404.html is not noindex,nofollow');
if (notFound.includes('/src/main.jsx')) fail('404.html is still the SPA homepage shell');

for (const [alias, target] of SEO_REDIRECTS) {
  if (!SEO_ROUTES.some((route) => route.path === target)) fail(`${alias}: redirect target ${target} is not canonical`);
  if (SEO_REDIRECTS.has(target)) fail(`${alias}: redirect chain continues through ${target}`);
}

if (failures.length) {
  console.error(`SEO verification failed (${failures.length}):\n- ${failures.join('\n- ')}`);
  process.exit(1);
}

console.log(`SEO verification passed: ${SEO_ROUTES.length} route shells, ${expectedUrls.length} sitemap URLs, ${SEO_REDIRECTS.size} redirects.`);
