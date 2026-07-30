import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assessOrderReadiness,
  buildOrderSubmission,
  sha256Document,
} from './orderReadinessModel.js';

test('readiness blocks incomplete or incompatible systems', () => {
  const result = assessOrderReadiness({
    roles: ['cpu', 'gpu'],
    selectedIds: { cpu: 'cpu-1' },
    issues: [{ code: 'power' }],
    sourcePosture: 'bundled_fixture_fallback',
    runtimeState: 'idle',
    pricedCount: 1,
  });
  assert.equal(result.canStage, false);
  assert.equal(result.blockingCount, 2);
  assert.equal(result.sourceClass, 'fixture_or_fallback');
});

test('readiness permits a truthful held-review handoff with unresolved live pricing', () => {
  const result = assessOrderReadiness({
    roles: ['cpu', 'gpu'],
    selectedIds: { cpu: 'cpu-1', gpu: 'gpu-1' },
    issues: [],
    sourcePosture: 'bundled_fixture_fallback',
    runtimeState: 'local',
    pricedCount: 2,
  });
  assert.equal(result.canStage, true);
  assert.equal(result.blockingCount, 0);
  assert.equal(result.gates.find((gate) => gate.id === 'offer_refresh').state, 'review');
  assert.equal(result.gates.find((gate) => gate.id === 'engineering_authority').state, 'review');
});

test('selection hashes are deterministic across object key order', async () => {
  const left = await sha256Document({ lane: 'forge', values: { gpu: '2', cpu: '1' } });
  const right = await sha256Document({ values: { cpu: '1', gpu: '2' }, lane: 'forge' });
  assert.equal(left, right);
});

test('submission contains the operator handoff and excludes checkout secrets', async () => {
  const payload = await buildOrderSubmission({
    attempt: {
      intake: 'int_123456789012',
      session: 'ses_123456789012',
      submission: 'sub_123456789012',
      trace: 'trc_123456789012',
      idempotency: 'idem_123456789012',
    },
    lane: 'forge',
    formId: 'forge-configurator',
    formVersion: '2.0.0',
    identity: { name: 'Test Operator', email: 'TEST@EXAMPLE.COM', organization: '' },
    fulfillment: { country: 'US', timing: 'as_soon_as_ready', mode: 'ship', marketplaceOptIn: false },
    requirements: { workload: 'gaming', budget: 250000, priority: 'balanced' },
    roles: ['cpu', 'gpu'],
    selectedIds: { cpu: 'cpu-1', gpu: 'gpu-1' },
    sourcePosture: 'bundled_fixture_fallback',
    runtime: { state: 'local', result: null },
    issues: [],
    totalMinor: 200000,
    entryUrl: 'https://hyperion-industries.dev/forge/configurator/build',
    effectsMode: 'reduced',
  });
  assert.equal(payload.form_id, 'forge-configurator');
  assert.equal(payload.identity.email, 'test@example.com');
  assert.equal(payload.client_reviewed, true);
  assert.equal(payload.artifacts.length, 0);
  assert.ok(payload.answers.find((entry) => entry.question_id === 'configurator.selection_hash').value.match(/^[a-f0-9]{64}$/));
  assert.equal(payload.answers.find((entry) => entry.question_id === 'configurator.estimated_total_minor').value, '200000');
  const serialized = JSON.stringify(payload).toLowerCase();
  for (const forbidden of ['card_number', 'pan', 'cvv', 'payment_token', 'street_address', 'merchant_credential']) {
    assert.equal(serialized.includes(forbidden), false);
  }
});
