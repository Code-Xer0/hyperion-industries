import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildCardStudioSubmission,
  createCardDocument,
  evaluateCardPreflight,
  normalizeCardDocument,
  stableFingerprint,
  updateDocumentPath,
} from './cardStudioModel.js';

test('the default document has a deterministic preflight-ready proof', () => {
  const document = createCardDocument();
  const first = stableFingerprint(document);
  const second = stableFingerprint(normalizeCardDocument(document));
  assert.equal(first, second);
  assert.equal(evaluateCardPreflight(document).status, 'PREFLIGHT READY');
});

test('visible contact fields fail closed when invalid', () => {
  let document = createCardDocument();
  document = updateDocumentPath(document, 'contact', 'email', 'not-an-email');
  document = updateDocumentPath(document, 'contact', 'phone', '12');
  const preflight = evaluateCardPreflight(document);
  assert.equal(preflight.ready, false);
  assert.equal(preflight.blockers.length, 2);
});

test('submission payload remains held for review and cannot imply checkout', () => {
  const document = createCardDocument();
  const payload = buildCardStudioSubmission(document, true, 'intent-123');
  assert.equal(payload.schema_version, 'card-studio-order/1');
  assert.equal(payload.posture.status, 'HELD FOR REVIEW');
  assert.equal(payload.posture.checkout_created, false);
  assert.equal(payload.idempotency_key, 'intent-123');
});
