export const FORGE_BUILD_CANDIDATES_SCHEMA_VERSION = 'forge-build-candidates/1';

const HASH_PATTERN = /^[a-f0-9]{64}$/;
const TIERS = Object.freeze(['lean', 'balanced', 'headroom']);
const UNKNOWN_PROFILE = Object.freeze({
  label: 'clarification-first build',
  cpu: ['CPU class pending workload confirmation', 'CPU class pending workload confirmation', 'CPU class pending workload confirmation'],
  gpu: ['graphics or accelerator class pending workload confirmation', 'graphics or accelerator class pending workload confirmation', 'graphics or accelerator class pending workload confirmation'],
  memory: ['memory capacity pending workload confirmation', 'memory capacity pending workload confirmation', 'memory capacity pending workload confirmation'],
  storage: ['storage layout pending workload and retention confirmation', 'storage layout pending workload and retention confirmation', 'storage layout pending workload and retention confirmation'],
  os: 'operating system class pending workload confirmation',
  evidence: ['forge-guide-bundle'],
});

const WORKLOAD_PROFILES = Object.freeze({
  gaming: {
    label: 'gaming and streaming',
    cpu: [
      'current-generation 6-8 core desktop CPU class',
      'current-generation 8-12 core high-clock desktop CPU class',
      'current-generation 12-16 core high-clock desktop CPU class',
    ],
    gpu: [
      'current-generation 8-12 GB discrete graphics class',
      'current-generation 12-16 GB high-refresh graphics class',
      'current-generation 16 GB+ high-refresh graphics class',
    ],
    memory: ['32 GB DDR5 class', '64 GB DDR5 class', '64-96 GB DDR5 class'],
    storage: [
      '1 TB NVMe primary storage class',
      '2 TB NVMe primary plus 2 TB secondary storage class',
      '2 TB high-endurance NVMe primary plus 4 TB secondary storage class',
    ],
    os: 'Windows 11 Pro class',
    evidence: ['epic-fortnite', 'obs-studio', 'openbenchmarking'],
  },
  creator: {
    label: 'creative production',
    cpu: [
      'current-generation 8 core creator CPU class',
      'current-generation 12-16 core creator CPU class',
      'current-generation 16 core+ workstation CPU class',
    ],
    gpu: [
      'current-generation 8-12 GB creator graphics class',
      'current-generation 16 GB creator graphics class',
      'current-generation 24 GB+ creator graphics class',
    ],
    memory: ['32 GB DDR5 class', '64 GB DDR5 class', '128 GB DDR5 or ECC-capable class'],
    storage: [
      '1 TB NVMe system plus 2 TB project storage class',
      '2 TB NVMe system plus 4 TB project storage class',
      '2 TB high-endurance NVMe system plus 4 TB scratch and 8 TB project storage class',
    ],
    os: 'Windows 11 Pro class',
    evidence: ['adobe-premiere', 'blackmagic-resolve', 'blender-requirements'],
  },
  local_ai: {
    label: 'local AI work',
    cpu: [
      'current-generation 8 core host CPU class',
      'current-generation 12-16 core host CPU class',
      'workstation CPU class with expanded PCIe lanes',
    ],
    gpu: [
      'current-generation 16 GB accelerator class',
      'current-generation 24 GB accelerator class',
      '32 GB+ accelerator or reviewed multi-accelerator class',
    ],
    memory: ['64 GB DDR5 class', '128 GB DDR5 or ECC-capable class', '192 GB+ ECC-capable class'],
    storage: [
      '2 TB NVMe model and system storage class',
      '2 TB NVMe system plus 4 TB model storage class',
      '4 TB high-endurance NVMe system plus 8 TB+ model storage class',
    ],
    os: 'operator-selected Windows 11 Pro or supported Linux class',
    evidence: ['mlcommons-inference', 'openbenchmarking', 'cybenetics'],
  },
  engineering: {
    label: 'engineering and deployment',
    cpu: [
      'current-generation 8 core engineering CPU class',
      'current-generation 12-16 core workstation CPU class',
      'workstation CPU class with expanded memory and PCIe capacity',
    ],
    gpu: [
      'workload-fit discrete graphics class pending application review',
      'professional or compute graphics class pending application review',
      'high-memory professional or compute graphics class pending application review',
    ],
    memory: ['32-64 GB DDR5 class', '64-128 GB ECC-capable class', '128 GB+ ECC-capable class'],
    storage: [
      '1 TB NVMe system plus 2 TB project storage class',
      '2 TB NVMe system plus 4 TB project storage class',
      'mirrored or high-endurance storage class pending site review',
    ],
    os: 'operator-selected deployment operating system class',
    evidence: ['autodesk-3ds-max', 'epic-unreal', 'cybenetics'],
  },
  custom: {
    label: 'upgrade or custom system work',
    cpu: [
      'reuse-or-replace CPU class pending platform inspection',
      'current-platform 8-12 core CPU class pending inspection',
      'current-platform workstation CPU class pending inspection',
    ],
    gpu: [
      'reuse-or-replace graphics class pending inventory',
      'workload-fit 12-16 GB graphics class pending inventory',
      'workload-fit 16 GB+ graphics class pending inventory',
    ],
    memory: ['32 GB compatible memory class', '64 GB compatible memory class', '96 GB+ compatible memory class'],
    storage: [
      '1 TB NVMe replacement or expansion class',
      '2 TB NVMe primary plus retained storage class',
      '2 TB high-endurance NVMe plus 4 TB expansion class',
    ],
    os: 'existing-license-compatible operating system class pending review',
    evidence: ['open-icecat', 'openbenchmarking', 'cybenetics'],
  },
});

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .filter((key) => value[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

export async function sha256CanonicalDocument(value) {
  const data = new TextEncoder().encode(canonical(value));
  const digest = await globalThis.crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function uniqueSorted(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.trim()).map((value) => value.trim()))].sort();
}

function requirementHashDocument(requirementsProjection) {
  const { projection_hash: ignored, ...document } = requirementsProjection;
  void ignored;
  return document;
}

function priceBand(ceiling, tierIndex) {
  if (!Number.isInteger(ceiling) || ceiling <= 0) {
    return { currency: 'USD', minimum_minor: null, maximum_minor: null };
  }
  const ranges = [[0.45, 0.65], [0.65, 0.85], [0.85, 1]];
  const [minimumRatio, maximumRatio] = ranges[tierIndex];
  const round = (value) => Math.max(0, Math.round(value / 5000) * 5000);
  return {
    currency: 'USD',
    minimum_minor: round(ceiling * minimumRatio),
    maximum_minor: round(ceiling * maximumRatio),
  };
}

function chassisClass(formFactors, tier) {
  if (!formFactors.length) return 'chassis class pending footprint confirmation';
  const joined = formFactors.join('/');
  if (tier === 'headroom') return `${joined} serviceable expansion chassis class`;
  if (tier === 'lean') return `${joined} value-focused chassis class`;
  return `${joined} balanced-airflow chassis class`;
}

function coolingClass(requirements, tier) {
  const requested = requirements.cooling_mode;
  if (requested && requested !== 'any') return `${requested.replaceAll('_', ' ')} cooling class subject to validation`;
  const acoustics = Number(requirements.priorities?.acoustics ?? 0);
  if (tier === 'lean') return acoustics >= 4 ? 'oversized low-noise air cooling class' : 'high-efficiency air cooling class';
  if (tier === 'balanced') return acoustics >= 4 ? 'low-noise high-capacity air cooling class' : 'high-capacity air or 240 mm AIO class';
  return acoustics >= 4 ? 'operator-reviewed low-noise high-capacity cooling class' : '360 mm AIO or validated high-capacity cooling class';
}

function powerClass(tierIndex, requirements) {
  const continuous = Number(requirements.priorities?.power_headroom ?? 0) >= 4;
  const values = continuous
    ? ['750 W high-efficiency PSU class', '1000 W high-efficiency PSU class', '1200 W+ high-efficiency PSU class']
    : ['650 W high-efficiency PSU class', '850 W high-efficiency PSU class', '1000 W+ high-efficiency PSU class'];
  return values[tierIndex];
}

function servicePosture(requirements, tier) {
  const serviceability = Number(requirements.priorities?.serviceability ?? 0);
  if (tier === 'lean') return serviceability >= 4 ? 'owner-serviceable with documented access' : 'operator-reviewed standard service';
  if (tier === 'balanced') return 'documented service access with replaceable standard components';
  return 'expanded service access, validation evidence, and upgrade headroom';
}

function confidenceBasisPoints(requirements, unresolvedFields) {
  let confidence = 9500 - unresolvedFields.length * 650;
  if (!requirements.budget) confidence -= 750;
  if (!requirements.allowed_motherboard_form_factors?.length) confidence -= 750;
  if (!requirements.workload_refs?.length) confidence -= 350;
  return Math.max(2000, Math.min(9500, confidence));
}

function tradeoffsFor(tier, requirements) {
  const tradeoffs = {
    lean: [
      'Lowest modeled spend posture with less sustained performance and upgrade margin.',
      'May require earlier component replacement as workload demands grow.',
    ],
    balanced: [
      'Balances present workload fit with service and upgrade margin.',
      'Uses more power and budget than the lean concept.',
    ],
    headroom: [
      'Prioritizes sustained load, expansion, and component headroom.',
      'Highest modeled power, cooling, footprint, and budget posture.',
    ],
  }[tier];
  if (Number(requirements.priorities?.compactness ?? 0) >= 4) {
    tradeoffs.push('Compact packaging increases thermal, acoustic, clearance, and service validation work.');
  }
  if (Number(requirements.priorities?.acoustics ?? 0) >= 4) {
    tradeoffs.push('Acoustic restraint may limit sustained boost behavior or require a larger cooling envelope.');
  }
  return tradeoffs;
}

export function forgeBuildCandidatesHashDocument(projection) {
  return {
    schema_version: projection.schema_version,
    guide_bundle_hash: projection.guide_bundle_hash,
    requirements_projection_hash: projection.requirements_projection_hash,
    preferred_candidate_id: projection.preferred_candidate_id,
    candidates: projection.candidates,
  };
}

export async function deriveForgeBuildCandidatesProjection({
  guide_bundle_hash,
  requirements_projection,
  generated_at = new Date().toISOString(),
  preferred_candidate_id = null,
}) {
  if (!HASH_PATTERN.test(String(guide_bundle_hash ?? ''))) {
    throw new TypeError('guide_bundle_hash must be a lowercase SHA-256 hash');
  }
  if (!requirements_projection || typeof requirements_projection !== 'object' || Array.isArray(requirements_projection)) {
    throw new TypeError('requirements_projection must be an object');
  }
  const normalizedGeneratedAt = new Date(generated_at).toISOString();
  const requirementsProjectionHash = await sha256CanonicalDocument(requirementHashDocument(requirements_projection));
  if (requirements_projection.projection_hash && requirements_projection.projection_hash !== requirementsProjectionHash) {
    throw new TypeError('requirements_projection projection_hash does not match its content');
  }

  const workloadProfile = typeof requirements_projection.workload_profile === 'string'
    ? requirements_projection.workload_profile
    : '';
  const knownProfile = WORKLOAD_PROFILES[workloadProfile];
  const profile = knownProfile || UNKNOWN_PROFILE;
  const baseUnresolved = uniqueSorted([
    ...(requirements_projection.unresolved ?? []).map((item) => item?.field),
    ...(!requirements_projection.budget ? ['budget'] : []),
    ...(!requirements_projection.allowed_motherboard_form_factors?.length ? ['allowed_motherboard_form_factors'] : []),
    ...(!requirements_projection.workload_refs?.length ? ['workload_refs'] : []),
    ...(!profile ? ['workload_profile'] : []),
  ]);
  const formFactors = uniqueSorted(requirements_projection.allowed_motherboard_form_factors ?? []);
  const inferenceReasons = (requirements_projection.inference ?? []).map((item) => item?.reason_code);
  const counterfactualReasons = (requirements_projection.requested_counterfactuals ?? [])
    .map((item) => `counterfactual.${item}`);
  const confidence = confidenceBasisPoints(requirements_projection, baseUnresolved);

  const tiers = knownProfile ? TIERS : ['balanced'];
  const candidates = tiers.map((tier) => {
    const tierIndex = TIERS.indexOf(tier);
    return {
    candidate_id: `forge_candidate_${tier}_${requirementsProjectionHash.slice(0, 16)}`,
    tier,
    title: `${tier[0].toUpperCase()}${tier.slice(1)} ${profile.label} concept`,
    workload_intent: `A ${tier} architecture posture for ${profile.label}; operator review remains required.`,
    component_classes: {
      cpu: profile.cpu[tierIndex],
      gpu: profile.gpu[tierIndex],
      memory: profile.memory[tierIndex],
      storage: profile.storage[tierIndex],
      power: powerClass(tierIndex, requirements_projection),
      cooling: coolingClass(requirements_projection, tier),
      chassis: chassisClass(formFactors, tier),
      os: profile.os,
    },
    price_band: priceBand(requirements_projection.budget?.parts_ceiling_minor, tierIndex),
    service_posture: servicePosture(requirements_projection, tier),
    tradeoffs: tradeoffsFor(tier, requirements_projection),
    evidence_source_ids: uniqueSorted(profile.evidence),
    reason_codes: uniqueSorted([
      `tier.${tier}`,
      `workload.${workloadProfile}`,
      requirements_projection.operational_lane ? `operational_lane.${requirements_projection.operational_lane}` : 'operational_lane.unresolved',
      ...inferenceReasons,
      ...counterfactualReasons,
    ]),
    unresolved_fields: baseUnresolved,
    confidence_basis_points: confidence,
    not_quote: true,
    compatibility_unverified: true,
    };
  });

  if (preferred_candidate_id !== null && !candidates.some((candidate) => candidate.candidate_id === preferred_candidate_id)) {
    throw new TypeError('preferred_candidate_id must identify a generated candidate');
  }

  const semanticProjection = {
    schema_version: FORGE_BUILD_CANDIDATES_SCHEMA_VERSION,
    guide_bundle_hash,
    requirements_projection_hash: requirementsProjectionHash,
    preferred_candidate_id,
    candidates,
  };
  return {
    schema_version: semanticProjection.schema_version,
    guide_bundle_hash: semanticProjection.guide_bundle_hash,
    requirements_projection_hash: semanticProjection.requirements_projection_hash,
    generated_at: normalizedGeneratedAt,
    preferred_candidate_id: semanticProjection.preferred_candidate_id,
    candidates: semanticProjection.candidates,
    projection_hash: await sha256CanonicalDocument(semanticProjection),
  };
}
