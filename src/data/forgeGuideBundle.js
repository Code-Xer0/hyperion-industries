import { FORGE_PRODUCT_FALLBACK, isForgeProductView } from './forgeProductViews.js';

export const FORGE_GUIDE_BUNDLE_CONTRACT = 'forge-guide-bundle/1';
export const FORGE_GUIDE_SESSION_CONTRACT = 'forge-guide-session/1';
export const FORGE_QUESTION_GRAPH_CONTRACT = 'forge-question-graph/1';
export const FORGE_GUIDE_BUNDLE_HASH = 'ae116d648bd6e5192f3b4bd7a045f40954474286901df594729e4cd2a98d1bb0';

const sources = [
  ['adobe-premiere', 'Adobe Premiere technical requirements', 'Adobe', 'normative', 'https://helpx.adobe.com/premiere/desktop/get-started/technical-requirements/adobe-premiere-pro-technical-requirements.html', 'Premiere 26.0–26.2'],
  ['autodesk-3ds-max', 'Autodesk 3ds Max system requirements', 'Autodesk', 'normative', 'https://help.autodesk.com/view/3DSMAX/2026/ENU/?guid=3dsMax_ReleaseNotes_3dsmax_2026_3_releasenotes_html', '3ds Max 2026.3'],
  ['epic-unreal', 'Unreal Engine hardware and software specifications', 'Epic Games', 'normative', 'https://dev.epicgames.com/documentation/en-us/unreal-engine/hardware-and-software-specifications-for-unreal-engine', 'Unreal Engine 5.8'],
  ['unity-editor', 'Unity Editor system requirements', 'Unity Technologies', 'normative', 'https://docs.unity3d.com/6000.0/Documentation/Manual/system-requirements.html', 'Unity 6.0'],
  ['blackmagic-resolve', 'DaVinci Resolve product capabilities', 'Blackmagic Design', 'normative', 'https://www.blackmagicdesign.com/products/davinciresolve', 'DaVinci Resolve 21'],
  ['obs-studio', 'OBS Studio system requirements', 'OBS Project', 'normative', 'https://obsproject.com/kb/system-requirements', 'KB 2026-07'],
  ['blender-requirements', 'Blender installation requirements', 'Blender Foundation', 'normative', 'https://docs.blender.org/manual/en/latest/getting_started/installing/windows.html', 'Blender 5.2 LTS'],
  ['epic-fortnite', 'Fortnite PC system requirements', 'Epic Games', 'normative', 'https://www.epicgames.com/help/c-202300000001636/c-202300000001690/a202300000012731?lang=en-US', 'PC requirements 2026-07'],
  ['blender-open-data', 'Blender Open Data', 'Blender Foundation', 'measured', 'https://opendata.blender.org/', 'Benchmark schema v4'],
  ['mlcommons-inference', 'MLPerf Inference results', 'MLCommons', 'measured', 'https://mlcommons.org/benchmarks/inference-datacenter/', 'MLPerf Inference v6.0'],
  ['openbenchmarking', 'OpenBenchmarking official suites', 'Phoronix Test Suite', 'measured', 'https://openbenchmarking.org/suites/', 'Official suites 2026-07'],
  ['puget-workflows', 'Workflow-based workstation guidance', 'Puget Systems', 'reviewed', 'https://www.pugetsystems.com/solutions/', 'Workflow index 2026-07'],
  ['cybenetics', 'Efficiency and noise certifications', 'Cybenetics Labs', 'component_spec', 'https://www.cybenetics.com/index.php?option=power-supplies', 'Certification database 2026-05'],
  ['microsoft-windows', 'Windows 11 hardware requirements', 'Microsoft', 'normative', 'https://learn.microsoft.com/en-us/windows/whats-new/windows-11-requirements', 'Windows 11 24H2'],
  ['open-icecat', 'Manufacturer product data', 'Open Icecat', 'component_spec', 'https://icecat.biz/en/menu/channelpartners', 'Open catalog 2026-07'],
].map(([source_id, display_name, organization, evidence_class, source_url, source_version]) => ({
  source_id,
  display_name,
  organization,
  evidence_class,
  source_url,
  source_version,
  state: 'curated_fixture',
  retrieved_at: '2026-07-26T00:00:00Z',
}));

const questions = [
  {
    id: 'destination',
    landmark: 'destination',
    prompt: 'Where should this system take you?',
    help: 'Pick the closest destination. We can fine-tune the route as we go.',
    type: 'single_choice',
    required: true,
    options: [
      ['gaming', 'Play and stream', 'High-refresh play, streaming, and personal systems.'],
      ['creator', 'Create and produce', 'Editing, design, audio, rendering, and production.'],
      ['local_ai', 'Run AI locally', 'Private inference, model work, and local compute.'],
      ['upgrade_repair', 'Upgrade or recover', 'Extend, diagnose, or replace an existing machine.'],
      ['sim_rig', 'Build a sim environment', 'Driving, flight, VR, controls, displays, and room integration.'],
      ['deployment', 'Deploy compute or rack systems', 'Multi-user, edge, rack, and site-readiness work.'],
    ],
  },
  {
    id: 'workloads',
    landmark: 'work',
    prompt: 'What should feel effortless on day one?',
    help: 'Choose known applications or workloads. Anything else stays a review note—not an invented engineering fact.',
    type: 'search_multi',
    required: true,
    allow_free_text: true,
  },
  {
    id: 'output_target',
    landmark: 'work',
    prompt: 'What does the system need to drive or deliver?',
    help: 'Search display and output patterns; unmatched hardware stays an operator note.',
    type: 'search_multi',
    required: false,
    allow_free_text: true,
  },
  {
    id: 'load_pattern',
    landmark: 'work',
    prompt: 'How long will it work hard at a stretch?',
    type: 'single_choice',
    required: true,
    options: [
      ['bursty', 'Short, bursty sessions', 'Heavy work arrives in brief peaks.'],
      ['few_hours', 'A few sustained hours', 'Cooling should settle into a steady rhythm.'],
      ['all_day', 'Most of the workday', 'Sustained thermals and serviceability matter.'],
      ['continuous', 'Continuous or unattended', 'Reliability, headroom, and review posture come first.'],
    ],
  },
  {
    id: 'privacy_posture',
    landmark: 'work',
    prompt: 'How firmly must data stay on your side of the door?',
    type: 'single_choice',
    required: false,
    conditions: { destination: ['local_ai', 'creator', 'deployment'] },
    options: [
      ['standard', 'Standard local workflow', 'Normal desktop data handling.'],
      ['local_preferred', 'Local-first where practical', 'Prefer local custody while keeping options open.'],
      ['local_required', 'Local execution is required', 'Cloud dependence is a material constraint.'],
      ['regulated', 'Policy or regulatory controls apply', 'An operator must review the control environment.'],
    ],
  },
  {
    id: 'footprint',
    landmark: 'room',
    prompt: 'How much room does it get?',
    type: 'single_choice',
    required: true,
    options: [
      ['compact', 'As little as practical', 'Small footprint with explicit thermal and clearance review.'],
      ['balanced', 'A normal desk footprint', 'Balanced service access and cooling.'],
      ['expandable', 'Room for expansion', 'Prioritize access, slots, and future headroom.'],
      ['rack', 'Rack or equipment space', 'A deployment-oriented enclosure and site posture.'],
    ],
  },
  {
    id: 'acoustics',
    landmark: 'room',
    prompt: 'How should it sound in the room?',
    type: 'single_choice',
    required: true,
    options: [
      ['near_silent', 'Disappear into the room', 'Acoustics are a leading design constraint.'],
      ['quiet', 'Quiet under normal work', 'Keep normal work restrained without overconstraining peaks.'],
      ['balanced', 'Balanced noise and cooling', 'Allow sensible fan response under load.'],
      ['performance_first', 'Performance comes first', 'Cooling performance may be audible.'],
    ],
  },
  {
    id: 'budget',
    landmark: 'comfort',
    prompt: 'What spending lane feels responsible?',
    help: 'This guides architecture only. It is not a quote or a live price promise.',
    type: 'single_choice',
    required: true,
    options: [
      ['under_1500', 'Keep the parts posture under $1,500', 'Value-focused architecture and explicit compromises.'],
      ['1500_2500', '$1,500–$2,500', 'A balanced performance and longevity lane.'],
      ['2500_4000', '$2,500–$4,000', 'Higher performance or workstation headroom.'],
      ['4000_plus', '$4,000+ when justified', 'Specialized or no-limits work still requires review.'],
      ['guide_me', 'Help me find the sensible range', 'We will show the tradeoffs that move the architecture up or down.'],
    ],
  },
  {
    id: 'reuse',
    landmark: 'comfort',
    prompt: 'Is anything already coming with you?',
    help: 'Existing parts enter the brief as declared inputs and still require exact compatibility review.',
    type: 'search_multi',
    required: false,
    allow_free_text: true,
  },
  {
    id: 'service',
    landmark: 'comfort',
    prompt: 'Who should be comfortable opening the case later?',
    type: 'single_choice',
    required: true,
    options: [
      ['self_service', 'I maintain and upgrade it', 'Favor accessible, documented, replaceable choices.'],
      ['shared', 'Either me or a technician', 'Balance owner access with managed support.'],
      ['managed', 'Keep it technician-managed', 'Plan around professional service.'],
      ['white_glove', 'Plan for white-glove service', 'Commissioning and service posture stay explicit.'],
    ],
  },
  {
    id: 'timeline',
    landmark: 'comfort',
    prompt: 'When does it need to be ready?',
    type: 'single_choice',
    required: true,
    options: [
      ['exploring', 'I’m exploring', 'Discovery can lead the pace.'],
      ['month', 'Within a month', 'Availability and review timing matter.'],
      ['two_weeks', 'Within two weeks', 'The operator should confirm realistic sourcing posture.'],
      ['urgent', 'As soon as responsibly possible', 'Urgency will not bypass compatibility or review.'],
    ],
  },
];

const cues = [
  ['destination-gaming', { destination: ['gaming'] }, 'We’ll start with the experience, not a parts list.', 'Resolution, refresh target, and the games you actually play tell us more than a generic performance label.', 'welcome', ['microsoft-windows']],
  ['destination-creator', { destination: ['creator'] }, 'Your applications get the first vote.', 'Editing, rendering, simulation, and audio reward different balances of processor, memory, graphics, and storage.', 'welcome', ['adobe-premiere', 'puget-workflows']],
  ['destination-local-ai', { destination: ['local_ai'] }, 'Model fit comes before headline performance.', 'We’ll keep memory capacity, accelerator evidence, power, cooling, and local-data posture visible.', 'welcome', ['mlcommons-inference']],
  ['compact-continuous', { footprint: ['compact'], load_pattern: ['all_day', 'continuous'] }, 'Compact and continuous is a real engineering trade.', 'A smaller enclosure can work, but sustained thermals, acoustics, clearance, and service access need explicit review.', 'watch', ['cybenetics']],
  ['quiet-performance', { acoustics: ['near_silent'], output_target: ['display-1440p-high-refresh', 'display-4k', 'display-vr'] }, 'Quiet power needs breathing room.', 'We may favor a larger cooling envelope or a carefully bounded performance target instead of pretending noise is free.', 'watch', ['cybenetics']],
  ['creator-4k', { destination: ['creator'], output_target: ['display-4k'] }, 'High-resolution work changes the memory and storage conversation.', 'Fast working storage, media capacity, memory headroom, and the application’s own recommendations all stay in view.', 'insight', ['adobe-premiere']],
  ['budget-guide', { budget: ['guide_me'] }, 'That’s a perfectly good answer.', 'We’ll show a sensible architecture lane and the tradeoffs that move it up or down, without inventing a quote.', 'reassure', []],
  ['reuse-review', { reuse: ['__nonempty__'] }, 'Existing parts earn a proper compatibility check.', 'We’ll carry them into review as declared inputs, not assume their exact revision, condition, or fit.', 'watch', ['open-icecat']],
].map(([cue_key, when, title, body, tone, source_ids]) => ({ cue_key, when, title, body, tone, source_ids }));

const applicationAliases = [
  ['adobe-premiere', 'Adobe Premiere', 'application', ['creator', 'video editing'], ['adobe-premiere']],
  ['davinci-resolve', 'DaVinci Resolve', 'application', ['creator', 'video editing'], ['blackmagic-resolve', 'puget-workflows']],
  ['blender', 'Blender', 'application', ['creator', '3D rendering'], ['blender-requirements', 'blender-open-data']],
  ['unreal-engine', 'Unreal Engine', 'application', ['creator', 'engineering', 'game development'], ['epic-unreal', 'puget-workflows']],
  ['unity', 'Unity', 'application', ['game development', 'XR'], ['unity-editor']],
  ['autodesk-3ds-max', 'Autodesk 3ds Max', 'application', ['creator', '3D rendering', 'CAD'], ['autodesk-3ds-max']],
  ['obs-studio', 'OBS Studio', 'application', ['streaming', 'recording'], ['obs-studio']],
  ['stable-diffusion', 'Stable Diffusion', 'model_family', ['local AI', 'image generation'], ['mlcommons-inference']],
  ['local-llms', 'Local language models', 'model_family', ['local AI', 'inference'], ['mlcommons-inference']],
  ['competitive-games', 'High-refresh competitive games', 'workload', ['gaming', 'high refresh'], ['microsoft-windows']],
  ['fortnite', 'Fortnite', 'game', ['gaming', 'high refresh'], ['epic-fortnite']],
  ['flight-sim', 'Flight simulation', 'workload', ['simulation', 'multi-display'], ['openbenchmarking']],
  ['racing-sim', 'Racing simulation', 'workload', ['simulation', 'VR'], ['openbenchmarking']],
  ['cad-simulation', 'CAD and engineering simulation', 'workload', ['engineering', 'workstation'], ['openbenchmarking', 'puget-workflows']],
  ['audio-production', 'Audio production', 'workload', ['creator', 'low latency'], ['puget-workflows']],
  ['display-1080p', '1080p display', 'display', ['everyday', 'single display'], ['microsoft-windows']],
  ['display-1440p-high-refresh', '1440p high-refresh display', 'display', ['gaming', 'high refresh'], ['microsoft-windows']],
  ['display-4k', '4K production display', 'display', ['creator', 'high resolution'], ['adobe-premiere']],
  ['display-multi', 'Multi-display workspace', 'display', ['several outputs', 'productivity'], ['microsoft-windows']],
  ['display-vr', 'VR headset or simulation display', 'display', ['VR', 'simulation'], ['unity-editor', 'epic-unreal']],
  ['display-headless', 'Headless or remote compute', 'display', ['remote', 'rack'], ['microsoft-windows']],
].map(([id, label, kind, tags, source_ids]) => ({ id, label, kind, tags, source_ids }));

export const FORGE_GUIDE_FALLBACK = Object.freeze({
  schema_version: FORGE_GUIDE_BUNDLE_CONTRACT,
  bundle_id: 'HYP-GUIDE-BUNDLED-2026-07-V1',
  bundle_hash: FORGE_GUIDE_BUNDLE_HASH,
  source_manifest_hash: '423524b4b8d8e8bbabef960c73045865e9ba38cead5b703f94eace7c11d3a6a4',
  source_posture: 'bundled_curated_fixture',
  generated_at: '2026-07-26T00:00:00Z',
  graph: {
    schema_version: FORGE_QUESTION_GRAPH_CONTRACT,
    version: 'forge-concierge-2026.07-v1',
    graph_hash: 'a950587043cf4e09c79ee6139276a538db265171948b79617a105d09224fa9bf',
    start_question_id: 'destination',
    landmarks: ['destination', 'work', 'room', 'comfort', 'itinerary'],
    express_question_ids: ['destination', 'workloads', 'budget'],
    questions,
    unknown_policy: 'review',
  },
  cues,
  sources,
  application_aliases: applicationAliases,
  product_views: FORGE_PRODUCT_FALLBACK.items,
  mappings: {
    contract: 'forge-requirements/1',
    destination: {
      gaming: { workload_profile: 'gaming', operational_lane: 'fast_validated' },
      creator: { workload_profile: 'creator', operational_lane: 'workstation' },
      local_ai: { workload_profile: 'local_ai', operational_lane: 'custom_performance' },
      upgrade_repair: { workload_profile: 'custom', operational_lane: 'fast_validated' },
      sim_rig: { workload_profile: 'gaming', operational_lane: 'custom_performance' },
      deployment: { workload_profile: 'engineering', operational_lane: 'workstation' },
    },
    budget_minor: { under_1500: 150000, '1500_2500': 250000, '2500_4000': 400000, '4000_plus': null, guide_me: null },
    footprint: {
      compact: { allowed_motherboard_form_factors: ['Mini-ITX'], compactness: 5 },
      balanced: { allowed_motherboard_form_factors: ['Micro-ATX', 'ATX'], compactness: 2 },
      expandable: { allowed_motherboard_form_factors: ['ATX', 'E-ATX'], compactness: 0 },
      rack: { allowed_motherboard_form_factors: ['ATX', 'E-ATX'], compactness: 1 },
    },
    priority_signals: {
      acoustics: { near_silent: 5, quiet: 4, balanced: 2, performance_first: 0 },
      serviceability: { self_service: 5, shared: 4, managed: 2, white_glove: 2 },
      power_headroom: { bursty: 2, few_hours: 3, all_day: 4, continuous: 5 },
    },
    unknown_policy: 'review',
    public_projection_only: true,
  },
  authority: {
    guidance: 'deterministic_public_projection',
    engineering: 'hypom_operator_review',
    submission_state: 'held_for_review',
    not_a_quote: true,
    no_compatibility_promise: true,
    raw_identity_excluded: true,
  },
});

export function isForgeGuideBundle(value) {
  const safeSources = Array.isArray(value?.sources) && value.sources.length <= 50 && value.sources.every((source) => {
    try {
      const url = new URL(source.source_url);
      return url.protocol === 'https:'
        && !url.username
        && !url.password
        && typeof source.organization === 'string'
        && source.organization.length <= 120
        && ['normative', 'measured', 'reviewed', 'component_spec', 'discovery'].includes(source.evidence_class);
    } catch {
      return false;
    }
  });
  return Boolean(
    value
    && value.schema_version === FORGE_GUIDE_BUNDLE_CONTRACT
    && /^[0-9a-f]{64}$/.test(value.bundle_hash)
    && value.graph?.schema_version === FORGE_QUESTION_GRAPH_CONTRACT
    && Array.isArray(value.graph.questions)
    && value.graph.questions.length >= 3
    && Array.isArray(value.cues)
    && safeSources
    && Array.isArray(value.application_aliases)
    && Array.isArray(value.product_views)
    && value.product_views.every(isForgeProductView)
    && value.authority?.submission_state === 'held_for_review'
  );
}
