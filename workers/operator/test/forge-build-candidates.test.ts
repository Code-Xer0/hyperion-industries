import { describe, expect, it } from "vitest";
import {
  deriveForgeBuildCandidatesProjection,
  forgeBuildCandidatesHashDocument,
  sha256CanonicalDocument,
} from "../../../shared/intake/forge-build-candidates.js";

const guideBundleHash = "a".repeat(64);

const requirements = {
  schema_version: "forge-requirements/1",
  source: "forge-guide-session/1",
  workload_profile: "local_ai",
  operational_lane: "custom_performance",
  workload_refs: ["local-inference"],
  budget: { currency: "USD" as const, parts_ceiling_minor: 400000 },
  cooling_mode: "any" as const,
  allowed_motherboard_form_factors: ["ATX"],
  fresh_offer_required: true,
  unknown_policy: "review",
  required_parts: [],
  excluded_parts: [],
  priorities: {
    workload_fit: 5,
    cost: 4,
    power_headroom: 5,
    evidence: 5,
    serviceability: 4,
    compactness: 2,
    upgradeability: 4,
    acoustics: 3,
  },
  inference: [{ field: "workload_profile", reason_code: "destination_mapping", confidence_basis_points: 9000 }],
  unresolved: [{ field: "output_target", reason_code: "requires_clarification" }],
  operator_notes: [],
  requested_counterfactuals: ["performance_headroom"],
};

describe("forge-build-candidates/1", () => {
  it("returns only deterministic Lean, Balanced, and Headroom concepts", async () => {
    const projection = await deriveForgeBuildCandidatesProjection({
      guide_bundle_hash: guideBundleHash,
      requirements_projection: requirements,
      generated_at: "2026-07-28T12:00:00.000Z",
    });

    expect(projection.schema_version).toBe("forge-build-candidates/1");
    expect(projection.candidates).toHaveLength(3);
    expect(projection.candidates.map((candidate) => candidate.tier)).toEqual(["lean", "balanced", "headroom"]);
    for (const candidate of projection.candidates) {
      expect(candidate.not_quote).toBe(true);
      expect(candidate.compatibility_unverified).toBe(true);
      expect(candidate.component_classes).toEqual(expect.objectContaining({
        cpu: expect.any(String),
        gpu: expect.any(String),
        memory: expect.any(String),
        storage: expect.any(String),
        power: expect.any(String),
        cooling: expect.any(String),
        chassis: expect.any(String),
        os: expect.any(String),
      }));
      expect(candidate.evidence_source_ids.length).toBeGreaterThan(0);
      expect(candidate.confidence_basis_points).toBeGreaterThanOrEqual(0);
      expect(candidate.confidence_basis_points).toBeLessThanOrEqual(10000);
    }
  });

  it("excludes generated_at from the projection hash", async () => {
    const first = await deriveForgeBuildCandidatesProjection({
      guide_bundle_hash: guideBundleHash,
      requirements_projection: requirements,
      generated_at: "2026-07-28T12:00:00.000Z",
    });
    const second = await deriveForgeBuildCandidatesProjection({
      guide_bundle_hash: guideBundleHash,
      requirements_projection: requirements,
      generated_at: "2026-07-29T16:30:00.000Z",
    });

    expect(first.generated_at).not.toBe(second.generated_at);
    expect(first.candidates).toEqual(second.candidates);
    expect(first.projection_hash).toBe(second.projection_hash);
    expect(first.projection_hash).toBe(await sha256CanonicalDocument(forgeBuildCandidatesHashDocument(first)));
  });

  it("includes the preferred candidate in the semantic hash", async () => {
    const base = await deriveForgeBuildCandidatesProjection({
      guide_bundle_hash: guideBundleHash,
      requirements_projection: requirements,
    });
    const preferred = await deriveForgeBuildCandidatesProjection({
      guide_bundle_hash: guideBundleHash,
      requirements_projection: requirements,
      preferred_candidate_id: base.candidates[1]?.candidate_id ?? null,
    });

    expect(preferred.preferred_candidate_id).toBe(base.candidates[1]?.candidate_id);
    expect(preferred.projection_hash).not.toBe(base.projection_hash);
  });

  it("rejects a mismatched requirements projection hash", async () => {
    await expect(deriveForgeBuildCandidatesProjection({
      guide_bundle_hash: guideBundleHash,
      requirements_projection: { ...requirements, projection_hash: "b".repeat(64) },
    })).rejects.toThrow("requirements_projection projection_hash does not match");
  });

  it("keeps unknown workload answers actionable without inventing compatibility", async () => {
    const projection = await deriveForgeBuildCandidatesProjection({
      guide_bundle_hash: guideBundleHash,
      requirements_projection: {
        ...requirements,
        workload_profile: null,
        operational_lane: null,
        workload_refs: [],
        unresolved: [{ field: "workload_profile", reason_code: "requires_clarification" }],
      },
    });

    expect(projection.candidates).toHaveLength(1);
    expect(projection.candidates[0]).toEqual(expect.objectContaining({
      tier: "balanced",
      not_quote: true,
      compatibility_unverified: true,
    }));
    expect(projection.candidates[0]?.component_classes.cpu).toContain("pending workload confirmation");
    expect(projection.candidates[0]?.unresolved_fields).toContain("workload_profile");
  });
});
