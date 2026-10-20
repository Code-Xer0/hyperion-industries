import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { HYPERION_MEDIA_MANIFEST } from './mediaManifest.js';

const localAsset = (path) => fileURLToPath(new URL(`../../public${path}`, import.meta.url));

test('media manifest stays same-origin, measured, and poster-first', () => {
  const manifest = HYPERION_MEDIA_MANIFEST;
  assert.equal(manifest.contract_version, 'hyperion-media-manifest/1');
  assert.equal(manifest.policy.autoplay_audio, false);
  assert.equal(manifest.policy.concurrent_active_cinematics, 1);

  const assets = [manifest.assets.city_gate, manifest.assets.forge_hero, ...manifest.assets.forge];
  for (const asset of assets) {
    assert.match(asset.route, /^\//);
    assert.match(asset.poster, /^\/assets\//);
    assert.equal(asset.preload, 'none');
    assert.ok(asset.width > 0 && asset.height > 0 && asset.duration_ms > 0);
    assert.equal(asset.sources.length, 1);
    assert.equal(asset.sources[0].type, 'video/mp4');
    assert.equal(asset.sources[0].src, asset.video);
    assert.equal(statSync(localAsset(asset.video)).size, asset.video_bytes);
    assert.equal(statSync(localAsset(asset.poster)).size, asset.poster_bytes);
    assert.equal(asset.alternate_format_posture, 'poster_fallback_until_reviewed_webm_master_exists');
  }
});

test('City Gate initial media remains within the route budget', () => {
  const { city_gate: cityGate } = HYPERION_MEDIA_MANIFEST.assets;
  assert.ok(cityGate.poster_bytes + cityGate.video_bytes <= HYPERION_MEDIA_MANIFEST.policy.initial_route_media_budget_bytes);
  assert.equal(cityGate.activation, 'visible_after_first_paint');
});

test('automatic cinematic derivatives are measured and fit the route media budget', () => {
  const { assets, policy } = HYPERION_MEDIA_MANIFEST;
  for (const asset of [assets.city_gate, assets.forge_hero]) {
    assert.equal(createHash('sha256').update(readFileSync(localAsset(asset.video))).digest('hex'), asset.sha256);
    assert.ok(statSync(localAsset(asset.source_master)).size > asset.video_bytes);
  }
  assert.equal(assets.city_gate.role, 'cinematic_concept_not_product_evidence');
  assert.equal(assets.forge_hero.role, 'existing_forge_field_media');
  assert.equal(assets.forge_hero.poster_role, 'cinematic_concept_not_product_evidence');
  const forgePosters = assets.forge.reduce((total, asset) => total + asset.poster_bytes, 0);
  assert.ok(assets.forge_hero.video_bytes + assets.forge_hero.poster_bytes + forgePosters <= policy.initial_route_media_budget_bytes);
});

test('generated posters remain measured concept media rather than product proof', () => {
  for (const poster of HYPERION_MEDIA_MANIFEST.assets.generated_posters) {
    assert.equal(poster.role, 'cinematic_concept_not_product_evidence');
    assert.match(poster.sha256, /^[a-f0-9]{64}$/);
    assert.equal(poster.width, 1920);
    assert.equal(poster.height, 1080);
    assert.equal(statSync(localAsset(poster.src)).size, poster.bytes);
  }
});
