import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';

test('Card Studio public assets contain only reviewed demo media and the canonical compiled-route redirect', () => {
  const publicAssets = existsSync('public/assets/card-studio')
    ? readdirSync('public/assets/card-studio', { recursive: true }).map(String).sort()
    : [];
  const allowedAssets = [
    'demos-v2',
    'demos-v2\\manifest.json',
    'demos-v2\\marcus-hale.png',
    'demos-v2\\priya-bennett.png',
    'demos-v2\\talia-monroe.png',
  ];
  assert.deepEqual(publicAssets, allowedAssets, 'unreviewed legacy Card Studio assets must not enter the public tree');
  const manifest = JSON.parse(readFileSync('public/assets/card-studio/demos-v2/manifest.json', 'utf8'));
  assert.equal(manifest.contract, 'hyperion.card-demo-media/1');
  assert.equal(manifest.assets.length, 3);
  assert.ok(manifest.assets.every((asset) => asset.submittable === false));
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

test('Card Studio production submissions stay on the verified first-party route', () => {
  const submission = readFileSync('src/features/card-studio/cardStudioSubmission.js', 'utf8');
  assert.match(submission, /const DEFAULT_BASE_PATH = '\/api\/card-studio';/);
  assert.doesNotMatch(submission, /workers\.dev|PRODUCTION_API_ORIGIN/);
});
