export const FORGE_PRODUCT_VIEW_CONTRACT = 'forge-product-view/1';
export const FORGE_PRODUCT_BUNDLE_CONTRACT = 'forge-product-view-bundle/1';
export const FORGE_PRODUCT_AUTHORITY_NOTICE = 'Airtable may curate presentation fields only; HypOM remains engineering and pricing authority.';

const common = {
  schema_version: FORGE_PRODUCT_VIEW_CONTRACT,
  badges: ['OPERATOR REVIEW', 'NOT A QUOTE', 'CONFIGURATION-SPECIFIC'],
  availability_posture: 'inquiry_only',
  pricing_posture: 'scoped_after_review',
};

export const FORGE_PRODUCT_FALLBACK = Object.freeze({
  schema_version: FORGE_PRODUCT_BUNDLE_CONTRACT,
  bundle_hash: 'e18a954fb506c810b25f40cddeb2a7b47bafa72d23d3f3c5cea13c5ee3b36453',
  source_posture: 'bundled_fallback',
  authority_notice: FORGE_PRODUCT_AUTHORITY_NOTICE,
  generated_at: '2026-07-26T00:00:00Z',
  items: [
    {
      ...common,
      slug: 'validated-am5-gaming',
      eyebrow: 'PLAY LANE · VALIDATED PLATFORM',
      title: 'Forge Play System',
      lane: 'gaming',
      summary: 'A high-refresh gaming platform shaped around stable thermals, clean service access, and room to grow.',
      workload_tags: ['1440p gaming', 'high refresh', 'streaming ready'],
      highlights: ['AM5 platform', 'Air-cooled serviceability', 'Balanced power headroom'],
      media: {
        path: '/assets/forge/media-v1/stills/kuda-white-build-blue.jpg',
        alt: 'Hyperion Forge white workstation build with blue lighting',
        posture: 'field_media',
        authoritative: false,
      },
      display_order: 10,
      source: {
        authority: 'hypom',
        source_manifest_hash: '075771f60e58f326a733fe4400104b0b078a04987444d1053ca00b2f87af38fc',
        data_origin: 'fixture',
        airtable_overlay_allowed: true,
      },
      projection_hash: '3b71ed2994196bff73b92cb7a015249fe8f12acd2c17e622eb11de35ef5e5cf4',
    },
    {
      ...common,
      slug: 'validated-intel-creator',
      eyebrow: 'CREATE LANE · WORKSTATION',
      title: 'Forge Creator Workstation',
      lane: 'creator',
      summary: 'A production workstation for editing, rendering, and multi-application creative work without generic-cart compromises.',
      workload_tags: ['video editing', '3D rendering', 'creative production'],
      highlights: ['High-memory posture', 'GPU-accelerated creation', 'Expansion-first chassis'],
      media: {
        path: '/assets/forge/media-v1/posters/hyperion-workstation-core-card.jpg',
        alt: 'Hyperion Forge workstation core presentation',
        posture: 'field_media',
        authoritative: false,
      },
      display_order: 20,
      source: {
        authority: 'hypom',
        source_manifest_hash: '8ba5f52cf73aab5a5a0c3b7d367a2a1542f0ef1441b0c431d16b35aa309beea7',
        data_origin: 'fixture',
        airtable_overlay_allowed: true,
      },
      projection_hash: '376833bcfff197c03d928a0250fcba791c3acd0d1462a62e5e420241165fd75e',
    },
    {
      ...common,
      slug: 'high-power-local-ai',
      eyebrow: 'LOCAL AI · REVIEW-GATED',
      title: 'Forge Local AI Station',
      lane: 'local-ai',
      summary: 'A serious local inference and experimentation lane with evidence, power, thermals, and serviceability kept visible.',
      workload_tags: ['local inference', 'multi-GPU', 'model experimentation'],
      highlights: ['Multi-accelerator posture', 'Power-headroom review', 'Evidence-bound composition'],
      media: {
        path: '/assets/forge/media-v1/posters/hyperion-gpu-telemetry-card.jpg',
        alt: 'Hyperion Forge GPU telemetry presentation',
        posture: 'field_media',
        authoritative: false,
      },
      display_order: 30,
      source: {
        authority: 'hypom',
        source_manifest_hash: '5c12a5db1d472956dc58ded5612dcc7381d3eeec6bdc0c06f81b221c94d5894d',
        data_origin: 'fixture',
        airtable_overlay_allowed: true,
      },
      projection_hash: 'a58591e5679f0cd74d3cfd0ea580c3e6aee2eb937977d426e4ffbb7fbc555197',
    },
    {
      ...common,
      slug: 'validated-sff',
      eyebrow: 'COMPACT LANE · SFF',
      title: 'Forge Compact System',
      lane: 'sff',
      summary: 'A compact system where clearance, acoustics, thermals, and upgrade constraints are engineered together.',
      workload_tags: ['compact gaming', 'small footprint', 'quiet desk'],
      highlights: ['Mini-ITX platform', 'Clearance-aware selection', 'Compact thermal posture'],
      media: {
        path: '/assets/forge/media-v1/stills/kuda-white-build-lime.jpg',
        alt: 'Hyperion Forge white compact build with lime lighting',
        posture: 'field_media',
        authoritative: false,
      },
      display_order: 40,
      source: {
        authority: 'hypom',
        source_manifest_hash: '6ef818fe763438799f10068807b012f87d3f0ecd6204af8a53063f6a22ee28e7',
        data_origin: 'fixture',
        airtable_overlay_allowed: true,
      },
      projection_hash: 'be72136d869f2b19aa5e57956ad03cabb6c7bbef1902eff45c50f868e2fc8c5a',
    },
    {
      ...common,
      slug: 'no-limits-custom-loop',
      eyebrow: 'BESPOKE LANE · CUSTOM LOOP',
      title: 'Forge Bespoke Loop',
      lane: 'custom-loop',
      summary: 'A commissioned custom-loop system with fill, drain, leak-test, materials, transport, and maintenance posture treated as engineering facts.',
      workload_tags: ['flagship rendering', 'custom cooling', 'commissioned build'],
      highlights: ['Service plan required', 'Materials compatibility', 'Local commissioning posture'],
      media: {
        path: '/assets/forge/media-v1/posters/hyperion-custom-workstation-card.jpg',
        alt: 'Hyperion custom workstation presentation',
        posture: 'field_media',
        authoritative: false,
      },
      display_order: 50,
      source: {
        authority: 'hypom',
        source_manifest_hash: 'eb7e9408cf8a93864977bec74da20ecad8bb0e4772f2808a44d518c9f11544a3',
        data_origin: 'fixture',
        airtable_overlay_allowed: true,
      },
      projection_hash: '0c0ff5ef7a210114d4856e5125bf707e8cf9c88efb5253df64b3200c0faed987',
    },
  ],
});

const isText = (value, max) => typeof value === 'string' && value.length > 0 && value.length <= max;
const isTextList = (value, maxItems = 8, maxLength = 120) => (
  Array.isArray(value)
  && value.length <= maxItems
  && value.every((item) => isText(item, maxLength))
);

export function isForgeProductView(value) {
  return Boolean(
    value
    && value.schema_version === FORGE_PRODUCT_VIEW_CONTRACT
    && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.slug)
    && isText(value.eyebrow, 120)
    && isText(value.title, 120)
    && isText(value.lane, 40)
    && isText(value.summary, 600)
    && isTextList(value.workload_tags)
    && isTextList(value.highlights)
    && value.media
    && /^\/assets\/forge\/(?!.*(?:\.\.|\\))[A-Za-z0-9._~!$&'()*+,;=:@%/-]+$/.test(value.media.path)
    && isText(value.media.alt, 240)
    && isTextList(value.badges, 6, 80)
    && Number.isInteger(value.display_order)
    && /^[0-9a-f]{64}$/.test(value.projection_hash)
  );
}

export function isForgeProductBundle(value) {
  return Boolean(
    value
    && value.schema_version === FORGE_PRODUCT_BUNDLE_CONTRACT
    && ['airtable_curated', 'bundled_fallback'].includes(value.source_posture)
    && Array.isArray(value.items)
    && value.items.length > 0
    && value.items.length <= 100
    && value.items.every(isForgeProductView)
  );
}
