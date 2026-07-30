import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CARD_ARTIFACT_CATALOG,
  CARD_EXAMPLE_CATALOG,
  CARD_TEMPLATE_CATALOG,
} from '../../../shared/card-studio/studio-catalog.js';
import {
  addArtifactLayer,
  createCardDocument,
  evaluateCardPreflight,
  updateLayer,
} from './cardStudioModel.js';
import {
  archiveDraft,
  createDraft,
  deleteDraft,
  duplicateDraft,
  migrateLegacyDraft,
  readDraftShelf,
  renameDraft,
  writeDraftShelf,
} from './cardStudioDrafts.js';
import { buildWorkerDesignDocument } from './cardStudioSubmission.js';

class MemoryStorage {
  values = new Map();

  getItem(key) { return this.values.get(key) || null; }

  setItem(key, value) { this.values.set(key, String(value)); }

  removeItem(key) { this.values.delete(key); }
}

test('the public studio ships the approved catalog counts and privacy posture', () => {
  assert.equal(CARD_TEMPLATE_CATALOG.items.length, 20);
  assert.equal(CARD_EXAMPLE_CATALOG.items.length, 12);
  assert.equal(CARD_ARTIFACT_CATALOG.items.length, 48);
  assert.deepEqual(CARD_ARTIFACT_CATALOG.packs.map((pack) => pack.count), [12, 8, 8, 8, 6, 6]);
  assert.ok(CARD_EXAMPLE_CATALOG.items.every((item) => item.demo));
  assert.equal(CARD_EXAMPLE_CATALOG.items.filter((item) => item.operator_demo).length, 2);
  for (const item of CARD_EXAMPLE_CATALOG.items.filter((example) => !example.operator_demo)) {
    assert.match(`${item.fields.email} ${item.fields.website}`, /\.example/);
  }
});

test('all twenty templates compile to front and back durable artboards', () => {
  for (const template of CARD_TEMPLATE_CATALOG.items) {
    const design = buildWorkerDesignDocument(
      createCardDocument(template.id),
      'csp_abcdefghijkl',
      'card_pvc_standard',
      { documentId: 'cdd_abcdefghijkl', now: '2026-07-28T12:00:00.000Z' },
    );
    assert.equal(design.template_id, `template_${template.id}`);
    assert.deepEqual(design.artboards.map((artboard) => artboard.side), ['front', 'back']);
    assert.notEqual(design.preflight.state, 'failed', template.id);
  }
});

test('legacy draft migration writes v2 before leaving the old record in place', () => {
  const storage = new MemoryStorage();
  const legacy = createCardDocument('operator');
  storage.setItem('hyperion.card-studio.draft.v1', JSON.stringify(legacy));
  const shelf = migrateLegacyDraft(storage);
  assert.equal(shelf.drafts.length, 1);
  assert.equal(shelf.drafts[0].schema_version, 'card-studio-draft/2');
  assert.ok(storage.getItem('hyperion.card-studio.drafts.v2'));
  assert.ok(storage.getItem('hyperion.card-studio.draft.v1'));
});

test('draft writes fail closed without deleting the legacy recovery record', () => {
  const legacy = createCardDocument('operator');
  const storage = {
    getItem(key) {
      return key === 'hyperion.card-studio.draft.v1' ? JSON.stringify(legacy) : null;
    },
    setItem() {
      throw new Error('quota_exceeded');
    },
    removeItem() {
      throw new Error('legacy_record_must_be_retained');
    },
  };
  assert.equal(writeDraftShelf({ schema_version: 'card-studio-draft-shelf/1', active_draft_id: null, drafts: [] }, storage), false);
  assert.equal(migrateLegacyDraft(storage).drafts.length, 0);
  assert.ok(storage.getItem('hyperion.card-studio.draft.v1'));
});

test('draft shelf supports create, rename, duplicate, archive, restore, and delete', () => {
  const storage = new MemoryStorage();
  let shelf = readDraftShelf(storage);
  const created = createDraft(shelf, 'axis');
  shelf = renameDraft(created.shelf, created.draft.draft_id, 'Advisory card');
  assert.equal(shelf.drafts[0].draft_name, 'Advisory card');
  shelf = duplicateDraft(shelf, created.draft.draft_id);
  assert.equal(shelf.drafts.length, 2);
  const duplicateId = shelf.active_draft_id;
  shelf = archiveDraft(shelf, duplicateId);
  assert.equal(shelf.drafts.find((draft) => draft.draft_id === duplicateId).archived, true);
  shelf = archiveDraft(shelf, duplicateId, false);
  assert.equal(shelf.drafts.find((draft) => draft.draft_id === duplicateId).archived, false);
  shelf = deleteDraft(shelf, duplicateId);
  assert.equal(shelf.drafts.length, 1);
  assert.equal(writeDraftShelf(shelf, storage), true);
});

test('draft shelf fails closed at twenty-four device-local drafts', () => {
  let shelf = { schema_version: 'card-studio-draft-shelf/1', active_draft_id: null, drafts: [] };
  for (let index = 0; index < 24; index += 1) shelf = createDraft(shelf, 'ivory').shelf;
  assert.throws(() => createDraft(shelf, 'ivory'), /draft_limit_reached/);
});

test('normalized geometry updates and artifact placement remain bounded', () => {
  let document = createCardDocument('vector');
  document = updateLayer(document, 'layer_identity', { x: 9, y: -3, width: 4, height: 0 });
  const identity = document.layers.find((layer) => layer.id === 'layer_identity');
  assert.deepEqual(
    [identity.x, identity.y, identity.width, identity.height],
    [1, 0, 1, 0.02],
  );
  document = addArtifactLayer(document, 'csa_builtin_badge_verified', 'front');
  assert.ok(document.layers.some((layer) => layer.artifact_id === 'csa_builtin_badge_verified'));
});

test('preflight catches safe area, minimum type and QR, contrast, collision, hidden contact, and tampering', () => {
  let document = createCardDocument('ivory');
  document.visibility = { ...document.visibility, email: false, phone: false, website: false };
  document.style = { ...document.style, surface: '#111111', ink: '#111111' };
  document.layers = document.layers.map((layer) => {
    if (layer.id === 'layer_identity') return { ...layer, x: 0, y: 0, height: 0.1 };
    if (layer.id === 'layer_contact') return { ...layer, x: 0.05, y: 0.05, width: 0.5, height: 0.2 };
    if (layer.id === 'layer_qr') return { ...layer, width: 0.1, height: 0.12 };
    if (layer.kind === 'artifact') return { ...layer, artifact_checksum: 'sha256:tampered' };
    return layer;
  });
  const preflight = evaluateCardPreflight(document);
  assert.ok(preflight.blockers.some((item) => item.includes('QR signal')));
  assert.ok(preflight.blockers.some((item) => item.includes('Identity text')));
  assert.ok(preflight.blockers.some((item) => item.includes('contrast')));
  assert.ok(preflight.blockers.some((item) => item.includes('checksum')));
  assert.ok(preflight.warnings.some((item) => item.includes('safe area')));
  assert.ok(preflight.warnings.some((item) => item.includes('overlaps')));
  assert.ok(preflight.warnings.some((item) => item.includes('No direct contact')));
});

test('stale example checksum remains an explicit blocker', () => {
  const document = createCardDocument('example-axis-consulting');
  document.starter_checksum = 'sha256:stale';
  assert.ok(evaluateCardPreflight(document).blockers.some((item) => item.includes('stale or incompatible')));
});
