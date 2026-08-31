export const CONCIERGE_MANIFEST = Object.freeze({
  contract_version: 'hyperion-concierge-narration/1', provider: 'elevenlabs_prerendered', live_agent: false, microphone: false, autoplay: false,
  cues: Object.freeze({
    city: Object.freeze({ title: 'Welcome to Hyperion City', transcript: 'Choose the part of the company that matches the work in front of you. Forge begins with a machine brief. Card Studio begins with identity and proof. Systems begins with the continuity problem.', audio: null, readiness: 'awaiting_master' }),
    'forge-lanes': Object.freeze({ title: 'Choose the pressure, not a bundle', transcript: 'Start with the workload, the room, and the constraints. The Forge keeps missing information visible so an operator can review the whole system before a parts proposal exists.', audio: null, readiness: 'awaiting_master' }),
    'forge-review': Object.freeze({ title: 'Review before proposal', transcript: 'Your build profile is a brief, not a quote. Submission creates a held review record. No payment, purchase, or build starts from the public configurator.', audio: null, readiness: 'awaiting_master' }),
    'card-checkout': Object.freeze({ title: 'Proof before checkout', transcript: 'Design stays local until you submit a revision. A physical card can enter checkout only after proof approval, quote staging, and an explicit operator release.', audio: null, readiness: 'awaiting_master' }),
  }),
});
