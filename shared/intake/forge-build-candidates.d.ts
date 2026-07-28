export type ForgeBuildCandidateTier = 'lean' | 'balanced' | 'headroom';

export interface ForgeBuildCandidate {
  candidate_id: string;
  tier: ForgeBuildCandidateTier;
  title: string;
  workload_intent: string;
  component_classes: {
    cpu: string;
    gpu: string;
    memory: string;
    storage: string;
    power: string;
    cooling: string;
    chassis: string;
    os: string;
  };
  price_band: {
    currency: 'USD';
    minimum_minor: number | null;
    maximum_minor: number | null;
  };
  service_posture: string;
  tradeoffs: string[];
  evidence_source_ids: string[];
  reason_codes: string[];
  unresolved_fields: string[];
  confidence_basis_points: number;
  not_quote: true;
  compatibility_unverified: true;
}

export interface ForgeBuildCandidatesProjection {
  schema_version: 'forge-build-candidates/1';
  guide_bundle_hash: string;
  requirements_projection_hash: string;
  generated_at: string;
  preferred_candidate_id: string | null;
  candidates: ForgeBuildCandidate[];
  projection_hash: string;
}

export interface ForgeRequirementsProjection {
  projection_hash?: string;
  workload_profile?: string | null;
  operational_lane?: string | null;
  workload_refs?: string[];
  budget?: { currency: 'USD'; parts_ceiling_minor: number } | null;
  cooling_mode?: 'any' | 'air' | 'aio' | 'custom_loop';
  allowed_motherboard_form_factors?: string[];
  priorities?: Record<string, number>;
  inference?: Array<{ field?: string; reason_code?: string; confidence_basis_points?: number }>;
  unresolved?: Array<{ field?: string; reason_code?: string }>;
  requested_counterfactuals?: string[];
  [key: string]: unknown;
}

export const FORGE_BUILD_CANDIDATES_SCHEMA_VERSION: 'forge-build-candidates/1';

export function sha256CanonicalDocument(value: unknown): Promise<string>;

export function forgeBuildCandidatesHashDocument(
  projection: ForgeBuildCandidatesProjection,
): Omit<ForgeBuildCandidatesProjection, 'generated_at' | 'projection_hash'>;

export function deriveForgeBuildCandidatesProjection(input: {
  guide_bundle_hash: string;
  requirements_projection: ForgeRequirementsProjection;
  generated_at?: string;
  preferred_candidate_id?: string | null;
}): Promise<ForgeBuildCandidatesProjection>;
