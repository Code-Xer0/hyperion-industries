import { build } from 'esbuild';
import { readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = new URL('../', import.meta.url);
const publicRoot = new URL('../public/', import.meta.url);
const distRoot = new URL('../dist/', import.meta.url);

const sourceFiles = [
  'assets/card/icons.jsx',
  'assets/card/signal-field.jsx',
  'assets/card/mesh-bg.jsx',
  'assets/card/card.jsx',
  'assets/card/app.jsx',
];

const source = [
  'import React from "react";',
  'import { createRoot } from "react-dom/client";',
  'const ReactDOM = { createRoot };',
  ...await Promise.all(sourceFiles.map((path) => readFile(new URL(path, publicRoot), 'utf8'))),
].join('\n\n');

const result = await build({
  stdin: {
    contents: source,
    loader: 'jsx',
    resolveDir: fileURLToPath(projectRoot),
    sourcefile: 'operator-card-runtime.jsx',
  },
  bundle: true,
  format: 'iife',
  minify: true,
  target: ['es2020'],
  write: false,
});

const output = result.outputFiles?.[0]?.text;
if (!output) throw new Error('Operator card runtime compilation produced no output.');
await writeFile(new URL('assets/card/card-runtime.js', distRoot), output, 'utf8');

const cardHtmlPath = new URL('dxcard/index.html', distRoot);
let cardHtml = await readFile(cardHtmlPath, 'utf8');
cardHtml = cardHtml
  .replace(/\s*<script[^>]+(?:react(?:-dom)?@|@babel\/standalone)[\s\S]*?<\/script>/gi, '')
  .replace(/\s*<script[^>]+type=["']text\/babel["'][^>]*>[\s\S]*?<\/script>/gi, '')
  .replace(
    '</body>',
    '  <script defer src="/assets/card/card-runtime.js"></script>\n</body>',
  );
await writeFile(cardHtmlPath, cardHtml, 'utf8');

const compiledCardDirectory = new URL('assets/card/', distRoot);
for (const entry of await readdir(compiledCardDirectory, { withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith('.jsx')) {
    await rm(join(fileURLToPath(compiledCardDirectory), entry.name));
  }
}

// The legacy PAT editor is an operator-only tool and must never be present in
// a public deployment. The render-only embed install receipt also contains a
// machine-local source path and is not a public artifact.
await rm(new URL('edit.html', distRoot), { force: true });
await rm(new URL('operator-resident/.hyperion-operator-embed.json', distRoot), { force: true });

console.log('Compiled the operator card runtime and removed private legacy artifacts.');
