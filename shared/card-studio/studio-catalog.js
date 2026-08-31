const bounds = (x, y, width, height) => Object.freeze({ x, y, width, height });

const checksum = (...parts) => {
  const source = JSON.stringify(parts);
  let value = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    value = Math.imul(value ^ source.charCodeAt(index), 16777619);
  }
  return `fnv1a32:${(value >>> 0).toString(16).padStart(8, '0')}`;
};

const artifact = (id, pack, name, rendererToken, compatibleSides, defaultBounds, extra = {}) => Object.freeze({
  id: `csa_builtin_${id}`,
  pack,
  name,
  renderer_token: rendererToken,
  compatible_sides: compatibleSides,
  default_bounds: defaultBounds,
  checksum: checksum(id, pack, name, rendererToken, compatibleSides, defaultBounds, extra),
  ...extra,
});

const palette = (id, name, surface, ink, accent) => artifact(
  `palette_${id}`,
  'accessible-palettes',
  name,
  `palette.${id}.1`,
  ['front', 'back'],
  bounds(0, 0, 1, 1),
  { kind: 'palette', tokens: { surface, ink, accent } },
);

export const CARD_ARTIFACT_CATALOG = Object.freeze({
  contract_version: 'card-artifact-catalog/1',
  catalog_version: '2026.07.28',
  packs: Object.freeze([
    { id: 'accessible-palettes', name: 'Accessible palettes', count: 12 },
    { id: 'background-surfaces', name: 'Background surfaces', count: 8 },
    { id: 'marks-dividers', name: 'Marks & dividers', count: 8 },
    { id: 'identity-contact', name: 'Identity & contact blocks', count: 8 },
    { id: 'signal-badges', name: 'Signal badges', count: 6 },
    { id: 'qr-nfc-frames', name: 'QR & NFC frames', count: 6 },
  ]),
  items: Object.freeze([
    palette('auric', 'Auric Night', '#090B0F', '#F7F3E7', '#FFC72C'),
    palette('signal', 'Signal Red', '#09090B', '#FCF7F5', '#FF4B45'),
    palette('cobalt', 'Cobalt Field', '#071426', '#F2F6FF', '#56A8FF'),
    palette('verdant', 'Verdant Paper', '#E7EFE7', '#153124', '#2F7A55'),
    palette('ivory', 'Ivory Ledger', '#F4EFE4', '#211D18', '#9B5637'),
    palette('violet', 'Violet Relay', '#120C1C', '#F8F1FF', '#B57BFF'),
    palette('sterling', 'Sterling Navy', '#071426', '#F6F1E3', '#C8A657'),
    palette('clinical', 'Clinical Slate', '#F1F6F8', '#142129', '#176C85'),
    palette('ember', 'Ember Foundry', '#1B0C08', '#FFF0E7', '#F0642E'),
    palette('mono', 'Mono Carbon', '#111214', '#F4F4F1', '#A8A8A2'),
    palette('noir', 'Noir Rose', '#120A0D', '#FFF1F4', '#D65A78'),
    palette('summit', 'Summit Stone', '#EBE8E0', '#20231F', '#596B3C'),

    artifact('surface_grid', 'background-surfaces', 'Coordinate Grid', 'surface.grid.1', ['front', 'back'], bounds(0, 0, 1, 1), { kind: 'surface' }),
    artifact('surface_contour', 'background-surfaces', 'Contour Field', 'surface.contour.1', ['front', 'back'], bounds(0, 0, 1, 1), { kind: 'surface' }),
    artifact('surface_grain', 'background-surfaces', 'Fine Grain', 'surface.grain.1', ['front', 'back'], bounds(0, 0, 1, 1), { kind: 'surface' }),
    artifact('surface_scan', 'background-surfaces', 'Scan Lines', 'surface.scan.1', ['front', 'back'], bounds(0, 0, 1, 1), { kind: 'surface' }),
    artifact('surface_radiant', 'background-surfaces', 'Radiant Core', 'surface.radiant.1', ['front', 'back'], bounds(0, 0, 1, 1), { kind: 'surface' }),
    artifact('surface_blueprint', 'background-surfaces', 'Blueprint', 'surface.blueprint.1', ['front', 'back'], bounds(0, 0, 1, 1), { kind: 'surface' }),
    artifact('surface_paper', 'background-surfaces', 'Pressed Paper', 'surface.paper.1', ['front', 'back'], bounds(0, 0, 1, 1), { kind: 'surface' }),
    artifact('surface_matrix', 'background-surfaces', 'Signal Matrix', 'surface.matrix.1', ['front', 'back'], bounds(0, 0, 1, 1), { kind: 'surface' }),

    artifact('mark_orbit', 'marks-dividers', 'Orbit Mark', 'mark.orbit.1', ['front', 'back'], bounds(0.72, 0.08, 0.18, 0.18), { kind: 'mark' }),
    artifact('mark_core', 'marks-dividers', 'Core Mark', 'mark.core.1', ['front', 'back'], bounds(0.73, 0.08, 0.17, 0.17), { kind: 'mark' }),
    artifact('mark_axis', 'marks-dividers', 'Axis Mark', 'mark.axis.1', ['front', 'back'], bounds(0.75, 0.1, 0.14, 0.14), { kind: 'mark' }),
    artifact('mark_beacon', 'marks-dividers', 'Beacon Mark', 'mark.beacon.1', ['front', 'back'], bounds(0.74, 0.08, 0.16, 0.16), { kind: 'mark' }),
    artifact('divider_trace', 'marks-dividers', 'Trace Divider', 'divider.trace.1', ['front', 'back'], bounds(0.08, 0.68, 0.52, 0.025), { kind: 'divider' }),
    artifact('divider_double', 'marks-dividers', 'Double Divider', 'divider.double.1', ['front', 'back'], bounds(0.08, 0.68, 0.52, 0.04), { kind: 'divider' }),
    artifact('divider_notched', 'marks-dividers', 'Notched Divider', 'divider.notched.1', ['front', 'back'], bounds(0.08, 0.68, 0.52, 0.035), { kind: 'divider' }),
    artifact('divider_signal', 'marks-dividers', 'Signal Divider', 'divider.signal.1', ['front', 'back'], bounds(0.08, 0.68, 0.52, 0.04), { kind: 'divider' }),

    artifact('layout_identity_stack', 'identity-contact', 'Identity Stack', 'layout.identity-stack.1', ['front'], bounds(0.08, 0.2, 0.62, 0.38), { kind: 'layout' }),
    artifact('layout_identity_split', 'identity-contact', 'Identity Split', 'layout.identity-split.1', ['front'], bounds(0.08, 0.18, 0.82, 0.42), { kind: 'layout' }),
    artifact('layout_contact_row', 'identity-contact', 'Contact Row', 'layout.contact-row.1', ['front', 'back'], bounds(0.08, 0.72, 0.78, 0.12), { kind: 'layout' }),
    artifact('layout_contact_column', 'identity-contact', 'Contact Column', 'layout.contact-column.1', ['front', 'back'], bounds(0.08, 0.58, 0.42, 0.28), { kind: 'layout' }),
    artifact('layout_profile_plate', 'identity-contact', 'Profile Plate', 'layout.profile-plate.1', ['back'], bounds(0.08, 0.18, 0.5, 0.34), { kind: 'layout' }),
    artifact('layout_credential_bar', 'identity-contact', 'Credential Bar', 'layout.credential-bar.1', ['front', 'back'], bounds(0.08, 0.82, 0.82, 0.1), { kind: 'layout' }),
    artifact('layout_editorial', 'identity-contact', 'Editorial Block', 'layout.editorial.1', ['front'], bounds(0.08, 0.17, 0.72, 0.5), { kind: 'layout' }),
    artifact('layout_technical', 'identity-contact', 'Technical Block', 'layout.technical.1', ['front'], bounds(0.08, 0.18, 0.72, 0.5), { kind: 'layout' }),

    artifact('badge_verified', 'signal-badges', 'Verified Signal', 'badge.verified.1', ['front', 'back'], bounds(0.71, 0.76, 0.19, 0.1), { kind: 'badge' }),
    artifact('badge_local', 'signal-badges', 'Local First', 'badge.local.1', ['front', 'back'], bounds(0.7, 0.76, 0.2, 0.1), { kind: 'badge' }),
    artifact('badge_forge', 'signal-badges', 'Forge Built', 'badge.forge.1', ['front', 'back'], bounds(0.7, 0.76, 0.2, 0.1), { kind: 'badge' }),
    artifact('badge_operator', 'signal-badges', 'Operator', 'badge.operator.1', ['front', 'back'], bounds(0.7, 0.76, 0.2, 0.1), { kind: 'badge' }),
    artifact('badge_private', 'signal-badges', 'Private Profile', 'badge.private.1', ['back'], bounds(0.68, 0.76, 0.22, 0.1), { kind: 'badge' }),
    artifact('badge_review', 'signal-badges', 'Review Required', 'badge.review.1', ['back'], bounds(0.64, 0.76, 0.26, 0.1), { kind: 'badge' }),

    artifact('frame_qr_precision', 'qr-nfc-frames', 'Precision QR', 'frame.qr-precision.1', ['back'], bounds(0.66, 0.2, 0.24, 0.4), { kind: 'qr-frame' }),
    artifact('frame_qr_soft', 'qr-nfc-frames', 'Soft QR', 'frame.qr-soft.1', ['back'], bounds(0.66, 0.2, 0.24, 0.4), { kind: 'qr-frame' }),
    artifact('frame_qr_orbit', 'qr-nfc-frames', 'Orbit QR', 'frame.qr-orbit.1', ['back'], bounds(0.64, 0.18, 0.28, 0.46), { kind: 'qr-frame' }),
    artifact('frame_nfc_wave', 'qr-nfc-frames', 'NFC Wave', 'frame.nfc-wave.1', ['front', 'back'], bounds(0.78, 0.72, 0.12, 0.16), { kind: 'nfc-frame' }),
    artifact('frame_nfc_core', 'qr-nfc-frames', 'NFC Core', 'frame.nfc-core.1', ['front', 'back'], bounds(0.77, 0.72, 0.13, 0.16), { kind: 'nfc-frame' }),
    artifact('frame_dual_signal', 'qr-nfc-frames', 'Dual Signal', 'frame.dual-signal.1', ['back'], bounds(0.62, 0.16, 0.3, 0.52), { kind: 'qr-frame' }),
  ]),
});

const template = (id, name, lane, paletteId, typography, starterArtifacts) => Object.freeze({
  id,
  name,
  lane,
  palette_id: `csa_builtin_palette_${paletteId}`,
  typography,
  starter_artifacts: starterArtifacts,
  status: 'PUBLIC TEMPLATE',
});

export const CARD_TEMPLATE_CATALOG = Object.freeze({
  contract_version: 'card-template-catalog/1',
  catalog_version: '2026.07.28',
  items: Object.freeze([
    template('slate', 'Slate', 'Operations', 'mono', 'geometric', ['csa_builtin_mark_axis', 'csa_builtin_divider_trace']),
    template('ivory', 'Ivory', 'Advisory', 'ivory', 'editorial', ['csa_builtin_divider_double', 'csa_builtin_layout_identity_stack']),
    template('counsel', 'Counsel', 'Legal', 'sterling', 'editorial', ['csa_builtin_mark_orbit', 'csa_builtin_layout_contact_row']),
    template('sterling', 'Sterling', 'Finance', 'sterling', 'geometric', ['csa_builtin_surface_grid', 'csa_builtin_divider_notched']),
    template('atelier', 'Atelier', 'Creative', 'ivory', 'editorial', ['csa_builtin_surface_paper', 'csa_builtin_layout_editorial']),
    template('meridian', 'Meridian', 'Architecture', 'cobalt', 'technical', ['csa_builtin_surface_blueprint', 'csa_builtin_mark_axis']),
    template('verdant', 'Verdant', 'Wellness', 'verdant', 'editorial', ['csa_builtin_surface_contour', 'csa_builtin_mark_beacon']),
    template('operator', 'Operator', 'Technology', 'signal', 'technical', ['csa_builtin_surface_scan', 'csa_builtin_badge_operator']),
    template('axis', 'Axis', 'Consulting', 'cobalt', 'geometric', ['csa_builtin_mark_axis', 'csa_builtin_layout_identity_split']),
    template('beacon', 'Beacon', 'Nonprofit', 'auric', 'geometric', ['csa_builtin_mark_beacon', 'csa_builtin_layout_contact_row']),
    template('foundry', 'Foundry', 'Trades', 'ember', 'technical', ['csa_builtin_surface_grain', 'csa_builtin_badge_forge']),
    template('gallery', 'Gallery', 'Photography', 'mono', 'editorial', ['csa_builtin_surface_radiant', 'csa_builtin_layout_editorial']),
    template('ledger', 'Ledger', 'Accounting', 'ivory', 'geometric', ['csa_builtin_surface_grid', 'csa_builtin_layout_contact_column']),
    template('mono', 'Mono', 'Independent', 'mono', 'geometric', ['csa_builtin_divider_trace', 'csa_builtin_layout_identity_stack']),
    template('noir', 'Noir', 'Hospitality', 'noir', 'editorial', ['csa_builtin_surface_grain', 'csa_builtin_divider_double']),
    template('relay', 'Relay', 'Creator', 'violet', 'geometric', ['csa_builtin_surface_matrix', 'csa_builtin_badge_verified']),
    template('summit', 'Summit', 'Real Estate', 'summit', 'editorial', ['csa_builtin_surface_contour', 'csa_builtin_layout_contact_row']),
    template('vector', 'Vector', 'Engineering', 'cobalt', 'technical', ['csa_builtin_surface_blueprint', 'csa_builtin_divider_signal']),
    template('pulse', 'Pulse', 'Healthcare', 'clinical', 'geometric', ['csa_builtin_surface_scan', 'csa_builtin_badge_verified']),
    template('vanguard', 'Vanguard', 'Executive', 'auric', 'editorial', ['csa_builtin_mark_core', 'csa_builtin_layout_credential_bar']),
  ]),
});

const example = (id, name, label, templateId, fields, artifactIds, operator = false, demoAssets = null) => Object.freeze({
  id: `example-${id}`,
  name,
  label,
  template_id: templateId,
  fields,
  artifact_ids: artifactIds,
  demo: true,
  operator_demo: operator,
  demo_assets: demoAssets,
  checksum: checksum(id, name, label, templateId, fields, artifactIds, operator, demoAssets),
});

export const CARD_EXAMPLE_CATALOG = Object.freeze({
  contract_version: 'card-example-catalog/2',
  catalog_version: '2026.08.27',
  privacy_posture: 'fictional_or_existing_public_profile_fields_only',
  items: Object.freeze([
    example('axis-consulting', 'Avery Stone', 'Strategy Consultant', 'axis', { organization: 'Northstar Advisory', email: 'avery@northstar.example', phone: '+1 555 010 1101', website: 'northstar.example' }, ['csa_builtin_mark_axis']),
    example('beacon-nonprofit', 'Jordan Vale', 'Community Director', 'beacon', { organization: 'Beacon Commons', email: 'jordan@beacon.example', phone: '+1 555 010 1102', website: 'beacon.example' }, ['csa_builtin_mark_beacon']),
    example('foundry-trades', 'Casey Reed', 'Master Fabricator', 'foundry', { organization: 'Redline Works', email: 'casey@redline.example', phone: '+1 555 010 1103', website: 'redline.example' }, ['csa_builtin_badge_forge']),
    example('gallery-photo', 'Morgan Sato', 'Editorial Photographer', 'gallery', { organization: 'Soft Light Studio', email: 'morgan@softlight.example', phone: '+1 555 010 1104', website: 'softlight.example' }, ['csa_builtin_surface_radiant']),
    example('ledger-accounting', 'Samira Cole', 'Principal Accountant', 'ledger', { organization: 'Cole Ledger Co.', email: 'samira@ledger.example', phone: '+1 555 010 1105', website: 'ledger.example' }, ['csa_builtin_layout_contact_column']),
    example('mono-independent', 'Rowan Park', 'Independent Designer', 'mono', { organization: 'Rowan Park Studio', email: 'hello@rowanpark.example', phone: '+1 555 010 1106', website: 'rowanpark.example' }, ['csa_builtin_divider_trace']),
    example('noir-hospitality', 'Elena Noir', 'Hospitality Director', 'noir', { organization: 'Afterlight House', email: 'elena@afterlight.example', phone: '+1 555 010 1107', website: 'afterlight.example' }, ['csa_builtin_surface_grain']),
    example('relay-creator', 'Kai Rivers', 'Creator & Producer', 'relay', { organization: 'Relay Signal', email: 'kai@relay.example', phone: '+1 555 010 1108', website: 'relay.example' }, ['csa_builtin_badge_verified']),
    example('summit-realty', 'Quinn Hale', 'Property Advisor', 'summit', { organization: 'Summit & Field', email: 'quinn@summit.example', phone: '+1 555 010 1109', website: 'summit.example' }, ['csa_builtin_surface_contour']),
    example('pulse-health', 'Dr. Taylor Wynn', 'Clinical Director', 'pulse', { organization: 'Pulse Collaborative', email: 'taylor@pulse.example', phone: '+1 555 010 1110', website: 'pulse.example' }, ['csa_builtin_badge_verified']),
    example('hyperion-systems', 'Victor Amani', 'Founder · Systems Architect', 'operator', { organization: 'Hyperion Industries', email: '', phone: '', website: 'hyperion-industries.dev/founders/victor-amani' }, ['csa_builtin_badge_operator', 'csa_builtin_mark_core'], true, { portrait: '/assets/operators/victor-city-operating-edge.png', provenance: 'existing_public_operator_asset', submittable: false }),
    example('hyperion-operations', 'Keshawn Rowe', 'Founding Operator · Operations & Deployment', 'axis', { organization: 'Hyperion Industries', email: '', phone: '', website: 'hyperion-industries.dev/founders/keshawn-rowe' }, ['csa_builtin_badge_operator', 'csa_builtin_mark_beacon'], true),
    example('aster-loom-stylist', 'Talia Monroe', 'Editorial Stylist', 'gallery', { organization: 'Aster & Loom Styling', email: 'talia@asterloom.example', phone: '+1 202-555-0123', website: 'asterloom.example' }, ['csa_builtin_surface_radiant', 'csa_builtin_mark_axis'], false, {
      portrait: '/assets/card-studio/demos-v2/talia-monroe.png',
      portrait_sha256: 'AF8CCBBE66E3CF6E6E13055F4E55A65DFE983F50AEB01BF43751715F8B8A62EC',
      provenance: 'generated_fictional_editorial_portrait',
      submittable: false,
    }),
    example('redline-ridge-roofing', 'Marcus Hale', 'Owner · Roofing Contractor', 'foundry', { organization: 'Redline Ridge Roofing', email: 'marcus@redlineridge.example', phone: '+1 202-555-0164', website: 'redlineridge.example' }, ['csa_builtin_surface_grain', 'csa_builtin_badge_forge'], false, {
      portrait: '/assets/card-studio/demos-v2/marcus-hale.png',
      portrait_sha256: '78C20753428DA777EC9DBCA83D14CCB438265AE501AE5B349E84E89B7BBD76F0',
      provenance: 'generated_fictional_editorial_portrait',
      submittable: false,
    }),
    example('morrow-vale-legal', 'Priya Bennett', 'Principal Attorney', 'vanguard', { organization: 'Morrow Vale Legal', email: 'priya@morrowvale.example', phone: '+1 202-555-0192', website: 'morrowvale.example' }, ['csa_builtin_mark_core', 'csa_builtin_layout_credential_bar'], false, {
      portrait: '/assets/card-studio/demos-v2/priya-bennett.png',
      portrait_sha256: '8275D061122EF3885D515783B06A72E6B75FA4FC840FCFFB921DDAED4C68BE66',
      provenance: 'generated_fictional_editorial_portrait',
      submittable: false,
    }),
  ]),
});

export const CARD_ARTIFACT_BY_ID = new Map(CARD_ARTIFACT_CATALOG.items.map((item) => [item.id, item]));
export const CARD_TEMPLATE_BY_ID = new Map(CARD_TEMPLATE_CATALOG.items.map((item) => [item.id, item]));
export const CARD_EXAMPLE_BY_ID = new Map(CARD_EXAMPLE_CATALOG.items.map((item) => [item.id, item]));
export const BUILTIN_CARD_ASSET_IDS = new Set(CARD_ARTIFACT_CATALOG.items.map((item) => item.id));

export function isKnownCardArtifactReference(id) {
  return BUILTIN_CARD_ASSET_IDS.has(id);
}

export function catalogStarter(id) {
  return CARD_TEMPLATE_BY_ID.get(id) || CARD_EXAMPLE_BY_ID.get(id) || null;
}
