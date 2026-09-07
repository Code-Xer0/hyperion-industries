import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { deriveForgeBuildCandidatesProjection, sha256CanonicalDocument } from '../shared/intake/forge-build-candidates.js';

// This smoke creates one synthetic, review-only intake in the local Compose D1.
// It deliberately has no configurable remote host or production credentials.
const origin = `http://localhost:${process.env.HYPERION_SITE_PORT || '8080'}`;
assert.match(origin, /^http:\/\/localhost:[0-9]{2,5}$/);
const root = fileURLToPath(new URL('../', import.meta.url));
const request = (path, init = {}) => fetch(new URL(path, origin), {
  ...init, redirect: 'error', signal: AbortSignal.timeout(15000),
});

for (const route of ['/', '/forge/configurator', '/card-studio', '/card-studio/design']) {
  const response = await request(route);
  assert.equal(response.status, 200, route);
  assert.match(response.headers.get('content-type'), /text\/html/);
  await response.text();
}
const guide = await request('/api/forge/guide');
assert.equal(guide.status, 200);
assert.equal((await guide.json()).schema_version, 'forge-guide-edge-response/1');
const products = await request('/api/forge/products');
assert.equal(products.status, 200);
assert.ok((await products.json()).items.length > 0);
const status = await (await request('/api/intake/status')).json();
assert.equal(status.readiness.storage, 'ready');
assert.equal(status.readiness.acknowledgement, 'configuration_required');
const commerce = await (await request('/api/commerce/readiness')).json();
assert.equal(commerce.release_state, 'payments_not_yet_active');
assert.equal(commerce.operations.founder_command_intake, 'configuration_required');
assert.equal(commerce.operations.founder_command_commerce, 'configuration_required');
const catalog = await request('/api/card-studio/catalog');
assert.equal(catalog.status, 200);
await catalog.json();
const feed = await request('/api/intake/operator/feed');
assert.ok([401, 503].includes(feed.status), 'operator feed must remain unavailable without credentials');
await feed.text();

const suffix = randomUUID().replaceAll('-', '');
const at = new Date().toISOString();
const guideHash = 'a'.repeat(64);
const requirements = {
  schema_version: 'forge-requirements/1', source: 'forge-guide-session/1',
  workload_profile: 'gaming', operational_lane: 'fast_validated', workload_refs: ['fortnite'],
  budget: { currency: 'USD', parts_ceiling_minor: 400000 }, cooling_mode: 'any',
  allowed_motherboard_form_factors: ['Micro-ATX', 'ATX'], fresh_offer_required: true,
  unknown_policy: 'review', required_parts: [], excluded_parts: [],
  priorities: { workload_fit: 5, cost: 4, power_headroom: 3, evidence: 5, serviceability: 4, compactness: 5, upgradeability: 2, acoustics: 2 },
  inference: [{ field: 'workload_profile', reason_code: 'destination_mapping', confidence_basis_points: 9000 }],
  unresolved: [{ field: 'output_target', reason_code: 'requires_clarification' }],
  operator_notes: [], requested_counterfactuals: ['smaller'],
};
const projection = { ...requirements, projection_hash: await sha256CanonicalDocument(requirements) };
const candidates = await deriveForgeBuildCandidatesProjection({
  guide_bundle_hash: guideHash, requirements_projection: projection, generated_at: at,
});
const submission = {
  intake_id: `int_${suffix}`, session_id: `ses_${suffix}`, submission_id: `sub_${suffix}`,
  revision: 1, supersedes_submission_id: null, form_id: 'forge-configurator', form_version: '2.0.0',
  locale: 'en-US', submitted_at: at, trace_id: `docker-${suffix}`, client_reviewed: true,
  identity: { contact_name: 'Docker Acceptance Demo', email: 'docker-smoke@hyperion.example', organization: 'LOCAL TEST', phone: null },
  answers: Object.entries({
    'forge.system_type': 'desktop', 'forge.outcome': 'LOCAL SYNTHETIC TEST - no customer or order',
    'forge.local_first': 'yes', 'forge.budget': '2500_4000', 'forge.timeline': 'flexible',
  }).map(([question_id, value]) => ({ question_id, value, answered_at: at, source: 'client', data_classification: 'client_confidential' })),
  artifacts: [],
  consents: ['process_intake', 'automated_classification'].map(consent_id => ({ consent_id, notice_version: '1.0.1', granted: true, recorded_at: at })),
  client_context: {
    entry_url: `${origin}/forge/configurator`, entry_path: '/forge/configurator', source_surface: 'docker-smoke',
    referrer_category: 'direct', effects_mode: 'static', save_resume_used: false,
    guide_mode: 'express', guide_bundle_hash: guideHash, question_graph_version: 'forge-concierge-2026.07-v1',
    guide_session_hash: 'b'.repeat(64), recommendation_reason_codes: ['destination.gaming', 'counterfactual.smaller'],
    unresolved_items: ['output_target'], requested_counterfactuals: ['smaller'],
    guide_requirements_projection: projection, guide_build_candidates_projection: candidates,
  },
};
const submit = () => request('/api/intake/submissions', {
  method: 'POST', headers: { 'content-type': 'application/json', origin, 'sec-fetch-site': 'same-origin', 'idempotency-key': `docker-${suffix}` },
  body: JSON.stringify(submission),
});
const first = await submit();
const accepted = await first.json();
assert.equal(first.status, 201, JSON.stringify(accepted));
assert.equal(accepted.receipt.primary_route, 'forge');
assert.equal(accepted.receipt.status, 'received for operator review');
assert.match(accepted.receipt.revision_hash, /^[a-f0-9]{64}$/);
const replay = await submit();
assert.equal(replay.status, 200);
const repeated = await replay.json();
assert.equal(repeated.duplicate, true);
assert.deepEqual(repeated.receipt, accepted.receipt);

if (process.argv.includes('--restart')) {
  execFileSync('docker', ['compose', 'restart', 'operator-worker'], { cwd: root, stdio: 'inherit', timeout: 60000 });
  execFileSync('docker', ['compose', 'up', '-d', '--no-build', '--wait', '--wait-timeout', '120'], { cwd: root, stdio: 'inherit', timeout: 150000 });
  const afterRestart = await submit();
  assert.equal(afterRestart.status, 200);
  const restored = await afterRestart.json();
  assert.equal(restored.duplicate, true);
  assert.deepEqual(restored.receipt, accepted.receipt);
}
console.log(JSON.stringify({
  result: 'passed', origin, submission_id: submission.submission_id,
  receipt_id: accepted.receipt.receipt_id, revision_hash: accepted.receipt.revision_hash,
  idempotent_replay: true, restart_persistence: process.argv.includes('--restart'),
  payments: commerce.release_state, founder_command: 'not_connected_local_preview',
}, null, 2));
