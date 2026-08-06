import forgeSource from './contracts/forms/forge-build-profile.form.json';
import forgeConfiguratorSource from './contracts/forms/forge-configurator.form.json';
import pandoraSource from './contracts/forms/pandora-readiness.form.json';
import serviceSource from './contracts/forms/service-lanes.form-blueprints.json';
import universalSource from './contracts/forms/universal-router.form.json';
import contactPatch from './contracts/forms/contact-consent.patch.v1.0.1.json';
import { INTAKE_PUBLIC_CONTRACT_VERSION } from './lane-seo.js';

export const CONTRACT_VERSION = INTAKE_PUBLIC_CONTRACT_VERSION;
export const RULESET_VERSION = 'intake-rules.1.0.1';
export const AGENT_CONTRACT_VERSION = 'proposal-only.1';
export const CUSTODY_CONTRACT_VERSION = 'custody-control.1.0.1';
export const AUTHORITY_BOUNDARY = 'operator_review_only';

export const SOURCE_CONTRACTS = Object.freeze({
  forge: forgeSource,
  forgeConfigurator: forgeConfiguratorSource,
  pandora: pandoraSource,
  services: serviceSource,
  universal: universalSource,
  contactPatch,
});

export const LANE_IDS = [
  'forge',
  'pandora',
  'continuity',
  'operator-identity',
  'support',
  'relationships',
  'general',
] as const;

export type LaneId = (typeof LANE_IDS)[number];
export type AnswerValue = string | number | boolean | string[] | null;
export type AnswerMap = Record<string, AnswerValue | undefined>;

export interface IntakeQuestion {
  id: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'notice';
  required?: boolean;
  hint?: string;
  options?: Array<{ value: string; label: string }>;
  when?: { field: string; equals: AnswerValue };
}

export interface LaneDefinition {
  id: LaneId;
  name: string;
  short: string;
  accent: 'gold' | 'cyan' | 'red';
  maturity: string;
  operatorLine: string;
  questions: {
    signal: IntakeQuestion[];
    load: IntakeQuestion[];
  };
}

const yesNo = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'unknown', label: 'Not sure yet' },
];

export const LANES: Record<LaneId, LaneDefinition> = {
  forge: {
    id: 'forge', name: 'Forge', short: 'Commission a build', accent: 'gold', maturity: 'COMMERCIAL LANE',
    operatorLine: 'Shape a build profile without disguising unknowns.',
    questions: {
      signal: [
        { id: 'desired_outcome', label: 'What must exist when this work is complete?', type: 'textarea', required: true },
        { id: 'build_surface', label: 'What kind of build is this?', type: 'select', required: true, options: [
          { value: 'software', label: 'Software or automation' }, { value: 'hardware', label: 'Hardware or field system' },
          { value: 'hybrid', label: 'A combined hardware and software system' }, { value: 'unknown', label: 'I need help defining it' },
        ] },
      ],
      load: [
        { id: 'local_first', label: 'Must the system keep working under your custody or without a cloud dependency?', type: 'radio', required: true, options: yesNo },
        { id: 'integration_count', label: 'How many existing systems must it connect to?', type: 'select', required: true, options: [
          { value: '0', label: 'None' }, { value: '1-2', label: 'One or two' }, { value: '3+', label: 'Three or more' }, { value: 'unknown', label: 'Unknown' },
        ] },
        { id: 'constraints', label: 'Known constraints, deadlines, environments, or non-negotiables', type: 'textarea', required: true },
        { id: 'artifact_notice', label: 'Files and restricted evidence are not accepted here. An operator can arrange a secure follow-up channel after review.', type: 'notice' },
      ],
    },
  },
  pandora: {
    id: 'pandora', name: 'Pandora', short: 'Assess infrastructure readiness', accent: 'red', maturity: 'ARCHITECTURE REVIEW',
    operatorLine: 'Expose readiness, blockers, and custody constraints before hardware is proposed.',
    questions: {
      signal: [
        { id: 'deployment_goal', label: 'What workload or capability should this infrastructure support?', type: 'textarea', required: true },
        { id: 'site_control', label: 'Do you control the intended site or rack location?', type: 'radio', required: true, options: yesNo },
      ],
      load: [
        { id: 'power_network_readiness', label: 'Current power and network posture', type: 'select', required: true, options: [
          { value: 'documented', label: 'Documented and available' }, { value: 'partial', label: 'Partially known' },
          { value: 'not_ready', label: 'Not ready' }, { value: 'unknown', label: 'Unknown' },
        ] },
        { id: 'regulated_environment', label: 'Is this a regulated, safety-critical, or controlled environment?', type: 'radio', required: true, options: yesNo },
        { id: 'onsite_sponsor', label: 'Is there an accountable on-site technical sponsor?', type: 'radio', required: true, options: yesNo },
        { id: 'artifact_notice', label: 'Do not send facility plans, credentials, or security-sensitive diagrams here. Secure evidence follows operator review.', type: 'notice' },
      ],
    },
  },
  continuity: {
    id: 'continuity', name: 'Continuity', short: 'Protect records and operating context', accent: 'cyan', maturity: 'ASSESSMENT',
    operatorLine: 'Map what must survive interruption, handoff, and time.',
    questions: {
      signal: [
        { id: 'continuity_scope', label: 'What knowledge, records, or operating context must remain usable?', type: 'textarea', required: true },
        { id: 'current_state', label: 'Where does it live today?', type: 'text', required: true },
      ],
      load: [
        { id: 'recovery_priority', label: 'What failure or handoff concerns you most?', type: 'textarea', required: true },
        { id: 'existing_tooling', label: 'Existing tools or repositories involved', type: 'text' },
      ],
    },
  },
  'operator-identity': {
    id: 'operator-identity', name: 'Operator Identity', short: 'Create a durable identity surface', accent: 'gold', maturity: 'SHIPPING',
    operatorLine: 'Define identity, issuance, and public boundaries without assuming publication.',
    questions: {
      signal: [
        { id: 'identity_use', label: 'What should this identity let a person or organization prove?', type: 'textarea', required: true },
        { id: 'credential_type', label: 'Preferred surface', type: 'select', required: true, options: [
          { value: 'digital', label: 'Digital-first' }, { value: 'physical', label: 'Physical card or object' },
          { value: 'hybrid', label: 'Digital and physical' }, { value: 'unknown', label: 'Needs discovery' },
        ] },
      ],
      load: [
        { id: 'audience', label: 'Who needs to recognize or verify it?', type: 'text', required: true },
        { id: 'issuance_scale', label: 'Expected first issuance', type: 'select', required: true, options: [
          { value: '1', label: 'One identity' }, { value: '2-25', label: '2-25 identities' }, { value: '26+', label: 'More than 25' }, { value: 'unknown', label: 'Unknown' },
        ] },
      ],
    },
  },
  support: {
    id: 'support', name: 'Support', short: 'Route an active issue safely', accent: 'red', maturity: 'MANUAL TRIAGE',
    operatorLine: 'Triage impact without collecting credentials, restricted logs, or compromise evidence.',
    questions: {
      signal: [
        { id: 'impact', label: 'What is the current impact?', type: 'select', required: true, options: [
          { value: 'security_or_data_loss', label: 'Possible security incident or data loss' },
          { value: 'site_down', label: 'A service or site is unavailable' }, { value: 'degraded', label: 'Working with degraded behavior' },
          { value: 'question', label: 'Question or non-urgent request' },
        ] },
        { id: 'existing_client', label: 'Is this tied to existing Hyperion work?', type: 'radio', required: true, options: yesNo },
        { id: 'existing_client_reference', label: 'Existing client or project reference', type: 'text', when: { field: 'existing_client', equals: 'yes' } },
      ],
      load: [
        { id: 'affected_surface', label: 'Name the affected public product or service only', type: 'text', required: true },
        { id: 'safe_summary', label: 'Describe symptoms without credentials, private logs, personal data, or exploit details', type: 'textarea', required: true },
        { id: 'safety_notice', label: 'If people are in immediate danger, contact local emergency services. Hyperion intake does not replace emergency response.', type: 'notice' },
      ],
    },
  },
  relationships: {
    id: 'relationships', name: 'Relationships', short: 'Open a partnership conversation', accent: 'cyan', maturity: 'PROPOSAL REVIEW',
    operatorLine: 'Capture mutual intent without implying agreement or authority.',
    questions: {
      signal: [
        { id: 'relationship_type', label: 'What kind of relationship are you exploring?', type: 'select', required: true, options: [
          { value: 'partner', label: 'Delivery or technology partnership' }, { value: 'research', label: 'Research or civic collaboration' },
          { value: 'supplier', label: 'Supplier or manufacturing relationship' }, { value: 'other', label: 'Another relationship' },
        ] },
        { id: 'shared_outcome', label: 'What shared outcome makes the conversation worthwhile?', type: 'textarea', required: true },
      ],
      load: [
        { id: 'organization_context', label: 'Relevant organization or community context', type: 'textarea' },
        { id: 'timing', label: 'Timing or decision window', type: 'text' },
      ],
    },
  },
  general: {
    id: 'general', name: 'General', short: 'Route a signal manually', accent: 'cyan', maturity: 'MANUAL ROUTING',
    operatorLine: 'Keep the signal intact when no specialist lane is yet justified.',
    questions: {
      signal: [
        { id: 'signal_summary', label: 'What are you trying to move forward?', type: 'textarea', required: true },
        { id: 'outcome_needed', label: 'What would a useful next step look like?', type: 'textarea', required: true },
      ],
      load: [
        { id: 'urgency', label: 'Is there a meaningful timing constraint?', type: 'text' },
        { id: 'referral', label: 'How did you reach Hyperion?', type: 'text' },
      ],
    },
  },
};

export interface RoutingEvidence {
  id: string;
  label: string;
  observed: string;
  effect: string;
}

export interface RoutingResult {
  ruleset_version: string;
  agent_contract_version: string;
  primary_route: LaneId;
  classification: string;
  review_priority: 'urgent' | 'standard';
  client_summary: string;
  authority_boundary: typeof AUTHORITY_BOUNDARY;
  evidence: RoutingEvidence[];
  diagnostics_skipped: boolean;
}

const observed = (answers: AnswerMap, key: string) => String(answers[key] ?? 'not provided');
const evidence = (id: string, label: string, value: string, effect: string): RoutingEvidence => ({ id, label, observed: value, effect });

export function isLaneId(value: unknown): value is LaneId {
  return typeof value === 'string' && (LANE_IDS as readonly string[]).includes(value);
}

export function evaluateRoute(input: { lane?: unknown; answers?: AnswerMap; automatedClassification?: boolean }): RoutingResult {
  const answers = input.answers ?? {};
  const requested = isLaneId(input.lane) ? input.lane : 'general';
  const impact = observed(answers, 'impact');
  const base = {
    ruleset_version: RULESET_VERSION,
    agent_contract_version: AGENT_CONTRACT_VERSION,
    custody_contract_version: CUSTODY_CONTRACT_VERSION,
    authority_boundary: AUTHORITY_BOUNDARY,
  } as const;

  if (impact === 'security_or_data_loss' || impact === 'site_down') {
    return {
      ...base, primary_route: 'support', classification: impact === 'security_or_data_loss' ? 'S0' : 'S1',
      review_priority: 'urgent', diagnostics_skipped: true,
      client_summary: 'Your signal is held for urgent manual Support review. Do not send credentials, private logs, or compromise evidence through this site.',
      evidence: [evidence('SG-01', 'Safety and availability gate', impact, 'Urgent operator review takes precedence over diagnostic routing.')],
    };
  }

  if (input.automatedClassification === false) {
    return {
      ...base, primary_route: 'general', classification: 'MANUAL', review_priority: 'standard', diagnostics_skipped: true,
      client_summary: 'Automated classification was declined. The original signal will be reviewed and routed by an operator.',
      evidence: [evidence('CN-01', 'Classification consent', 'declined', 'All automated diagnostics were skipped.')],
    };
  }

  if (requested === 'support' && (observed(answers, 'existing_client') === 'yes' || observed(answers, 'existing_client_reference') !== 'not provided')) {
    return {
      ...base, primary_route: 'support', classification: 'S2', review_priority: 'standard', diagnostics_skipped: false,
      client_summary: 'This signal is proposed for existing-client Support review.',
      evidence: [evidence('SU-01', 'Existing-client precedence', observed(answers, 'existing_client'), 'Support review remains the primary route.')],
    };
  }

  if (requested === 'forge') {
    const systemType = observed(answers, 'forge.system_type');
    if (systemType !== 'not provided') {
      const missing = ['forge.outcome', 'forge.system_type', 'forge.local_first', 'forge.budget', 'forge.timeline']
        .filter((key) => !answers[key] || answers[key] === 'unknown');
      const thermalConflict = answers['forge.form_factor'] === 'very_compact'
        && answers['forge.acoustics'] === 'near_silent'
        && answers['forge.sustained_load'] === 'continuous';
      if (systemType === 'deployment') {
        const readiness = observed(answers, 'power_network_readiness');
        const site = observed(answers, 'site_control');
        const sponsor = observed(answers, 'onsite_sponsor');
        const classification = [readiness, site, sponsor].includes('unknown') || missing.length ? 'PX'
          : readiness === 'not_ready' || site === 'no' ? 'P0'
          : readiness === 'documented' && site === 'yes' && sponsor === 'yes' ? 'P3' : 'P1';
        return {
          ...base, primary_route: 'pandora', classification, review_priority: 'standard', diagnostics_skipped: false,
          client_summary: 'This Forge deployment brief is proposed for Pandora-style readiness review. It is not deployment approval or a hardware commitment.',
          evidence: [
            evidence('FG-01', 'Requested system lane', systemType, 'Routes deployment and rack work through readiness review.'),
            evidence('FG-02', 'Site control', site, 'Site control is required before deployment scope can advance.'),
            evidence('FG-03', 'Power and network', readiness, classification === 'PX' ? 'Material unknowns require clarification.' : 'Records the initial infrastructure posture.'),
          ],
        };
      }
      const classification = missing.length || thermalConflict ? 'FX'
        : ['local_ai', 'sim_rig'].includes(systemType) ? 'F2'
        : systemType === 'upgrade_repair' ? 'F0' : 'F1';
      return {
        ...base, primary_route: 'forge', classification, review_priority: 'standard', diagnostics_skipped: false,
        client_summary: classification === 'FX'
          ? 'This Forge brief contains material unknowns or a physical constraint conflict. An operator will clarify it before any system is proposed.'
          : `This is a ${systemType.replace(/_/g, ' ')} discovery brief for operator review. It is not a quote, compatibility verdict, or build commitment.`,
        evidence: [
          evidence('FG-01', 'Requested system lane', systemType, 'Sets the appropriate Forge review path.'),
          evidence('FG-02', 'Custody posture', observed(answers, 'forge.local_first'), 'Records whether local-first operation is a stated requirement.'),
          evidence('FG-03', 'Material unknowns', missing.join(', ') || (thermalConflict ? 'thermal constraint conflict' : 'none'), missing.length || thermalConflict ? 'Forces operator clarification.' : 'No forced clarification gate applied.'),
        ],
      };
    }
    const missing = ['desired_outcome', 'build_surface', 'local_first', 'constraints'].filter((key) => !answers[key] || answers[key] === 'unknown');
    const classification = missing.length ? 'FX' : observed(answers, 'integration_count') === '3+' || observed(answers, 'build_surface') === 'hybrid' ? 'F2' : 'F1';
    return {
      ...base, primary_route: 'forge', classification, review_priority: 'standard', diagnostics_skipped: false,
      client_summary: classification === 'FX'
        ? 'The Forge profile is incomplete or contains material unknowns. An operator will review it before any build scope is proposed.'
        : `The answers support a ${classification === 'F2' ? 'multi-surface or integrated' : 'focused'} Forge discovery profile. This is not a quote or build commitment.`,
      evidence: [
        evidence('FX-01', 'Build surface', observed(answers, 'build_surface'), 'Sets the initial build complexity band.'),
        evidence('FX-02', 'Integration load', observed(answers, 'integration_count'), 'Raises the profile when three or more systems are involved.'),
        evidence('FX-03', 'Material unknowns', missing.join(', ') || 'none', missing.length ? 'Forces FX and manual clarification.' : 'No FX override applied.'),
      ],
    };
  }

  if (requested === 'pandora') {
    const readiness = observed(answers, 'power_network_readiness');
    const site = observed(answers, 'site_control');
    const sponsor = observed(answers, 'onsite_sponsor');
    const regulated = observed(answers, 'regulated_environment');
    let classification = 'P1';
    if ([readiness, site, sponsor].includes('unknown') || readiness === 'not provided') classification = 'PX';
    else if (readiness === 'not_ready' || site === 'no') classification = 'P0';
    else if (regulated === 'yes' && sponsor !== 'yes') classification = 'P5';
    else if (readiness === 'documented' && site === 'yes' && sponsor === 'yes') classification = 'P3';
    return {
      ...base, primary_route: 'pandora', classification, review_priority: 'standard', diagnostics_skipped: false,
      client_summary: `Pandora readiness is classified ${classification} for operator review. This is a transparent readiness signal, not deployment approval.`,
      evidence: [
        evidence('PX-01', 'Site control', site, 'A controlled site is required before readiness can advance.'),
        evidence('PX-02', 'Power and network', readiness, 'Documents the physical infrastructure baseline.'),
        evidence('PX-03', 'Accountable sponsor', sponsor, 'Required for site evaluation and controlled environments.'),
      ],
    };
  }

  const lane = requested;
  return {
    ...base, primary_route: lane, classification: lane === 'general' ? 'MANUAL' : 'PROPOSED', review_priority: 'standard',
    diagnostics_skipped: lane === 'general',
    client_summary: lane === 'general'
      ? 'The signal remains in General routing for manual operator review.'
      : `The signal is proposed for ${LANES[lane].name} review. No external system has been changed.`,
    evidence: [evidence('RT-01', 'Selected signal lane', lane, 'Creates a proposal for operator review; it does not authorize a domain mutation.')],
  };
}

export function publicContractManifest() {
  return {
    contract_version: CONTRACT_VERSION,
    ruleset_version: RULESET_VERSION,
    agent_contract_version: AGENT_CONTRACT_VERSION,
    authority_boundary: AUTHORITY_BOUNDARY,
    lanes: LANE_IDS,
    source_form_versions: {
      universal: String((universalSource as { version?: unknown }).version ?? '1.0.0'),
      forge: String((forgeSource as { version?: unknown }).version ?? '1.0.0'),
      forge_configurator: String((forgeConfiguratorSource as { version?: unknown }).version ?? '1.0.0'),
      pandora: String((pandoraSource as { version?: unknown }).version ?? '1.0.0'),
      services: String((serviceSource as { version?: unknown }).version ?? '1.0.0'),
      contact_patch: CONTRACT_VERSION,
    },
  };
}
