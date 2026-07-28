import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';

test('Card Studio public assets contain only the canonical compiled-route redirect', () => {
  const legacyFiles = existsSync('public/assets/card-studio')
    ? readdirSync('public/assets/card-studio', { recursive: true })
    : [];
  assert.deepEqual(legacyFiles, [], 'legacy Card Studio assets must not be copied into the production public tree');
  const redirect = readFileSync('public/card-studio/index.html', 'utf8');
  assert.match(redirect, /url=\/card-studio/);
  assert.doesNotMatch(redirect, /text\/babel|babel\.min\.js|react\.development\.js|__bundler\/manifest/);
});

test('Card Studio responsive grids contain intrinsic-width controls', () => {
  const css = readFileSync('src/features/card-studio/CardStudioEditor.css', 'utf8');
  assert.match(
    css,
    /\.hcs-editor > \*,\s*\.hcs-workspace > \*,\s*\.hcs-review-grid > \* \{\s*min-width: 0;\s*max-width: 100%;/s,
  );
  assert.match(
    css,
    /@media \(max-width: 620px\)[\s\S]*?\.hcs-template-grid \{[\s\S]*?min-width: 0;[\s\S]*?overflow-x: auto;/,
  );
});
