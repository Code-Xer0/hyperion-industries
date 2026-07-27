export const CARD_STUDIO_SCHEMA = 'card-design-document/1';
export const CARD_STUDIO_FORM = 'card-studio-order/1';
export const CARD_STUDIO_STORAGE_KEY = 'hyperion.card-studio.draft.v1';

export const CARD_TEMPLATES = Object.freeze([
  { id: 'slate', name: 'Slate', lane: 'Operations', tone: '#9aa6bd', surface: '#121720', ink: '#f3f6fb' },
  { id: 'ivory', name: 'Ivory', lane: 'Advisory', tone: '#b06a45', surface: '#f4efe4', ink: '#211d18' },
  { id: 'counsel', name: 'Counsel', lane: 'Legal', tone: '#c2a25a', surface: '#101927', ink: '#f5e8c5' },
  { id: 'sterling', name: 'Sterling', lane: 'Finance', tone: '#c8a657', surface: '#071426', ink: '#f6f1e3' },
  { id: 'atelier', name: 'Atelier', lane: 'Creative', tone: '#b8412e', surface: '#efe2cb', ink: '#2d1812' },
  { id: 'meridian', name: 'Meridian', lane: 'Architecture', tone: '#69808d', surface: '#172128', ink: '#e9f1f2' },
  { id: 'verdant', name: 'Verdant', lane: 'Wellness', tone: '#6fb38a', surface: '#e7efe7', ink: '#153124' },
  { id: 'operator', name: 'Operator', lane: 'Technology', tone: '#ff2a36', surface: '#07090b', ink: '#f8f8f5' },
]);

export const TYPE_OPTIONS = Object.freeze([
  { id: 'geometric', label: 'Geometric', stack: '"Montserrat", sans-serif' },
  { id: 'editorial', label: 'Editorial', stack: 'Georgia, "Times New Roman", serif' },
  { id: 'technical', label: 'Technical', stack: '"Jura", monospace' },
]);

export const DEFAULT_CARD_DOCUMENT = Object.freeze({
  schema_version: CARD_STUDIO_SCHEMA,
  template_id: 'ivory',
  active_mode: 'front',
  identity: {
    name: 'Maya Okonkwo',
    role: 'Product Designer',
    organization: 'Northbound Studio',
    initials: 'MO',
    tagline: 'Design that earns the next conversation.',
  },
  contact: {
    email: 'maya@northbound.co',
    phone: '+1 (415) 720-3318',
    website: 'maya.studio',
  },
  visibility: {
    email: true,
    phone: true,
    website: true,
    tagline: true,
  },
  style: {
    accent: '#b06a45',
    typography: 'editorial',
    spacing: 50,
  },
  sharing: {
    profile_path: 'maya-okonkwo',
    destination: 'https://hyperion-industries.dev/c/maya-okonkwo',
  },
  notes: '',
  revision: 1,
  updated_at: null,
});

export function cloneCardDocument(document = DEFAULT_CARD_DOCUMENT) {
  return JSON.parse(JSON.stringify(document));
}

export function createCardDocument() {
  return cloneCardDocument(DEFAULT_CARD_DOCUMENT);
}

export function normalizeCardDocument(value) {
  if (!value || typeof value !== 'object') return createCardDocument();
  const next = createCardDocument();
  const template = CARD_TEMPLATES.find((item) => item.id === value.template_id);
  next.template_id = template?.id || next.template_id;
  next.active_mode = ['front', 'back', 'digital'].includes(value.active_mode) ? value.active_mode : 'front';
  next.identity = { ...next.identity, ...(value.identity || {}) };
  next.contact = { ...next.contact, ...(value.contact || {}) };
  next.visibility = { ...next.visibility, ...(value.visibility || {}) };
  next.style = { ...next.style, ...(value.style || {}) };
  next.sharing = { ...next.sharing, ...(value.sharing || {}) };
  next.notes = typeof value.notes === 'string' ? value.notes.slice(0, 1200) : '';
  next.revision = Number.isInteger(value.revision) && value.revision > 0 ? value.revision : 1;
  next.updated_at = typeof value.updated_at === 'string' ? value.updated_at : null;
  return next;
}

export function updateDocumentPath(document, section, key, value) {
  const next = cloneCardDocument(document);
  if (key == null) {
    next[section] = value;
  } else {
    next[section] = { ...next[section], [key]: value };
  }
  next.revision = (document.revision || 0) + 1;
  next.updated_at = new Date().toISOString();
  return next;
}

function valueAt(document, section, key) {
  return String(document?.[section]?.[key] || '').trim();
}

export function evaluateCardPreflight(document) {
  const blockers = [];
  const warnings = [];
  const name = valueAt(document, 'identity', 'name');
  const role = valueAt(document, 'identity', 'role');
  const organization = valueAt(document, 'identity', 'organization');
  const destination = valueAt(document, 'sharing', 'destination');
  const email = valueAt(document, 'contact', 'email');
  const phone = valueAt(document, 'contact', 'phone');

  if (name.length < 2) blockers.push('Add the cardholder name.');
  if (role.length < 2) blockers.push('Add a role or professional title.');
  if (organization.length < 2) blockers.push('Add an organization or independent practice.');
  if (!/^https:\/\/[^.\s]+\.[^\s]+/i.test(destination)) blockers.push('Use a complete HTTPS profile destination.');
  if (document.visibility.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    blockers.push('Add a valid visible email address or hide email.');
  }
  if (document.visibility.phone && phone.replace(/\D/g, '').length < 10) {
    blockers.push('Add a complete visible phone number or hide phone.');
  }
  if (name.length > 34) warnings.push('Long names may need a smaller production type size.');
  if (role.length > 42) warnings.push('The role is long for a physical card safe area.');
  if (organization.length > 34) warnings.push('The organization name may wrap on smaller cards.');
  if (document.style.spacing < 25) warnings.push('Dense spacing needs operator review for print legibility.');
  if (!document.visibility.email && !document.visibility.phone && !document.visibility.website) {
    warnings.push('No direct contact method is currently visible.');
  }

  return {
    blockers,
    warnings,
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
    source: {
      route: '/card-studio',
      channel: 'public_native_studio',
    },
    consent: {
      operator_review: Boolean(consent),
      public_profile_fields_acknowledged: Boolean(consent),
    },
    design: cloneCardDocument(document),
    preflight,
    proof_reference: stableFingerprint(document),
    posture: {
      status: 'HELD FOR REVIEW',
      pricing: 'NOT A QUOTE',
      checkout_created: false,
    },
  };
}
