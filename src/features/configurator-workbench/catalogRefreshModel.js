const recordId = (item) => item.forge_part_id || item.component_id;

export function reconcileCatalog(current, incoming, selectedIds, observedAt = new Date().toISOString()) {
  const next = [...incoming];
  const nextIds = new Set(next.map(recordId));
  const selected = new Set(Object.values(selectedIds).filter(Boolean));
  for (const item of current) {
    const id = recordId(item);
    if (!selected.has(id) || nextIds.has(id)) continue;
    next.push({
      ...item,
      lifecycle_state: 'unavailable',
      source_posture: 'availability_changed',
      price: {
        ...(item.price || {}),
        availability: 'unavailable',
        freshness: 'stale',
        source_posture: 'availability_changed',
        observed_at: observedAt,
      },
    });
    nextIds.add(id);
  }
  return next;
}
