import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import {
  COMPONENT_STUDIES,
  partMediaPresentation,
  partReview,
} from './partContextModel.js';

test('every Forge role has a same-origin non-authoritative component study', () => {
  assert.equal(Object.keys(COMPONENT_STUDIES).length, 8);
  for (const path of Object.values(COMPONENT_STUDIES)) {
    assert.match(path, /^\/assets\/forge\/component-studies-v1\/[a-z]+\.webp$/);
    assert.equal(path.includes('://'), false);
  }
});

test('exact media is accepted only with revision, rights, and customer-safe posture', () => {
  const item = {
    part_revision_id: 'REV-1',
    category: 'gpu',
    manufacturer: 'Example',
    model: 'Card',
    media_assets: [{
      path: '/assets/forge/licensed/card.webp',
      part_revision_id: 'REV-1',
      exact_product: true,
      publication_posture: 'customer_safe',
      commercial_use_status: 'approved',
    }],
  };
  assert.equal(partMediaPresentation(item).posture, 'licensed_exact_product');
  assert.equal(partMediaPresentation({ ...item, part_revision_id: 'REV-2' }).posture, 'illustrative_non_authoritative');
  assert.equal(partMediaPresentation({ ...item, media_assets: [{ ...item.media_assets[0], path: 'https://example.com/card.webp' }] }).posture, 'illustrative_non_authoritative');
});

test('review blurbs are deterministic spec summaries and preserve unknown posture', () => {
  const item = { category: 'gpu', specs: { length_mm: 305, power_w: 285 }, price: { freshness: 'unknown' } };
  const first = partReview(item, { fit: 'browser_preview', authority: 'browser_preview' }, { priority: 'compact' });
  const second = partReview(item, { fit: 'browser_preview', authority: 'browser_preview' }, { priority: 'compact' });
  assert.deepEqual(first, second);
  assert.equal(first.posture, 'deterministic_spec_summary');
  assert.match(first.watchOut, /availability signal/i);
});

test('component study manifest matches every published binary', () => {
  const manifest = JSON.parse(readFileSync(
    new URL('../../../public/assets/forge/component-studies-v1/manifest.json', import.meta.url),
    'utf8',
  ));
  assert.equal(manifest.authority.posture, 'illustrative_non_authoritative');
  assert.equal(manifest.authority.exact_product_identity, false);
  assert.equal(manifest.assets.length, 8);
  for (const asset of manifest.assets) {
    const bytes = readFileSync(new URL(`../../../public${asset.path}`, import.meta.url));
    assert.equal(bytes.byteLength, asset.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256);
  }
});
