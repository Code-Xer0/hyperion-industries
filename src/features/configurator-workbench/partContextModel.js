const STUDY_ROOT = '/assets/forge/component-studies-v1';

export const COMPONENT_STUDIES = Object.freeze({
  cpu: `${STUDY_ROOT}/cpu.webp`,
  motherboard: `${STUDY_ROOT}/motherboard.webp`,
  memory: `${STUDY_ROOT}/memory.webp`,
  gpu: `${STUDY_ROOT}/gpu.webp`,
  storage: `${STUDY_ROOT}/storage.webp`,
  case: `${STUDY_ROOT}/case.webp`,
  cooler: `${STUDY_ROOT}/cooler.webp`,
  psu: `${STUDY_ROOT}/psu.webp`,
});

const PUBLIC_MEDIA_PATH = /^\/assets\/forge\/[a-z0-9/_-]+\.(?:avif|jpe?g|png|webp)$/i;

const cleanRole = (item, role) => role || item?.category || item?.role || 'component';
const itemIdentity = (item) => [item?.manufacturer, item?.model].filter(Boolean).join(' ').trim();
const number = (value) => Number.isFinite(Number(value)) ? Number(value) : null;
const readable = (value) => String(value || 'unknown').replaceAll('_', ' ');

function mediaCandidates(item) {
  return [
    ...(Array.isArray(item?.media_assets) ? item.media_assets : []),
    ...(item?.media && typeof item.media === 'object' ? [item.media] : []),
  ];
}

function licensedExactMedia(item) {
  return mediaCandidates(item).find((candidate) => {
    const path = candidate.rendition_path || candidate.card_path || candidate.path;
    const exactRevision = candidate.part_revision_id === item?.part_revision_id;
    const exactProduct = candidate.exact_product === true || candidate.geometry_posture === 'exact';
    const customerSafe = candidate.publication_posture === 'customer_safe';
    const rightsApproved = ['approved', 'licensed', 'manufacturer_approved'].includes(
      candidate.commercial_use_status || candidate.license_status,
    );
    return PUBLIC_MEDIA_PATH.test(path || '')
      && !path.includes('..')
      && exactRevision
      && exactProduct
      && customerSafe
      && rightsApproved;
  });
}

function variantFor(item) {
  const identity = `${item?.forge_part_id || item?.component_id || ''}:${itemIdentity(item)}`;
  return [...identity].reduce((total, character) => total + character.charCodeAt(0), 0) % 3;
}

export function partMediaPresentation(item, role) {
  const normalizedRole = cleanRole(item, role);
  const study = COMPONENT_STUDIES[normalizedRole] || null;
  const admitted = licensedExactMedia(item);
  const licensedPath = admitted?.rendition_path || admitted?.card_path || admitted?.path || null;
  const identity = itemIdentity(item);

  if (licensedPath) {
    return Object.freeze({
      asset: licensedPath,
      fallbackAsset: study,
      alt: `${identity || readable(normalizedRole)} catalog media`,
      badge: 'Licensed catalog media',
      posture: 'licensed_exact_product',
      variant: variantFor(item),
    });
  }

  return Object.freeze({
    asset: study,
    fallbackAsset: null,
    alt: `Illustrative ${readable(normalizedRole)} study${identity ? ` for the ${identity} catalog row` : ''}; not an exact product image`,
    badge: study ? 'Illustrative study' : 'Illustrative proxy',
    posture: study ? 'illustrative_non_authoritative' : 'procedural_non_authoritative',
    variant: variantFor(item),
  });
}

function roleSummary(role, specs = {}) {
  const power = number(specs.power_w);
  switch (role) {
    case 'cpu':
      return {
        headline: power != null && power <= 65 ? 'Cool-running compute' : power != null && power >= 150 ? 'High-output silicon' : 'Balanced desktop compute',
        blurb: `${specs.socket || 'Socket evidence unresolved'} platform${power == null ? '' : ` with a ${power} W planning envelope`}. This choice sets the board and cooling neighborhood.`,
      };
    case 'motherboard':
      return {
        headline: `${specs.form_factor || 'Form factor unresolved'} platform anchor`,
        blurb: `${specs.socket || 'Socket evidence unresolved'} · ${specs.memory_generation || 'memory generation unresolved'}${number(specs.max_memory_gb) == null ? '' : ` · up to ${specs.max_memory_gb} GB listed capacity`}. The board governs the most downstream fit decisions.`,
      };
    case 'memory':
      return {
        headline: number(specs.capacity_gb) >= 64 ? 'Capacity-forward memory' : 'Balanced memory kit',
        blurb: `${number(specs.capacity_gb) == null ? 'Capacity unresolved' : `${specs.capacity_gb} GB`} of ${specs.memory_generation || 'generation-unresolved'} memory${number(specs.dimm_count) == null ? '' : ` across ${specs.dimm_count} modules`}. Capacity helps concurrency; module count affects future expansion.`,
      };
    case 'gpu':
      return {
        headline: power != null && power >= 300 ? 'Maximum graphics headroom' : power != null && power <= 160 ? 'Efficient graphics route' : 'Performance-balanced graphics',
        blurb: `${number(specs.length_mm) == null ? 'Length evidence unresolved' : `${specs.length_mm} mm listed length`}${power == null ? '' : ` · ${power} W planning draw`}. Clearance, connectors, and power headroom travel with this choice.`,
      };
    case 'storage':
      return {
        headline: number(specs.capacity_gb) >= 4000 ? 'Deep local workspace' : 'Fast primary workspace',
        blurb: `${number(specs.capacity_gb) == null ? 'Capacity unresolved' : `${(specs.capacity_gb / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })} TB listed capacity`} on ${readable(specs.interface)}. The interface is checked separately from endurance and sustained-workload evidence.`,
      };
    case 'case':
      return {
        headline: number(specs.max_gpu_length_mm) <= 340 ? 'Compact enclosure route' : 'Room to build and service',
        blurb: `${number(specs.max_gpu_length_mm) == null ? 'GPU clearance unresolved' : `${specs.max_gpu_length_mm} mm GPU clearance`}${number(specs.max_cooler_height_mm) == null ? '' : ` · ${specs.max_cooler_height_mm} mm cooler clearance`}. Physical room is useful only when the selected board and thermals agree.`,
      };
    case 'cooler':
      return {
        headline: number(specs.height_mm) <= 80 ? 'Low-profile thermal route' : number(specs.height_mm) >= 160 ? 'Large thermal reserve' : 'Balanced thermal package',
        blurb: `${number(specs.height_mm) == null ? 'Height evidence unresolved' : `${specs.height_mm} mm listed height`}. Socket support and case clearance are hard gates; acoustic character remains review evidence.`,
      };
    case 'psu':
      return {
        headline: number(specs.wattage) >= 1000 ? 'Expansion-ready power reserve' : 'Right-sized power foundation',
        blurb: `${number(specs.wattage) == null ? 'Capacity evidence unresolved' : `${specs.wattage} W listed capacity`}. The useful number is headroom after the entire tray is assembled, not wattage in isolation.`,
      };
    default: {
      const facts = Object.entries(specs)
        .filter(([, value]) => ['string', 'number'].includes(typeof value))
        .slice(0, 2)
        .map(([key, value]) => `${readable(key)} ${value}`)
        .join(' · ');
      return {
        headline: 'System role under review',
        blurb: facts ? `${facts}. This summary is derived from the listed catalog facts.` : 'Typed evidence is still sparse, so this component stays visible without an implied pass.',
      };
    }
  }
}

export function partReview(item, recommendation = {}, requirements = {}) {
  const role = cleanRole(item);
  const summary = roleSummary(role, item?.specs || {});
  const available = ['in_stock', 'limited', 'fixture_in_stock'].includes(item?.price?.availability)
    || ['fresh', 'fixture'].includes(item?.price?.freshness);
  const fit = recommendation.fit || 'unknown';
  const source = item?.price?.source_posture || item?.source_posture || item?.data_origin || 'source unresolved';
  let watchOut = 'Formal compatibility and fresh-offer checks still happen at the engineering handoff.';

  if (fit === 'blocker') watchOut = 'This swap currently trips a deterministic browser fit blocker; inspect the tray before choosing it.';
  else if (!available) watchOut = 'No current availability signal is attached, so procurement posture remains unresolved.';
  else if (requirements.priority === 'quiet' && number(item?.specs?.power_w) >= 150) watchOut = 'Your quiet priority makes the cooling and acoustic tradeoff especially important here.';
  else if (requirements.priority === 'compact' && role === 'gpu' && number(item?.specs?.length_mm) >= 300) watchOut = 'Your compact priority puts extra pressure on card length, thickness, and cable bend room.';

  return Object.freeze({
    headline: summary.headline,
    blurb: summary.blurb,
    watchOut,
    evidence: `${Object.keys(item?.specs || {}).length} typed facts · ${readable(source)} · ${recommendation.authority === 'hypom' ? 'HypOM rank' : 'browser preview'}`,
    posture: 'deterministic_spec_summary',
  });
}
