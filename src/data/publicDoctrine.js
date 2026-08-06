export const PUBLIC_DOCTRINE = Object.freeze({
  headline: 'Continuity infrastructure for fragmented operations.',
  summary: 'Hyperion creates governed systems that preserve state across people, places, tools, hardware, documents, decisions, and service workflows.',
  principle: 'Facts are source-bound. Meaning is context-bound. Actions are authority-bound.',
  assessment: 'Begin with the continuity failure. Capture the current state. Produce a useful artifact. Expand only after scope, evidence, permissions, and rollback paths are understood.',
  invariant: Object.freeze([
    Object.freeze({ id: 'capture', label: 'Capture state', detail: 'Record what is true now, including constraints and unknowns.' }),
    Object.freeze({ id: 'provenance', label: 'Preserve provenance', detail: 'Keep facts connected to where they came from and when they were observed.' }),
    Object.freeze({ id: 'context', label: 'Expose context', detail: 'Let each domain explain what the evidence means without erasing the source.' }),
    Object.freeze({ id: 'authority', label: 'Gate authority', detail: 'Make clear who may decide, approve, change, or publish.' }),
    Object.freeze({ id: 'route', label: 'Route action', detail: 'Move approved work into a bounded operating path with a handoff.' }),
    Object.freeze({ id: 'learn', label: 'Learn from reality contact', detail: 'Compare the handoff with what actually happened, then update the evidence without rewriting history.' }),
  ]),
  contract: Object.freeze([
    Object.freeze({ id: 'source', label: 'Source-bound facts', status: 'SOURCE', detail: 'Evidence stays attached to its origin, freshness, and stated limits.' }),
    Object.freeze({ id: 'context', label: 'Context-bound meaning', status: 'CONTEXT', detail: 'Different systems may interpret the same fact without overwriting one another.' }),
    Object.freeze({ id: 'authority', label: 'Authority-bound action', status: 'AUTHORITY', detail: 'A public page can inform and route. It cannot borrow private execution authority.' }),
  ]),
});

export const PUBLIC_MATURITY_LABELS = Object.freeze([
  'LIVE',
  'STABLE BETA',
  'SHIPPING',
  'BY INQUIRY',
  'IN DEVELOPMENT',
  'CONCEPT',
  'RESEARCH',
  'ARCHITECTURE',
  'INTERNAL/PRIVATE',
]);

export function authorityContract(overrides = {}) {
  return Object.freeze({
    source: overrides.source || 'Public evidence and visitor-supplied constraints remain source-labeled.',
    context: overrides.context || 'Hyperion interprets the signal only inside the stated public lane.',
    action: overrides.action || 'Any proposal, commitment, or system change requires the named operator review.',
  });
}
