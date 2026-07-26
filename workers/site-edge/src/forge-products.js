import {
  FORGE_PRODUCT_AUTHORITY_NOTICE,
  FORGE_PRODUCT_BUNDLE_CONTRACT,
  FORGE_PRODUCT_FALLBACK,
  FORGE_PRODUCT_VIEW_CONTRACT,
} from '../../../src/data/forgeProductViews.js';

const AIRTABLE_FIELDS = [
  'Slug',
  'Published',
  'Display order',
  'Eyebrow',
  'Title',
  'Lane',
  'Summary',
  'Workload tags',
  'Highlights',
  'Media path',
  'Media alt',
  'Source projection hash',
];
const ID_PATTERN = /^(?:app|tbl|viw)[A-Za-z0-9]{10,30}$/;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HASH_PATTERN = /^[0-9a-f]{64}$/;
const MEDIA_PATTERN = /^\/assets\/forge\/(?!.*(?:\.\.|\\))[A-Za-z0-9._~!$&'()*+,;=:@%/-]+$/;
const MAX_PAGES = 3;
const MAX_RECORDS = 200;

function jsonResponse(payload, { status = 200, cache = 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400', head = false } = {}) {
  return new Response(head ? null : `${JSON.stringify(payload)}\n`, {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': cache,
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer',
    },
  });
}

function fallback(reason, head) {
  return jsonResponse({
    ...FORGE_PRODUCT_FALLBACK,
    degraded_reason: reason,
  }, {
    cache: 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400',
    head,
  });
}

function cleanText(value, maxLength) {
  if (typeof value !== 'string') return null;
  const cleaned = value.trim();
  return cleaned && cleaned.length <= maxLength ? cleaned : null;
}

function cleanList(value, maxItems = 8, maxLength = 120) {
  const values = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/\r?\n|,/)
      : [];
  const cleaned = values.map((item) => cleanText(item, maxLength)).filter(Boolean);
  return cleaned.length > 0 && cleaned.length <= maxItems ? [...new Set(cleaned)] : null;
}

function mapRecord(record) {
  const fields = record?.fields;
  if (!fields || fields.Published !== true) return null;

  const slug = cleanText(fields.Slug, 80);
  const eyebrow = cleanText(fields.Eyebrow, 120);
  const title = cleanText(fields.Title, 120);
  const lane = cleanText(fields.Lane, 40);
  const summary = cleanText(fields.Summary, 600);
  const workloadTags = cleanList(fields['Workload tags']);
  const highlights = cleanList(fields.Highlights);
  const mediaPath = cleanText(fields['Media path'], 300);
  const mediaAlt = cleanText(fields['Media alt'], 240);
  const projectionHash = cleanText(fields['Source projection hash'], 64);
  const displayOrder = Number(fields['Display order']);

  if (
    !slug || !SLUG_PATTERN.test(slug)
    || !eyebrow || !title || !lane || !summary
    || !workloadTags || !highlights
    || !mediaPath || !MEDIA_PATTERN.test(mediaPath)
    || !mediaAlt
    || !projectionHash || !HASH_PATTERN.test(projectionHash)
    || !Number.isInteger(displayOrder) || displayOrder < 0 || displayOrder > 10000
  ) return null;

  return {
    schema_version: FORGE_PRODUCT_VIEW_CONTRACT,
    slug,
    eyebrow,
    title,
    lane,
    summary,
    workload_tags: workloadTags,
    highlights,
    media: {
      path: mediaPath,
      alt: mediaAlt,
      posture: 'curated_field_media',
      authoritative: false,
    },
    badges: ['OPERATOR REVIEW', 'NOT A QUOTE', 'CONFIGURATION-SPECIFIC'],
    availability_posture: 'inquiry_only',
    pricing_posture: 'scoped_after_review',
    display_order: displayOrder,
    source: {
      authority: 'hypom',
      data_origin: 'airtable_presentation_overlay',
      airtable_overlay_allowed: true,
    },
    projection_hash: projectionHash,
  };
}

function airtableConfigured(env) {
  return Boolean(
    env?.AIRTABLE_PAT
    && ID_PATTERN.test(env.AIRTABLE_BASE_ID || '')
    && ID_PATTERN.test(env.AIRTABLE_TABLE_ID || '')
    && (!env.AIRTABLE_VIEW_ID || ID_PATTERN.test(env.AIRTABLE_VIEW_ID)),
  );
}

function airtableUrl(env, offset) {
  const url = new URL(`https://api.airtable.com/v0/${encodeURIComponent(env.AIRTABLE_BASE_ID)}/${encodeURIComponent(env.AIRTABLE_TABLE_ID)}`);
  url.searchParams.set('pageSize', '100');
  if (env.AIRTABLE_VIEW_ID) url.searchParams.set('view', env.AIRTABLE_VIEW_ID);
  if (offset) url.searchParams.set('offset', offset);
  for (const field of AIRTABLE_FIELDS) url.searchParams.append('fields[]', field);
  return url;
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function fetchAirtable(env, externalFetch) {
  const records = [];
  let offset = null;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    let response;
    try {
      response = await externalFetch(airtableUrl(env, offset), {
        method: 'GET',
        headers: {
          authorization: `Bearer ${env.AIRTABLE_PAT}`,
          accept: 'application/json',
        },
        redirect: 'manual',
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) throw new Error(response.status === 429 ? 'rate_limited' : 'upstream_unavailable');
    const payload = await response.json();
    if (!Array.isArray(payload?.records)) throw new Error('invalid_payload');
    records.push(...payload.records);
    if (records.length > MAX_RECORDS) throw new Error('pagination_limit');
    offset = typeof payload.offset === 'string' && payload.offset.length <= 200 ? payload.offset : null;
    if (!offset) return records;
  }

  throw new Error('pagination_limit');
}

export async function handleForgeProducts(request, env = {}, externalFetch = fetch) {
  const head = request.method === 'HEAD';
  if (!['GET', 'HEAD'].includes(request.method)) {
    return jsonResponse({
      error: { code: 'method_not_allowed', message: 'Only GET and HEAD are supported.' },
    }, { status: 405, cache: 'no-store', head });
  }

  if (!airtableConfigured(env)) return fallback('airtable_not_configured', head);

  try {
    const sourceRecords = await fetchAirtable(env, externalFetch);
    const items = sourceRecords.map(mapRecord).filter(Boolean)
      .sort((left, right) => left.display_order - right.display_order || left.slug.localeCompare(right.slug));
    if (!items.length) return fallback('airtable_no_valid_records', head);

    return jsonResponse({
      schema_version: FORGE_PRODUCT_BUNDLE_CONTRACT,
      items,
      bundle_hash: await sha256(JSON.stringify(items.map((item) => item.projection_hash))),
      source_posture: 'airtable_curated',
      authority_notice: FORGE_PRODUCT_AUTHORITY_NOTICE,
      generated_at: new Date().toISOString(),
    }, { head });
  } catch (error) {
    const known = ['rate_limited', 'upstream_unavailable', 'invalid_payload', 'pagination_limit'];
    return fallback(known.includes(error?.message) ? `airtable_${error.message}` : 'airtable_unavailable', head);
  }
}
