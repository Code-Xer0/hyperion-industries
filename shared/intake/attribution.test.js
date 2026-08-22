import assert from 'node:assert/strict';
import test from 'node:test';
import { publicIntakeAttribution } from './attribution.js';

test('keeps source-only attribution and strips query data from the entry URL', () => {
  const result = publicIntakeAttribution(
    { href: 'https://hyperion-industries.dev/intake/continuity?source=home_inquiry&email=private%40example.test' },
    'https://hyperion-industries.dev/#inquiry',
  );
  assert.deepEqual(result, {
    entry_url: 'https://hyperion-industries.dev/intake/continuity',
    entry_path: '/intake/continuity',
    referrer_category: 'internal',
    source_surface: 'home_inquiry',
  });
});

test('classifies external navigation without retaining the referring URL', () => {
  const result = publicIntakeAttribution(
    { href: 'https://hyperion-industries.dev/forge/configurator' },
    'https://search.example/results?q=hyperion',
  );
  assert.equal(result.referrer_category, 'external');
  assert.equal(result.source_surface, 'forge.configurator');
  assert.equal(JSON.stringify(result).includes('search.example'), false);
});

test('rejects malformed source values', () => {
  const result = publicIntakeAttribution(
    { href: 'https://hyperion-industries.dev/intake/general?source=contains%20spaces' },
    '',
  );
  assert.equal(result.source_surface, 'intake.general');
});
