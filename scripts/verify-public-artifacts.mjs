import { readFile, readdir } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

const root = new URL('../dist/', import.meta.url);
const forbiddenExtensions = new Set(['.jsx', '.tsx', '.ts', '.map']);
const textExtensions = new Set(['.html', '.js', '.css', '.json', '.xml', '.txt']);
const forbiddenPatterns = [
  { label: 'Babel Standalone', pattern: /(?:babel(?:\.min)?\.js|@babel\/standalone|text\/babel)/i },
  { label: 'React development runtime', pattern: /react(?:-dom)?\.development(?:\.min)?\.js/i },
  { label: 'Windows user path', pattern: /[A-Za-z]:[\\/]+Users[\\/]+[^"'`\s<]+/i },
  { label: 'private workspace path', pattern: /(?:D:[\\/]+Lab|HYPERION_CONTEXT_HUB|HypRM-Founder-Command)/i },
];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
}

const distPath = root.pathname.startsWith('/') && /^[A-Za-z]:/.test(root.pathname.slice(1))
  ? decodeURIComponent(root.pathname.slice(1))
  : decodeURIComponent(root.pathname);
const files = await walk(distPath);
const failures = [];

for (const file of files) {
  const path = relative(distPath, file).replaceAll('\\', '/');
  const extension = extname(file).toLowerCase();
  if (forbiddenExtensions.has(extension)) {
    failures.push(`${path}: forbidden public source artifact (${extension})`);
    continue;
  }
  if (!textExtensions.has(extension)) continue;
  const content = await readFile(file, 'utf8');
  for (const check of forbiddenPatterns) {
    if (check.pattern.test(content)) failures.push(`${path}: contains ${check.label}`);
  }
}

const operatorCardHtml = await readFile(join(distPath, 'dxcard', 'index.html'), 'utf8');
if (!/<script defer src="\/assets\/card\/card-runtime\.js\?v=[a-f0-9]{12}"><\/script>/.test(operatorCardHtml)) {
  failures.push('dxcard/index.html: compiled operator-card runtime is not content-versioned');
}

if (failures.length) {
  console.error('Public compiled-only verification failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Public compiled-only verification passed (${files.length} artifacts inspected).`);
