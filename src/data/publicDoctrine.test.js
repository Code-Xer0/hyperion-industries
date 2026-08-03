import test from 'node:test';
import assert from 'node:assert/strict';
import { PUBLIC_DOCTRINE, authorityContract } from './publicDoctrine.js';
import { cityRoutes } from './publicCity.js';

test('public doctrine preserves the authority-bound invariant', () => {
  assert.equal(
    PUBLIC_DOCTRINE.principle,
    'Facts are source-bound. Meaning is context-bound. Actions are authority-bound.',
  );
  assert.deepEqual(
    PUBLIC_DOCTRINE.invariant.map((step) => step.id),
    ['capture', 'provenance', 'context', 'authority', 'route'],
  );
});

test('every public City district declares an authority contract', () => {
  for (const district of cityRoutes) {
    assert.equal(typeof district.authority?.source, 'string', `${district.id} needs a source boundary`);
    assert.equal(typeof district.authority?.context, 'string', `${district.id} needs a context boundary`);
    assert.equal(typeof district.authority?.action, 'string', `${district.id} needs an action boundary`);
    assert.ok(district.authority.source.length > 20);
    assert.ok(district.authority.context.length > 20);
    assert.ok(district.authority.action.length > 20);
  }
});

test('the default contract never grants public execution authority', () => {
  const contract = authorityContract();
  assert.match(contract.action, /operator review/i);
  assert.doesNotMatch(contract.action, /automatic|autonomous execution/i);
});

test('public district posture does not use an unverified enterprise claim', () => {
  for (const district of cityRoutes) {
    assert.doesNotMatch(`${district.status} ${district.summary}`, /enterprise poc/i);
  }
});
