import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import {
  CONFIGURATOR_VISUALS,
  VISUAL_AUTHORITY,
  assemblyState,
  partVisualAriaLabel,
  visualForLane,
} from './configuratorVisualModel.js';

test('every configurator visual is same-origin and explicitly non-authoritative', () => {
  for (const visual of Object.values(CONFIGURATOR_VISUALS)) {
    assert.match(visual.asset, /^\/assets\/forge\/visuals-v2\/[a-z0-9-]+\.png$/);
    assert.equal(visual.asset.includes('://'), false);
    assert.match(visual.alt, /^Illustrative /);
  }
  assert.equal(VISUAL_AUTHORITY.posture, 'illustrative_non_authoritative');
  assert.equal(VISUAL_AUTHORITY.affects_compatibility, false);
  assert.equal(VISUAL_AUTHORITY.affects_ranking, false);
  assert.equal(VISUAL_AUTHORITY.affects_pricing, false);
});

test('lane lookup has a deterministic Forge fallback', () => {
  assert.equal(visualForLane('rackworks'), CONFIGURATOR_VISUALS.rackworks);
  assert.equal(visualForLane('unknown'), CONFIGURATOR_VISUALS.forge);
});

test('assembly state uses integer basis points and stable role order', () => {
  assert.deepEqual(
    assemblyState(['cpu', 'gpu', 'psu'], { cpu: { id: '1' }, psu: { id: '2' } }),
    {
      nodes: [
        { role: 'cpu', order: 1, selected: true },
        { role: 'gpu', order: 2, selected: false },
        { role: 'psu', order: 3, selected: true },
      ],
      selectedCount: 2,
      totalCount: 3,
      progressBasisPoints: 6667,
      complete: false,
    },
  );
});

test('part visual accessible copy never implies exact product photography', () => {
  assert.equal(
    partVisualAriaLabel('network_switch', { manufacturer: 'Fixture', model: 'Fabric 8' }),
    'Illustrative network switch proxy for Fixture Fabric 8; not an exact product image',
  );
});

test('published concept assets match the truthful visual manifest', () => {
  const manifest = JSON.parse(readFileSync(
    new URL('../../../public/assets/forge/visuals-v2/manifest.json', import.meta.url),
    'utf8',
  ));
  assert.equal(manifest.authority.posture, 'illustrative_non_authoritative');
  assert.equal(manifest.authority.affects_part_identity, false);
  assert.equal(manifest.assets.length, 3);
  for (const asset of manifest.assets) {
    const bytes = readFileSync(new URL(`../../../public${asset.path}`, import.meta.url));
    assert.equal(bytes.byteLength, asset.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256);
    assert.equal(asset.exact_product_geometry, false);
  }
});
