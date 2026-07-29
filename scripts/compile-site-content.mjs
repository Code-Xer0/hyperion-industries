import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const defaultRoot = path.resolve(scriptDir, '..');
const BLOCK_TYPES = new Set([
  'hero',
  'rich_text',
  'media',
  'media_strip',
  'card_grid',
  'cta_group',
  'stats',
  'timeline',
  'faq',
  'quote',
  'gallery',
  'divider',
]);
const TEMPLATES = new Set(['standard', 'landing', 'collection']);
const THEME_TOKEN_VALUES = Object.freeze({
  accent: new Set(['gold', 'cyan', 'red', 'purple', 'gray']),
  surface: new Set(['black', 'charcoal', 'glass']),
  text: new Set(['warm', 'neutral']),
  radius: new Set(['sharp', 'soft', 'round']),
  motion: new Set(['restrained', 'cinematic', 'none']),
});

export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

export function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`${path.basename(file)} is not valid JSON: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function assertString(value, label, { min = 1, max = Infinity, pattern } = {}) {
  assert(typeof value === 'string', `${label} must be a string`);
  assert(value.length >= min && value.length <= max, `${label} must contain ${min}-${max} characters`);
  if (pattern) assert(pattern.test(value), `${label} has an invalid format`);
}

function validateTheme(theme, sourceName) {
  assert(theme.schema_version === 'hyperion-theme/1', `${sourceName}: unsupported theme schema`);
  assertString(theme.id, `${sourceName}.id`, { pattern: /^theme_[a-z0-9-]{3,48}$/ });
  assertString(theme.label, `${sourceName}.label`, { max: 80 });
  assert(isPlainObject(theme.tokens), `${sourceName}.tokens must be an object`);
  for (const [token, allowed] of Object.entries(THEME_TOKEN_VALUES)) {
    assert(allowed.has(theme.tokens[token]), `${sourceName}.tokens.${token} is not allowlisted`);
  }
}

function validateBlock(block, sourceName, seenIds) {
  assert(isPlainObject(block), `${sourceName}: every block must be an object`);
  assertString(block.id, `${sourceName}.block.id`, { pattern: /^blk_[a-z0-9][a-z0-9-]{2,63}$/ });
  assert(!seenIds.has(block.id), `${sourceName}: duplicate block id ${block.id}`);
  seenIds.add(block.id);
  assert(BLOCK_TYPES.has(block.type), `${sourceName}.${block.id}: unsupported block type ${block.type}`);
  assert(block.version === 1, `${sourceName}.${block.id}: unsupported block version`);
  assertString(block.variant, `${sourceName}.${block.id}.variant`, { max: 48, pattern: /^[a-z][a-z0-9_-]{0,47}$/ });
  assert(isPlainObject(block.data), `${sourceName}.${block.id}.data must be an object`);
  if (block.visibility !== undefined) {
    assert(isPlainObject(block.visibility), `${sourceName}.${block.id}.visibility must be an object`);
    for (const [key, value] of Object.entries(block.visibility)) {
      assert(['desktop', 'tablet', 'mobile'].includes(key), `${sourceName}.${block.id}: unknown visibility field ${key}`);
      assert(typeof value === 'boolean', `${sourceName}.${block.id}.visibility.${key} must be boolean`);
    }
  }
}

function validatePage(page, sourceName, themeIds, reservedPaths) {
  assert(page.schema_version === 'hyperion-page/1', `${sourceName}: unsupported page schema`);
  assertString(page.id, `${sourceName}.id`, { pattern: /^page_[a-z0-9][a-z0-9-]{2,63}$/ });
  assertString(page.path, `${sourceName}.path`, { max: 96, pattern: /^\/[a-z0-9][a-z0-9/-]{0,95}$/ });
  assert(!page.path.endsWith('/'), `${sourceName}.path must not end with /`);
  assert(!page.path.includes('//'), `${sourceName}.path must not contain //`);
  assert(
    !reservedPaths.some((reserved) => page.path === reserved || page.path.startsWith(`${reserved}/`)),
    `${sourceName}.path collides with code-owned route ${page.path}`,
  );
  assert(TEMPLATES.has(page.template), `${sourceName}.template is unsupported`);
  assertString(page.title, `${sourceName}.title`, { max: 120 });
  assertString(page.description, `${sourceName}.description`, { max: 320 });
  if (page.summary !== undefined) assertString(page.summary, `${sourceName}.summary`, { min: 0, max: 500 });
  assertString(page.maturity, `${sourceName}.maturity`, { max: 96 });
  assert(typeof page.indexable === 'boolean', `${sourceName}.indexable must be boolean`);
  assert(themeIds.has(page.theme_ref), `${sourceName}.theme_ref does not resolve`);
  assert(page.og_asset === null || page.og_asset === undefined || /^\/assets\//.test(page.og_asset), `${sourceName}.og_asset must be a same-origin asset path`);
  assert(Array.isArray(page.related_paths || []), `${sourceName}.related_paths must be an array`);
  assert((page.related_paths || []).length <= 12, `${sourceName}.related_paths exceeds 12`);
  for (const relatedPath of page.related_paths || []) assert(/^\/[a-z0-9]/.test(relatedPath), `${sourceName}: invalid related path`);
  assert(Array.isArray(page.blocks) && page.blocks.length >= 1 && page.blocks.length <= 100, `${sourceName}.blocks must contain 1-100 blocks`);
  const seenIds = new Set();
  page.blocks.forEach((block) => validateBlock(block, sourceName, seenIds));
}

export function loadAndValidateSite(rootDir = defaultRoot) {
  const contentRoot = path.join(rootDir, 'site-content');
  const site = readJson(path.join(contentRoot, 'site.json'));
  assert(site.schema_version === 'hyperion-site/1', 'site.json: unsupported schema');
  assert(Array.isArray(site.reserved_paths), 'site.json: reserved_paths must be an array');
  assert(Array.isArray(site.collections), 'site.json: collections must be an array');

  const themeDir = path.join(contentRoot, 'themes');
  const themeFiles = fs.readdirSync(themeDir)
    .filter((name) => name.endsWith('.json') && !name.startsWith('_'))
    .sort();
  const themes = themeFiles.map((name) => {
    const value = readJson(path.join(themeDir, name));
    validateTheme(value, name);
    return value;
  });
  const themeIds = new Set(themes.map((theme) => theme.id));
  assert(themeIds.size === themes.length, 'Theme identifiers must be unique');
  assert(themeIds.has(site.default_theme), 'site.json: default_theme does not resolve');

  const pageDir = path.join(contentRoot, 'pages');
  const pageFiles = fs.readdirSync(pageDir)
    .filter((name) => name.endsWith('.json') && !name.startsWith('_'))
    .sort();
  const pages = pageFiles.map((name) => {
    const value = readJson(path.join(pageDir, name));
    validatePage(value, name, themeIds, site.reserved_paths);
    return value;
  });
  assert(new Set(pages.map((page) => page.id)).size === pages.length, 'Page identifiers must be unique');
  assert(new Set(pages.map((page) => page.path)).size === pages.length, 'Page paths must be unique');

  for (const collection of site.collections) {
    assert(/^[a-z][a-z0-9-]{1,47}$/.test(collection), `Invalid collection name: ${collection}`);
    const collectionPath = path.join(contentRoot, 'collections', `${collection}.json`);
    assert(fs.existsSync(collectionPath), `Missing declared collection: ${collection}.json`);
    readJson(collectionPath);
  }

  return { site, themes, pages };
}

function sourceFiles(rootDir) {
  const roots = [
    path.join(rootDir, 'contracts', 'site-builder', 'v1', 'schemas'),
    path.join(rootDir, 'site-content'),
  ];
  return roots.flatMap((root) => {
    const walk = (current) => fs.readdirSync(current, { withFileTypes: true }).flatMap((entry) => {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) return walk(absolute);
      if (!entry.name.endsWith('.json') || entry.name === 'MANIFEST.json') return [];
      return [absolute];
    });
    return walk(root);
  }).sort();
}

export function compileSiteContent({ rootDir = defaultRoot } = {}) {
  const bundle = loadAndValidateSite(rootDir);
  const sourceManifest = sourceFiles(rootDir).map((absolute) => ({
    path: path.relative(rootDir, absolute).replaceAll('\\', '/'),
    sha256: sha256(canonicalJson(readJson(absolute))),
  }));
  const bundleHash = sha256(canonicalJson(bundle));
  const manifest = {
    schema_version: 'hyperion-site-builder-manifest/1',
    bundle_sha256: bundleHash,
    page_count: bundle.pages.length,
    theme_count: bundle.themes.length,
    files: sourceManifest,
  };
  const moduleText = `// Generated by scripts/compile-site-content.mjs. Do not edit.\n`
    + `export const SITE_CONTENT_BUNDLE = Object.freeze(${JSON.stringify({ ...bundle, bundle_hash: bundleHash }, null, 2)});\n`
    + 'export const SITE_CONTENT_PAGES = SITE_CONTENT_BUNDLE.pages;\n'
    + 'export const SITE_CONTENT_PAGE_BY_PATH = new Map(SITE_CONTENT_PAGES.map((page) => [page.path, page]));\n'
    + 'export const SITE_CONTENT_THEME_BY_ID = new Map(SITE_CONTENT_BUNDLE.themes.map((theme) => [theme.id, theme]));\n';
  return {
    bundle,
    manifest,
    files: new Map([
      [path.join(rootDir, 'src', 'generated', 'siteContent.js'), moduleText],
      [path.join(rootDir, 'contracts', 'site-builder', 'v1', 'MANIFEST.json'), `${JSON.stringify(manifest, null, 2)}\n`],
      [path.join(rootDir, 'contracts', 'site-builder', 'v1', 'examples', 'page.standard.json'), `${JSON.stringify(readJson(path.join(rootDir, 'site-content', 'pages', '_template.standard.json')), null, 2)}\n`],
      [path.join(rootDir, 'contracts', 'site-builder', 'v1', 'examples', 'theme.hyperion-core.json'), `${JSON.stringify(bundle.themes[0], null, 2)}\n`],
    ]),
  };
}

function writeOrCheck({ check = false, rootDir = defaultRoot } = {}) {
  const compiled = compileSiteContent({ rootDir });
  const drift = [];
  for (const [file, content] of compiled.files) {
    if (check) {
      if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== content) {
        drift.push(path.relative(rootDir, file).replaceAll('\\', '/'));
      }
      continue;
    }
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  }
  if (drift.length) throw new Error(`Generated site-content drift: ${drift.join(', ')}`);
  return compiled;
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  const check = process.argv.includes('--check');
  const compiled = writeOrCheck({ check });
  process.stdout.write(`${check ? 'Verified' : 'Generated'} ${compiled.bundle.pages.length} governed page(s); bundle ${compiled.manifest.bundle_sha256}\n`);
}
