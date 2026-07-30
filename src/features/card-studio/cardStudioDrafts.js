import {
  CARD_STUDIO_DRAFT_LIMIT,
  CARD_STUDIO_SHELF_KEY,
  CARD_STUDIO_STORAGE_KEY,
  cloneCardDocument,
  createCardDocument,
  normalizeCardDocument,
} from './cardStudioModel.js';

const emptyShelf = () => ({ schema_version: 'card-studio-draft-shelf/1', active_draft_id: null, drafts: [] });

function storageOrNull(storage) {
  try {
    return storage || globalThis.localStorage || null;
  } catch {
    return null;
  }
}

export function readDraftShelf(storage) {
  const target = storageOrNull(storage);
  if (!target) return emptyShelf();
  try {
    const raw = JSON.parse(target.getItem(CARD_STUDIO_SHELF_KEY) || 'null');
    if (!raw || !Array.isArray(raw.drafts)) return migrateLegacyDraft(target);
    const drafts = raw.drafts.map(normalizeCardDocument).slice(0, CARD_STUDIO_DRAFT_LIMIT);
    return {
      schema_version: 'card-studio-draft-shelf/1',
      active_draft_id: drafts.some((draft) => draft.draft_id === raw.active_draft_id)
        ? raw.active_draft_id
        : drafts.find((draft) => !draft.archived)?.draft_id || drafts[0]?.draft_id || null,
      drafts,
    };
  } catch {
    return migrateLegacyDraft(target);
  }
}

export function writeDraftShelf(shelf, storage) {
  const target = storageOrNull(storage);
  if (!target) return false;
  try {
    const safe = {
      schema_version: 'card-studio-draft-shelf/1',
      active_draft_id: shelf.active_draft_id,
      drafts: shelf.drafts.map(normalizeCardDocument).slice(0, CARD_STUDIO_DRAFT_LIMIT),
    };
    target.setItem(CARD_STUDIO_SHELF_KEY, JSON.stringify(safe));
    return true;
  } catch {
    return false;
  }
}

export function migrateLegacyDraft(storage) {
  const target = storageOrNull(storage);
  const shelf = emptyShelf();
  if (!target) return shelf;
  try {
    const legacyRaw = target.getItem(CARD_STUDIO_STORAGE_KEY);
    if (!legacyRaw) return shelf;
    const draft = normalizeCardDocument(JSON.parse(legacyRaw));
    draft.draft_name = draft.draft_name || 'Recovered card';
    shelf.active_draft_id = draft.draft_id;
    shelf.drafts = [draft];
    if (!writeDraftShelf(shelf, target)) return emptyShelf();
    return shelf;
  } catch {
    return shelf;
  }
}

export function createDraft(shelf, starterId = 'ivory') {
  if (shelf.drafts.length >= CARD_STUDIO_DRAFT_LIMIT) throw new Error('draft_limit_reached');
  const draft = createCardDocument(starterId);
  return {
    shelf: { ...shelf, active_draft_id: draft.draft_id, drafts: [draft, ...shelf.drafts] },
    draft,
  };
}

export function saveDraft(shelf, document) {
  const draft = normalizeCardDocument(document);
  const exists = shelf.drafts.some((item) => item.draft_id === draft.draft_id);
  const drafts = exists
    ? shelf.drafts.map((item) => item.draft_id === draft.draft_id ? draft : item)
    : [draft, ...shelf.drafts].slice(0, CARD_STUDIO_DRAFT_LIMIT);
  return { ...shelf, active_draft_id: draft.draft_id, drafts };
}

export function renameDraft(shelf, draftId, name) {
  const clean = String(name || '').trim().slice(0, 80) || 'Untitled card';
  return {
    ...shelf,
    drafts: shelf.drafts.map((draft) => draft.draft_id === draftId
      ? { ...draft, draft_name: clean, updated_at: new Date().toISOString() }
      : draft),
  };
}

export function duplicateDraft(shelf, draftId) {
  if (shelf.drafts.length >= CARD_STUDIO_DRAFT_LIMIT) throw new Error('draft_limit_reached');
  const source = shelf.drafts.find((draft) => draft.draft_id === draftId);
  if (!source) return shelf;
  const duplicate = createCardDocument(source.starter_id);
  const cloned = {
    ...cloneCardDocument(source),
    draft_id: duplicate.draft_id,
    draft_name: `${source.draft_name} copy`.slice(0, 80),
    archived: false,
    revision: 1,
    created_at: duplicate.created_at,
    updated_at: duplicate.updated_at,
  };
  return { ...shelf, active_draft_id: cloned.draft_id, drafts: [cloned, ...shelf.drafts] };
}

export function archiveDraft(shelf, draftId, archived = true) {
  return {
    ...shelf,
    active_draft_id: shelf.active_draft_id === draftId
      ? shelf.drafts.find((draft) => draft.draft_id !== draftId && !draft.archived)?.draft_id || null
      : shelf.active_draft_id,
    drafts: shelf.drafts.map((draft) => draft.draft_id === draftId
      ? { ...draft, archived, updated_at: new Date().toISOString() }
      : draft),
  };
}

export function deleteDraft(shelf, draftId) {
  const drafts = shelf.drafts.filter((draft) => draft.draft_id !== draftId);
  return {
    ...shelf,
    active_draft_id: shelf.active_draft_id === draftId
      ? drafts.find((draft) => !draft.archived)?.draft_id || drafts[0]?.draft_id || null
      : shelf.active_draft_id,
    drafts,
  };
}

export function getActiveDraft(shelf) {
  return shelf.drafts.find((draft) => draft.draft_id === shelf.active_draft_id)
    || shelf.drafts.find((draft) => !draft.archived)
    || shelf.drafts[0]
    || null;
}
