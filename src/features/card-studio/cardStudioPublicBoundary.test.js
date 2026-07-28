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
