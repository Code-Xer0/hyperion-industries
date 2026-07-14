import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEO_REDIRECTS, SEO_ROUTES } from '../src/data/seoRoutes.js';

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
