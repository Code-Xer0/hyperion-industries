export const INTAKE_LANE_SEO = Object.freeze([
  {
    id: 'forge',
    title: 'Forge Build Intake | Hyperion Industries',
    description: 'Scope a custom workstation, local-AI machine, software build, or hybrid system for operator review.',
    summary: 'A bounded intake lane for custom machines, software, automation, and hybrid systems.',
  },
  {
    id: 'pandora',
    title: 'Pandora Infrastructure Readiness | Hyperion Industries',
    description: 'Assess workload, site, power, network, custody, and sponsorship readiness before infrastructure is proposed.',
    summary: 'A readiness lane for serious local compute, accelerator, rack, and infrastructure work.',
  },
  {
    id: 'continuity',
    title: 'Continuity Systems Intake | Hyperion Industries',
    description: 'Map the records, knowledge, and operating context that must survive interruption, handoff, and time.',
    summary: 'A continuity assessment for records, memory, archives, provenance, and operational recovery.',
  },
  {
    id: 'operator-identity',
    title: 'Operator Identity Intake | Hyperion Industries',
    description: 'Scope a durable digital, physical, NFC, or hybrid identity surface without assuming publication.',
    summary: 'A shipping intake lane for operator cards, NFC identity, and public trust surfaces.',
  },
  {
    id: 'support',
    title: 'Hyperion Support Intake | Hyperion Industries',
    description: 'Route an active Hyperion product or service issue without submitting credentials, restricted logs, or private evidence.',
    summary: 'A manual support-triage lane with explicit evidence and authority boundaries.',
  },
  {
    id: 'relationships',
    title: 'Partnership and Relationship Intake | Hyperion Industries',
    description: 'Open a bounded conversation about delivery, technology, research, civic, supplier, or strategic collaboration.',
    summary: 'A proposal-review lane for serious partnership, research, supplier, and civic conversations.',
  },
  {
    id: 'general',
    title: 'General Intake | Hyperion Industries',
    description: 'Route a serious request to Hyperion when no specialist lane is yet justified.',
    summary: 'A manual routing lane that keeps the original signal intact until an operator reviews it.',
  },
]);

export const INTAKE_LANE_SEO_BY_ID = new Map(INTAKE_LANE_SEO.map((lane) => [lane.id, lane]));
