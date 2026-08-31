export const CHRONOS_SERVICES = Object.freeze([
  Object.freeze({
    id: 'assessment',
    name: 'Archive Assessment',
    price: '$149',
    priceMinor: 14900,
    summary: 'A bounded review of the archive, failure mode, custody posture, and the first recovery sequence.',
    deliverables: Object.freeze(['60-minute working session', 'Archive risk map', 'Prioritized next-step brief']),
  }),
  Object.freeze({
    id: 'setup',
    name: 'CHR0N.OS Setup',
    price: '$399',
    priceMinor: 39900,
    summary: 'A guided local installation, initial archive structure, and operator handoff for one workstation.',
    deliverables: Object.freeze(['Public beta installation', 'Initial archive configuration', 'Recorded operating notes']),
  }),
  Object.freeze({
    id: 'migration',
    name: 'Archive Migration',
    price: 'From $900',
    priceMinor: 90000,
    summary: 'A reviewed migration plan for scattered files and project records, with provenance preserved.',
    deliverables: Object.freeze(['Source inventory', 'Migration and rollback plan', 'Reviewed intake execution']),
  }),
  Object.freeze({
    id: 'team',
    name: 'Team Continuity Setup',
    price: 'From $2,000',
    priceMinor: 200000,
    summary: 'A scoped team archive and handoff system with ownership, retention, and support boundaries.',
    deliverables: Object.freeze(['Team workflow mapping', 'Custody and access posture', 'Implementation proposal']),
  }),
]);

export const LIVE_SITE_SERIES = Object.freeze([
  Object.freeze({ id: 'signal', name: 'Live Signal', price: '$1,500', summary: 'A focused, cinematic launch surface for one clear offer and one conversion path.' }),
  Object.freeze({ id: 'presence', name: 'Live Presence', price: '$3,500', summary: 'A complete company site with offer architecture, proof, inquiry, and launch-ready content.' }),
  Object.freeze({ id: 'system', name: 'Live System', price: '$7,500', summary: 'A site plus governed intake, operational handoff, and the first durable automation surface.' }),
  Object.freeze({ id: 'infrastructure', name: 'Live Infrastructure', price: '$15,000+', summary: 'A broader public-and-operator system spanning site, intake, evidence, deployment, and continuity.' }),
]);

export const COMMERCE_POSTURE = Object.freeze({
  contract_version: 'hyperion.commerce-readiness/2',
  public_status: 'SANDBOX SETUP · PAYMENTS NOT YET ACTIVE',
  proposal_gate: true,
  providers: Object.freeze({
    paypal: Object.freeze({ role: 'primary', mode: 'sandbox', state: 'configuration_required' }),
    stripe: Object.freeze({ role: 'standby', mode: 'sandbox', state: 'configuration_required' }),
    shopify: Object.freeze({ role: 'disabled', mode: 'disabled', state: 'not_active' }),
  }),
});
