export type CardBounds = Readonly<{ x: number; y: number; width: number; height: number }>;
export type CardArtifact = Readonly<{
  id: string;
  pack: string;
  name: string;
  renderer_token: string;
  compatible_sides: readonly ("front" | "back")[];
  default_bounds: CardBounds;
  checksum: string;
  kind: string;
  tokens?: Readonly<{ surface: string; ink: string; accent: string }>;
}>;

export const CARD_ARTIFACT_CATALOG: Readonly<{
  contract_version: "card-artifact-catalog/1";
  catalog_version: string;
  packs: readonly Readonly<{ id: string; name: string; count: number }>[];
  items: readonly CardArtifact[];
}>;
export const CARD_TEMPLATE_CATALOG: Readonly<{ contract_version: string; catalog_version: string; items: readonly unknown[] }>;
export const CARD_EXAMPLE_CATALOG: Readonly<{ contract_version: "card-example-catalog/1"; catalog_version: string; items: readonly unknown[] }>;
export const CARD_ARTIFACT_BY_ID: ReadonlyMap<string, CardArtifact>;
export const CARD_TEMPLATE_BY_ID: ReadonlyMap<string, unknown>;
export const CARD_EXAMPLE_BY_ID: ReadonlyMap<string, unknown>;
export const BUILTIN_CARD_ASSET_IDS: ReadonlySet<string>;
export function isKnownCardArtifactReference(id: string): boolean;
export function catalogStarter(id: string): unknown | null;
