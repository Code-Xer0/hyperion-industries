import assert from 'node:assert/strict';
import test from 'node:test';
import { createCardDocument } from './cardStudioModel.js';
import {
  buildWorkerDesignDocument,
  buildWorkerOrderIntent,
  submitCardStudioBrief,
} from './cardStudioSubmission.js';

const PROJECT = 'csp_abcdefghijkl';
const REVISION = 'csr_abcdefghijkl';

test('native editor compiles into the durable Worker contracts', () => {
  const document = createCardDocument();
  const design = buildWorkerDesignDocument(document, PROJECT, 'card_pvc_standard', {
    documentId: 'cdd_abcdefghijkl',
    now: '2026-07-27T12:00:00.000Z',
  });
  assert.equal(design.contract_version, 'card-design-document/1');
  assert.equal(design.project_id, PROJECT);
  assert.equal(design.template_id, 'template_ivory');
  assert.equal(design.preflight.state, 'passed');
  assert.deepEqual(design.asset_refs, [
    'csa_builtin_divider_double',
    'csa_builtin_layout_identity_stack',
  ]);
  assert.equal(design.artboards[0].elements.filter((element) => element.kind === 'asset').length, 2);

  const intent = buildWorkerOrderIntent(PROJECT, REVISION, document, {
    productSku: 'card_pvc_standard',
    quantity: 1,
    proofApproved: true,
  }, {
    intentId: 'coi_abcdefghijkl',
    now: '2026-07-27T12:00:00.000Z',
  });
  assert.equal(intent.contract_version, 'card-order-intent/1');
  assert.equal(intent.proof_approved, true);
  assert.equal(intent.product_sku, 'card_pvc_standard');
});

test('submission stages project, immutable revision, and proposal in order', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    if (url.endsWith('/projects')) {
      return Response.json({
        ok: true,
        project: { project_id: PROJECT },
        session_token: 'css_abcdefghijkl',
      }, { status: 201 });
    }
    if (url.endsWith('/revisions')) {
      return Response.json({
        ok: true,
        revision: { revision_id: REVISION },
      }, { status: 201 });
    }
    return Response.json({
      ok: true,
      receipt: {
        proposal_id: 'cdp_abcdefghijkl',
        eligibility: 'instant_checkout_eligible',
        checkout_created: false,
      },
    }, { status: 201 });
  };

  try {
    const result = await submitCardStudioBrief(createCardDocument(), {
      consent: true,
      proofApproved: true,
      productSku: 'card_pvc_standard',
      quantity: 1,
    }, {
      endpoint: '/api/card-studio',
      accountRef: 'acct_abcdefghijkl',
      idempotencyKey: 'idempotency-key-abcdefghijkl',
    });

    assert.equal(calls.length, 3);
    assert.match(calls[0].url, /\/projects$/);
    assert.match(calls[1].url, /\/revisions$/);
    assert.match(calls[2].url, /\/submit$/);
    assert.deepEqual(JSON.parse(calls[0].init.body), { account_ref: 'acct_abcdefghijkl' });
    assert.equal(calls[1].init.headers['x-card-session'], 'css_abcdefghijkl');
    assert.equal(calls[2].init.headers['idempotency-key'], 'idempotency-key-abcdefghijkl');
    assert.equal(result.reference, 'cdp_abcdefghijkl');
    assert.equal(result.receipt.checkout_created, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
