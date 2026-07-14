export const INTAKE_PUBLIC_CONTRACT_VERSION: string;

export interface IntakeLaneSeoRecord {
  id: string;
  title: string;
  description: string;
  summary: string;
}

export const INTAKE_LANE_SEO: readonly IntakeLaneSeoRecord[];
export const INTAKE_LANE_SEO_BY_ID: Map<string, IntakeLaneSeoRecord>;
