export const CONFIGURATOR_VISUALS = Object.freeze({
  forge: Object.freeze({
    asset: '/assets/forge/visuals-v2/forge-exploded-workstation-v1.png',
    alt: 'Illustrative exploded workstation composition with separated component layers.',
    title: 'Forge exploded workstation study',
    accent: 'gold',
  }),
  rackworks: Object.freeze({
    asset: '/assets/forge/visuals-v2/pandora-rackworks-array-v1.png',
    alt: 'Illustrative rack-scale compute array with visible node, fabric, power, and storage layers.',
    title: 'Pandora Rackworks topology study',
    accent: 'cyan',
  }),
  lite_grid: Object.freeze({
    asset: '/assets/forge/visuals-v2/pandora-lite-grid-v1.png',
    alt: 'Illustrative compact compute grid with linked nodes, fabric, frame, and power hub.',
    title: 'Pandora Lite Grid topology study',
    accent: 'lime',
  }),
});

export const VISUAL_AUTHORITY = Object.freeze({
  origin: 'ai_generated_and_procedural',
  posture: 'illustrative_non_authoritative',
  label: 'Illustrative proxy · non-authoritative',
  affects_compatibility: false,
  affects_ranking: false,
  affects_pricing: false,
});

export function visualForLane(lane) {
  return CONFIGURATOR_VISUALS[lane] || CONFIGURATOR_VISUALS.forge;
}

export function assemblyState(roles, selected = {}) {
  const nodes = roles.map((role, index) => ({
    role,
    order: index + 1,
    selected: Boolean(selected[role]),
  }));
  const selectedCount = nodes.filter((node) => node.selected).length;
  return Object.freeze({
    nodes,
    selectedCount,
    totalCount: nodes.length,
    progressBasisPoints: nodes.length ? Math.round((selectedCount * 10000) / nodes.length) : 0,
    complete: nodes.length > 0 && selectedCount === nodes.length,
  });
}

export function partVisualAriaLabel(role, item) {
  const roleLabel = String(role || 'component').replaceAll('_', ' ');
  const identity = [item?.manufacturer, item?.model].filter(Boolean).join(' ').trim();
  return `Illustrative ${roleLabel} proxy${identity ? ` for ${identity}` : ''}; not an exact product image`;
}
