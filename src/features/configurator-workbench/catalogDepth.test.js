import assert from 'node:assert/strict';
import test from 'node:test';
import { FORGE_CONFIGURATOR_FALLBACK } from '../../data/configuratorFallbacks.js';
import { reconcileCatalog } from './catalogRefreshModel.js';

test('degraded Forge catalog remains broad, unique, and explicitly fixture-only', () => {
  const { items, pagination } = FORGE_CONFIGURATOR_FALLBACK;
  assert.equal(items.length, 97);
  assert.equal(pagination.total, items.length);
  assert.equal(new Set(items.map((item) => item.forge_part_id)).size, items.length);
  for (const role of ['cpu', 'motherboard', 'memory', 'gpu', 'storage', 'case', 'cooler', 'psu']) {
    assert.ok(items.filter((item) => item.category === role).length >= 10, `${role} should have at least ten choices`);
  }
  assert.ok(items.every((item) => item.data_origin === 'sanitized_fixture'));
  assert.ok(items.every((item) => item.price.not_a_quote === true));
});

test('availability refresh retains a selected part that disappears from the current feed', () => {
  const selected = FORGE_CONFIGURATOR_FALLBACK.items[0];
  const incoming = FORGE_CONFIGURATOR_FALLBACK.items.slice(1, 5);
  const reconciled = reconcileCatalog(
    FORGE_CONFIGURATOR_FALLBACK.items,
    incoming,
    { [selected.category]: selected.forge_part_id },
    '2026-07-30T12:00:00Z',
  );
  const retained = reconciled.find((item) => item.forge_part_id === selected.forge_part_id);
  assert.equal(retained.lifecycle_state, 'unavailable');
  assert.equal(retained.price.availability, 'unavailable');
  assert.equal(retained.price.freshness, 'stale');
  assert.equal(retained.source_posture, 'availability_changed');
});
