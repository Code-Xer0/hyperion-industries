import {
  CARD_ARTIFACT_BY_ID,
  CARD_EXAMPLE_BY_ID,
  CARD_TEMPLATE_BY_ID,
  CARD_TEMPLATE_CATALOG,
  catalogStarter,
} from '../../../shared/card-studio/studio-catalog.js';

export const CARD_STUDIO_SCHEMA = 'card-studio-draft/2';
export const CARD_STUDIO_FORM = 'card-studio-order/1';
export const CARD_STUDIO_STORAGE_KEY = 'hyperion.card-studio.draft.v1';
export const CARD_STUDIO_SHELF_KEY = 'hyperion.card-studio.drafts.v2';
export const CARD_STUDIO_DRAFT_LIMIT = 24;

const PALETTES = new Map(
  [...CARD_ARTIFACT_BY_ID.values()]
    .filter((item) => item.kind === 'palette')
    .map((item) => [item.id, item]),
);

export const CARD_TEMPLATES = Object.freeze(CARD_TEMPLATE_CATALOG.items.map((item) => {
  const palette = PALETTES.get(item.palette_id);
  return Object.freeze({
    ...item,
    tone: palette.tokens.accent,
    surface: palette.tokens.surface,
    ink: palette.tokens.ink,
  });
}));

export const TYPE_OPTIONS = Object.freeze([
  { id: 'geometric', label: 'Geometric', stack: '"Montserrat", sans-serif' },
  { id: 'editorial', label: 'Editorial', stack: 'Georgia, "Times New Roman", serif' },
  { id: 'technical', label: 'Technical', stack: '"Jura", monospace' },
]);

const defaultLayers = Object.freeze([
  { id: 'layer_identity', kind: 'identity', label: 'Identity', side: 'front', x: 0.08, y: 0.2, width: 0.62, height: 0.38, locked: false, visible: true },
  { id: 'layer_contact', kind: 'contact', label: 'Contact', side: 'front', x: 0.08, y: 0.72, width: 0.68, height: 0.12, locked: false, visible: true },
  { id: 'layer_profile', kind: 'profile', label: 'Profile destination', side: 'back', x: 0.08, y: 0.2, width: 0.48, height: 0.34, locked: false, visible: true },
  { id: 'layer_qr', kind: 'qr', label: 'QR signal', side: 'back', x: 0.66, y: 0.2, width: 0.24, height: 0.4, locked: false, visible: true },
]);

const baseDocument = Object.freeze({
  schema_version: CARD_STUDIO_SCHEMA,
  draft_id: '',
  draft_name: 'Untitled card',
  starter_id: 'ivory',
  starter_checksum: '',
  template_id: 'ivory',
  active_mode: 'front',
  editor_mode: 'basic',
  selected_layer_id: 'layer_identity',
  identity: {
    name: 'Maya Okonkwo',
    role: 'Product Designer',
    organization: 'Northbound Studio',
    initials: 'MO',
    tagline: 'Design that earns the next conversation.',
  },
  contact: {
    email: 'maya@northbound.example',
    phone: '+1 (555) 010-3318',
    website: 'northbound.example',
  },
  visibility: {
    email: true,
    phone: true,
    website: true,
    tagline: true,
  },
  style: {
    accent: '#9B5637',
    surface: '#F4EFE4',
    ink: '#211D18',
    typography: 'editorial',
    spacing: 50,
    palette_id: 'csa_builtin_palette_ivory',
  },
  sharing: {
    profile_path: 'maya-okonkwo',
    destination: 'https://northbound.example/maya',
  },
  layers: defaultLayers,
  notes: '',
  archived: false,
  revision: 1,
  created_at: null,
  updated_at: null,
});

export const DEFAULT_CARD_DOCUMENT = baseDocument;

export function cloneCardDocument(document = DEFAULT_CARD_DOCUMENT) {
  return JSON.parse(JSON.stringify(document));
}

function randomDraftId() {
  const suffix = globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID().replaceAll('-', '').slice(0, 20)
    : `${Date.now()}${Math.random().toString(16).slice(2)}`.slice(0, 20);
  return `draft_${suffix}`;
}

function initialsFor(name) {
  return String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'ID';
}

function artifactLayer(artifact, index, side = artifact.compatible_sides[0]) {
  return {
    id: `layer_${artifact.id.replace('csa_builtin_', '')}_${index}`,
    kind: 'artifact',
    label: artifact.name,
    artifact_id: artifact.id,
    renderer_token: artifact.renderer_token,
    artifact_checksum: artifact.checksum,
    side,
    ...artifact.default_bounds,
    locked: artifact.kind === 'surface',
    visible: true,
  };
}

function applyTemplate(document, templateId) {
  const template = CARD_TEMPLATE_BY_ID.get(templateId) || CARD_TEMPLATE_BY_ID.get('ivory');
  const palette = PALETTES.get(template.palette_id);
  document.template_id = template.id;
  document.style = {
    ...document.style,
    accent: palette.tokens.accent,
    surface: palette.tokens.surface,
    ink: palette.tokens.ink,
    palette_id: palette.id,
    typography: template.typography,
  };
  const semantic = document.layers.filter((layer) => layer.kind !== 'artifact');
  const artifacts = template.starter_artifacts
    .map((id) => CARD_ARTIFACT_BY_ID.get(id))
    .filter(Boolean)
    .map((item, index) => artifactLayer(item, index));
  document.layers = [...semantic, ...artifacts];
  return document;
}

export function createCardDocument(starterId = 'ivory') {
  const now = new Date().toISOString();
  const document = cloneCardDocument(DEFAULT_CARD_DOCUMENT);
  document.draft_id = randomDraftId();
  document.created_at = now;
  document.updated_at = now;
  const starter = catalogStarter(starterId);
  if (starter?.demo) {
    applyTemplate(document, starter.template_id);
    document.starter_id = starter.id;
    document.starter_checksum = starter.checksum;
    document.draft_name = `${starter.name} demo`;
    document.identity = {
      ...document.identity,
      name: starter.name,
      role: starter.label,
      organization: starter.fields.organization,
      initials: initialsFor(starter.name),
      tagline: starter.operator_demo ? 'Public operator profile demonstration.' : 'Fictional Card Studio demonstration.',
    };
    document.contact = {
      email: starter.fields.email,
      phone: starter.fields.phone,
      website: starter.fields.website,
    };
    document.visibility = {
      ...document.visibility,
      email: Boolean(starter.fields.email),
      phone: Boolean(starter.fields.phone),
      website: Boolean(starter.fields.website),
    };
    document.sharing = {
      profile_path: starter.id,
      destination: `https://${starter.fields.website}`,
    };
    const additions = starter.artifact_ids
      .filter((id) => !document.layers.some((layer) => layer.artifact_id === id))
      .map((id) => CARD_ARTIFACT_BY_ID.get(id))
      .filter(Boolean)
      .map((item, index) => artifactLayer(item, document.layers.length + index));
    document.layers.push(...additions);
    return document;
  }

  const template = starter?.id ? starter : CARD_TEMPLATE_BY_ID.get('ivory');
  applyTemplate(document, template.id);
  document.starter_id = template.id;
  document.draft_name = `${template.name} card`;
  return document;
}

const finite = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

function normalizeLayer(layer, index) {
  if (!layer || typeof layer !== 'object') return null;
  const side = ['front', 'back'].includes(layer.side) ? layer.side : 'front';
  const id = /^layer_[A-Za-z0-9_-]{2,80}$/.test(layer.id || '') ? layer.id : `layer_recovered_${index}`;
  const artifact = layer.artifact_id ? CARD_ARTIFACT_BY_ID.get(layer.artifact_id) : null;
  return {
    id,
    kind: artifact ? 'artifact' : ['identity', 'contact', 'profile', 'qr'].includes(layer.kind) ? layer.kind : 'identity',
    label: String(layer.label || artifact?.name || 'Recovered layer').slice(0, 80),
    ...(artifact ? {
      artifact_id: artifact.id,
      renderer_token: artifact.renderer_token,
      artifact_checksum: String(layer.artifact_checksum || ''),
    } : {}),
    side,
    x: clamp(finite(layer.x, 0.08), 0, 1),
    y: clamp(finite(layer.y, 0.08), 0, 1),
    width: clamp(finite(layer.width, 0.2), 0.02, 1),
    height: clamp(finite(layer.height, 0.15), 0.02, 1),
    locked: Boolean(layer.locked),
    visible: layer.visible !== false,
  };
}

export function normalizeCardDocument(value) {
  if (!value || typeof value !== 'object') return createCardDocument();
  const fallback = createCardDocument(
    CARD_EXAMPLE_BY_ID.has(value.starter_id) || CARD_TEMPLATE_BY_ID.has(value.starter_id)
      ? value.starter_id
      : value.template_id,
  );
  const next = {
    ...fallback,
    ...value,
    schema_version: CARD_STUDIO_SCHEMA,
    draft_id: /^draft_[A-Za-z0-9_-]{8,64}$/.test(value.draft_id || '') ? value.draft_id : fallback.draft_id,
    draft_name: String(value.draft_name || fallback.draft_name).slice(0, 80),
    template_id: CARD_TEMPLATE_BY_ID.has(value.template_id) ? value.template_id : fallback.template_id,
    active_mode: ['front', 'back', 'digital'].includes(value.active_mode) ? value.active_mode : 'front',
    editor_mode: ['basic', 'advanced'].includes(value.editor_mode) ? value.editor_mode : 'basic',
    identity: { ...fallback.identity, ...(value.identity || {}) },
    contact: { ...fallback.contact, ...(value.contact || {}) },
    visibility: { ...fallback.visibility, ...(value.visibility || {}) },
    style: { ...fallback.style, ...(value.style || {}) },
    sharing: { ...fallback.sharing, ...(value.sharing || {}) },
    layers: Array.isArray(value.layers) ? value.layers.map(normalizeLayer).filter(Boolean).slice(0, 64) : fallback.layers,
    notes: typeof value.notes === 'string' ? value.notes.slice(0, 1200) : '',
    revision: Number.isInteger(value.revision) && value.revision > 0 ? value.revision : 1,
    created_at: typeof value.created_at === 'string' ? value.created_at : fallback.created_at,
    updated_at: typeof value.updated_at === 'string' ? value.updated_at : fallback.updated_at,
    archived: Boolean(value.archived),
  };
  if (!next.layers.length) next.layers = cloneCardDocument(defaultLayers);
  if (!next.layers.some((layer) => layer.id === next.selected_layer_id)) next.selected_layer_id = next.layers[0].id;
  return next;
}

export function updateDocumentPath(document, section, key, value) {
  const next = cloneCardDocument(document);
  if (key == null) next[section] = value;
  else next[section] = { ...next[section], [key]: value };
  next.revision = (document.revision || 0) + 1;
  next.updated_at = new Date().toISOString();
  return next;
}

export function updateLayer(document, layerId, patch) {
  const next = cloneCardDocument(document);
  next.layers = next.layers.map((layer) => layer.id === layerId ? normalizeLayer({ ...layer, ...patch }, 0) : layer);
  next.selected_layer_id = layerId;
  next.revision += 1;
  next.updated_at = new Date().toISOString();
  return next;
}

export function addArtifactLayer(document, artifactId, side = document.active_mode === 'back' ? 'back' : 'front') {
  const artifact = CARD_ARTIFACT_BY_ID.get(artifactId);
  if (!artifact || !artifact.compatible_sides.includes(side) || document.layers.length >= 64) return document;
  const next = cloneCardDocument(document);
  const layer = artifactLayer(artifact, Date.now().toString(36), side);
  next.layers.push(layer);
  next.selected_layer_id = layer.id;
  next.revision += 1;
  next.updated_at = new Date().toISOString();
  return next;
}

export function removeLayer(document, layerId) {
  const layer = document.layers.find((item) => item.id === layerId);
  if (!layer || layer.kind !== 'artifact') return document;
  const next = cloneCardDocument(document);
  next.layers = next.layers.filter((item) => item.id !== layerId);
  next.selected_layer_id = next.layers.find((item) => item.side === layer.side)?.id || next.layers[0]?.id || '';
  next.revision += 1;
  next.updated_at = new Date().toISOString();
  return next;
}

export function reorderLayer(document, layerId, direction) {
  const next = cloneCardDocument(document);
  const index = next.layers.findIndex((item) => item.id === layerId);
  const target = clamp(index + direction, 0, next.layers.length - 1);
  if (index < 0 || index === target) return document;
  const [layer] = next.layers.splice(index, 1);
  next.layers.splice(target, 0, layer);
  next.revision += 1;
  next.updated_at = new Date().toISOString();
  return next;
}

export function alignLayer(document, layerId, alignment) {
  const layer = document.layers.find((item) => item.id === layerId);
  if (!layer || layer.locked) return document;
  const patches = {
    left: { x: 0.06 },
    center: { x: (1 - layer.width) / 2 },
    right: { x: 0.94 - layer.width },
    top: { y: 0.08 },
    middle: { y: (1 - layer.height) / 2 },
    bottom: { y: 0.92 - layer.height },
  };
  return patches[alignment] ? updateLayer(document, layerId, patches[alignment]) : document;
}

export function applyCardTemplate(document, templateId) {
  if (!CARD_TEMPLATE_BY_ID.has(templateId)) return document;
  const next = applyTemplate(cloneCardDocument(document), templateId);
  next.starter_id = templateId;
  next.starter_checksum = '';
  next.revision += 1;
  next.updated_at = new Date().toISOString();
  return next;
}

function valueAt(document, section, key) {
  return String(document?.[section]?.[key] || '').trim();
}

const luminance = (hex) => {
  const channels = String(hex || '#000000').slice(1).match(/.{2}/g)?.map((channel) => {
    const value = parseInt(channel, 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  }) || [0, 0, 0];
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};

const overlap = (a, b) => (
  a.x < b.x + b.width
  && a.x + a.width > b.x
  && a.y < b.y + b.height
  && a.y + a.height > b.y
);

export function evaluateCardPreflight(document) {
  const blockers = [];
  const warnings = [];
  const name = valueAt(document, 'identity', 'name');
  const role = valueAt(document, 'identity', 'role');
  const organization = valueAt(document, 'identity', 'organization');
  const destination = valueAt(document, 'sharing', 'destination');
  const email = valueAt(document, 'contact', 'email');
  const phone = valueAt(document, 'contact', 'phone');
  const visibleLayers = document.layers.filter((layer) => layer.visible);
  const visibleArtifacts = visibleLayers.filter((layer) => layer.kind === 'artifact');

  if (name.length < 2) blockers.push('Add the cardholder name.');
  if (role.length < 2) blockers.push('Add a role or professional title.');
  if (organization.length < 2) blockers.push('Add an organization or independent practice.');
  if (!/^https:\/\/[^.\s]+\.[^\s]+/i.test(destination)) blockers.push('Use a complete HTTPS profile destination.');
  if (document.visibility.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) blockers.push('Add a valid visible email address or hide email.');
  if (document.visibility.phone && phone.replace(/\D/g, '').length < 10) blockers.push('Add a complete visible phone number or hide phone.');
  if (name.length > 34) warnings.push('Long names may need a smaller production type size.');
  if (role.length > 42) warnings.push('The role is long for a physical card safe area.');
  if (organization.length > 34) warnings.push('The organization name may wrap on smaller cards.');
  if (document.style.spacing < 25) warnings.push('Dense spacing needs operator review for print legibility.');
  if (!document.visibility.email && !document.visibility.phone && !document.visibility.website) warnings.push('No direct contact method is currently visible.');
  if (visibleArtifacts.length > 16) blockers.push('A staged revision can contain no more than 16 built-in artifact references.');

  for (const layer of visibleLayers) {
    const artifactKind = layer.kind === 'artifact' ? CARD_ARTIFACT_BY_ID.get(layer.artifact_id)?.kind : null;
    if (artifactKind !== 'surface' && (layer.x + layer.width > 0.96 || layer.y + layer.height > 0.94 || layer.x < 0.04 || layer.y < 0.06)) {
      warnings.push(`${layer.label} crosses the recommended safe area.`);
    }
    if (layer.kind === 'qr' && (layer.width < 0.18 || layer.height < 0.28)) blockers.push('QR signal is below the minimum production size.');
    if (layer.kind === 'identity' && layer.height < 0.16) blockers.push('Identity text is below the minimum legibility area.');
    if (layer.kind === 'artifact') {
      const artifact = CARD_ARTIFACT_BY_ID.get(layer.artifact_id);
      if (!artifact || artifact.checksum !== layer.artifact_checksum) blockers.push(`${layer.label} is unknown or failed its built-in checksum.`);
      else if (!artifact.compatible_sides.includes(layer.side)) blockers.push(`${layer.label} is not compatible with the ${layer.side} side.`);
    }
  }

  const foreground = luminance(document.style.ink);
  const background = luminance(document.style.surface);
  const contrast = (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
  if (contrast < 4.5) blockers.push('Card text and surface do not meet the minimum contrast target.');

  for (const side of ['front', 'back']) {
    const collidable = visibleLayers.filter((layer) => layer.side === side && layer.kind !== 'artifact');
    for (let left = 0; left < collidable.length; left += 1) {
      for (let right = left + 1; right < collidable.length; right += 1) {
        if (overlap(collidable[left], collidable[right])) warnings.push(`${collidable[left].label} overlaps ${collidable[right].label} on the ${side}.`);
      }
    }
  }

  if (CARD_EXAMPLE_BY_ID.has(document.starter_id)) {
    const starter = CARD_EXAMPLE_BY_ID.get(document.starter_id);
    if (document.starter_checksum !== starter.checksum) blockers.push('This example starter is stale or incompatible. Start from the current library version.');
  }

  return {
    blockers: [...new Set(blockers)],
    warnings: [...new Set(warnings)],
    ready: blockers.length === 0,
    status: blockers.length ? 'DRAFT' : warnings.length ? 'REVIEW REQUIRED' : 'PREFLIGHT READY',
  };
}

export function stableFingerprint(document) {
  const stable = JSON.stringify({
    schema_version: document.schema_version,
    template_id: document.template_id,
    identity: document.identity,
    contact: document.contact,
    visibility: document.visibility,
    style: document.style,
    sharing: document.sharing,
    layers: document.layers,
    notes: document.notes,
    revision: document.revision,
  });
  let hash = 2166136261;
  for (let index = 0; index < stable.length; index += 1) {
    hash ^= stable.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `HCS-${(hash >>> 0).toString(16).padStart(8, '0').toUpperCase()}`;
}

export function buildCardStudioSubmission(document, consent, idempotencyKey) {
  const preflight = evaluateCardPreflight(document);
  return {
    schema_version: CARD_STUDIO_FORM,
    idempotency_key: idempotencyKey,
    submitted_at: new Date().toISOString(),
    source: { route: '/card-studio/design', channel: 'public_native_studio' },
    consent: {
      operator_review: Boolean(consent),
      public_profile_fields_acknowledged: Boolean(consent),
    },
    design: cloneCardDocument(document),
    preflight,
    proof_reference: stableFingerprint(document),
    posture: { status: 'HELD FOR REVIEW', pricing: 'NOT A QUOTE', checkout_created: false },
  };
}
