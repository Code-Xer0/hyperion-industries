import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  canonicalJson,
  compileSiteContent,
  loadAndValidateSite,
  sha256,
} from './compile-site-content.mjs';

test('canonical JSON and hashes do not depend on object key order', () => {
  assert.equal(canonicalJson({ z: 1, a: { y: 2, b: 3 } }), '{"a":{"b":3,"y":2},"z":1}');
  assert.equal(sha256(canonicalJson({ b: 2, a: 1 })), sha256(canonicalJson({ a: 1, b: 2 })));
});

test('the repository site bundle validates and compiles deterministically', () => {
  const first = compileSiteContent();
  const second = compileSiteContent();
  assert.deepEqual(first.manifest, second.manifest);
  assert.equal(first.manifest.bundle_sha256, second.manifest.bundle_sha256);
});

test('code-owned route collisions are rejected', () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'hyperion-site-contract-'));
  const source = path.resolve('site-content');
  fs.cpSync(source, path.join(fixture, 'site-content'), { recursive: true });
  const page = JSON.parse(fs.readFileSync(path.join(source, 'pages', '_template.standard.json'), 'utf8'));
  page.path = '/forge/configurator/new';
  fs.writeFileSync(path.join(fixture, 'site-content', 'pages', 'collision.json'), JSON.stringify(page));
  assert.throws(() => loadAndValidateSite(fixture), /collides with code-owned route/);
});
