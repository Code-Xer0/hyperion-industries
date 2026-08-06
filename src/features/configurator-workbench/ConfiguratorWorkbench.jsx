import { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, ArrowLeft, ArrowRight, Box, Check, ChevronRight, CircleDot,
  Database, Eye, Gauge, ImageOff, LoaderCircle, PackageCheck, Search,
  RefreshCw, ShieldCheck, SlidersHorizontal, Sparkles, Zap,
} from 'lucide-react';
import {
  FORGE_CONFIGURATOR_FALLBACK,
  PANDORA_CONFIGURATOR_FALLBACK,
} from '../../data/configuratorFallbacks.js';
import BuildStage from './BuildStage.jsx';
import OrderReadiness from './OrderReadiness.jsx';
import PartVisual from './PartVisual.jsx';
import { partReview } from './partContextModel.js';
import {
  VISUAL_AUTHORITY,
  assemblyState,
  visualForLane,
} from './configuratorVisualModel.js';
import { reconcileCatalog } from './catalogRefreshModel.js';
import './ConfiguratorWorkbench.css';

const FORGE_ROLES = ['cpu', 'motherboard', 'memory', 'gpu', 'storage', 'case', 'cooler', 'psu'];
const RACK_ROLES = ['rack_enclosure', 'compute_node', 'accelerator', 'storage_shelf', 'network_switch', 'management_node', 'rack_pdu'];
const LITE_ROLES = ['lite_node', 'lite_switch', 'lite_frame', 'lite_power_hub'];
const LABELS = {
  cpu: 'Processor', motherboard: 'Motherboard', memory: 'Memory', gpu: 'Graphics',
  storage: 'Storage', case: 'Case', cooler: 'Cooling', psu: 'Power supply',
  rack_enclosure: 'Rack enclosure', compute_node: 'Compute node', accelerator: 'Accelerator',
  storage_shelf: 'Storage shelf', network_switch: 'Network fabric', management_node: 'Management',
  rack_pdu: 'Rack power', lite_node: 'Lite node', lite_switch: 'Lite fabric',
  lite_frame: 'Grid frame', lite_power_hub: 'Power hub',
};
const DEFAULT_FORGE = {
  cpu: 'HYP-PART-FIX-CPU-7800X3D',
  motherboard: 'HYP-PART-FIX-MB-X670E',
  memory: 'HYP-PART-FIX-RAM-DDR5-32',
  gpu: 'HYP-PART-FIX-GPU-4070S',
  storage: 'HYP-PART-FIX-SSD-2TB',
  case: 'HYP-PART-FIX-CASE-NORTH',
  cooler: 'HYP-PART-FIX-COOLER-D15',
  psu: 'HYP-PART-FIX-PSU-850',
};

const money = (minor, currency = 'USD') => typeof minor === 'number'
  ? new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(minor / 100)
  : 'Price unresolved';

const itemId = (item) => item.forge_part_id || item.component_id;
const itemRole = (item) => item.category || item.role;
const itemPrice = (item) => item.price?.unit_landed_cost_minor ?? item.price?.amount_minor ?? null;
const itemPricePosture = (item) => item.price?.source_posture || item.source_posture || 'unknown';
const title = (item) => `${item.manufacturer} ${item.model}`.trim();
const isObservedAvailable = (item) => {
  const availability = item.price?.availability;
  return ['in_stock', 'limited', 'fixture_in_stock'].includes(availability)
    || item.price?.freshness === 'fresh'
    || item.price?.freshness === 'fixture';
};

function browserRecommendation(item, selected, role, lane, requirements) {
  const previewIssues = compatibility({ ...selected, [role]: item }, lane);
  if (previewIssues.length) return { score: 0, fit: 'blocker', authority: 'browser_preview' };
  const authoritative = item.recommendation?.authority === 'hypom';
  if (authoritative) return {
    score: item.recommendation.score_basis_points,
    fit: item.recommendation.fit_posture,
    authority: 'hypom',
  };
  let score = 5000;
  const price = itemPrice(item);
  if (price != null) score += Math.max(0, 1400 - Math.min(1400, Math.floor(price / 500)));
  if (isObservedAvailable(item)) score += 700;
  if (requirements.priority === 'compact') {
    score += Math.max(0, 900 - Number(item.specs?.length_mm || item.specs?.height_mm || 300) * 2);
  }
  if (requirements.priority === 'quiet') score += Math.max(0, 800 - Number(item.specs?.power_w || 0) * 2);
  if (requirements.priority === 'headroom') {
    score += Math.min(1200, Number(item.specs?.wattage || item.specs?.capacity_gb || item.specs?.max_memory_gb || 0));
  }
  const workloadRoles = {
    gaming: ['cpu', 'gpu'],
    creator: ['cpu', 'gpu', 'memory', 'storage'],
    local_ai: ['gpu', 'memory', 'storage'],
    engineering: ['cpu', 'gpu', 'memory'],
  };
  if (workloadRoles[requirements.workload]?.includes(role)) score += 800;
  return { score: Math.min(10000, score), fit: 'browser_preview', authority: 'browser_preview' };
}

function compatibility(selected, lane) {
  if (lane !== 'forge') return [];
  const cpu = selected.cpu;
  const board = selected.motherboard;
  const memory = selected.memory;
  const gpu = selected.gpu;
  const chassis = selected.case;
  const cooler = selected.cooler;
  const psu = selected.psu;
  const issues = [];
  if (cpu && board && cpu.specs.socket !== board.specs.socket) issues.push({ code: 'socket', label: 'CPU and motherboard sockets do not match.' });
  if (board && memory && board.specs.memory_generation !== memory.specs.memory_generation) issues.push({ code: 'memory_generation', label: 'Memory generation does not match the motherboard.' });
  if (board && chassis && !chassis.specs.supported_form_factors?.includes(board.specs.form_factor)) issues.push({ code: 'form_factor', label: 'Motherboard form factor does not fit the selected case.' });
  if (gpu && chassis && gpu.specs.length_mm > chassis.specs.max_gpu_length_mm) issues.push({ code: 'gpu_clearance', label: 'Graphics card length exceeds the case clearance.' });
  if (cooler && chassis && cooler.specs.height_mm > chassis.specs.max_cooler_height_mm) issues.push({ code: 'cooler_clearance', label: 'Cooler height exceeds the case clearance.' });
  if (cooler && cpu && !cooler.specs.supported_sockets?.includes(cpu.specs.socket)) issues.push({ code: 'cooler_socket', label: 'Cooler mount does not support the selected CPU socket.' });
  const estimatedPower = [cpu, memory, gpu, cooler, selected.storage].reduce((sum, item) => sum + Number(item?.specs?.power_w || 0), 75);
  if (psu && psu.specs.wattage < Math.ceil(estimatedPower * 1.25)) issues.push({ code: 'psu_headroom', label: 'Power supply does not retain the 25% planning headroom.' });
  return issues;
}

function SpecStrip({ item }) {
  const entries = Object.entries(item.specs || {})
    .filter(([, value]) => ['string', 'number'].includes(typeof value))
    .slice(0, 3);
  return <div className="bench-specs">{entries.map(([key, value]) => <span key={key}><b>{String(value)}</b>{key.replaceAll('_', ' ')}</span>)}</div>;
}

function PartCard({ item, recommendation, chosen, lane, requirements, onChoose }) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const review = partReview(item, recommendation, requirements);
  const reviewId = `forge-read-${itemId(item).replace(/[^a-z0-9_-]/gi, '-')}`;
  return (
    <article className={`${chosen ? 'is-selected ' : ''}${reviewOpen ? 'is-review-open' : ''}`}>
      <PartVisual item={item} role={itemRole(item)} selected={chosen} lane={lane} />
      <div className="bench-part-copy">
        <span>{item.manufacturer} · {itemPricePosture(item).replaceAll('_', ' ')}</span>
        <h3>{item.model}</h3>
        <div className="bench-recommendation">
          <b>{recommendation.authority === 'hypom' ? 'HypOM ranked' : 'Preview ranked'}</b>
          <span>{recommendation.fit.replaceAll('_', ' ')}</span>
          <em>{Math.round(recommendation.score / 100)}%</em>
        </div>
        <SpecStrip item={item} />
      </div>
      <div className="bench-part-action">
        <strong>{money(itemPrice(item), item.price?.currency || 'USD')}</strong>
        <small>{isObservedAvailable(item) ? `${item.price?.freshness || 'observed'} · available posture` : 'availability unresolved'}</small>
        <button type="button" onClick={() => onChoose(item)}>{chosen ? 'On tray' : 'Choose'}</button>
        <button
          type="button"
          className="bench-review-toggle"
          aria-expanded={reviewOpen}
          aria-controls={reviewId}
          onClick={() => setReviewOpen((current) => !current)}
        >
          <Eye size={13} /> Forge read
        </button>
      </div>
      <aside className="bench-part-review" id={reviewId} aria-label={`Forge review notes for ${title(item)}`}>
        <header><span>SPEC-DERIVED FORGE READ</span><strong>{review.headline}</strong></header>
        <p>{review.blurb}</p>
        <small><AlertTriangle size={12} />{review.watchOut}</small>
        <em>{review.evidence}</em>
      </aside>
    </article>
  );
}

function GuideRail({ lane, role, selected, issues }) {
  const chosen = selected[role];
  let message = `Let’s choose the ${LABELS[role]?.toLowerCase()}. I’ll keep the rest of the route visible while you compare.`;
  if (chosen) message = `${title(chosen)} is on the tray. The running estimate and fit checks have been recalculated.`;
  if (issues.length) message = `${issues.length} fit issue${issues.length === 1 ? '' : 's'} need attention. Nothing gets silently passed.`;
  return (
    <aside className="bench-guide">
      <span><Sparkles size={15} /> {lane === 'forge' ? 'Forge Bellhop' : 'Pandora Guide'}</span>
      <h2>{issues.length ? 'A quick stop before we keep going.' : 'I know this neighborhood.'}</h2>
      <p>{message}</p>
      <div className="bench-guide-rule"><ShieldCheck size={15} /><span>Browser checks are previews. The domain service owns formal validation.</span></div>
    </aside>
  );
}

function ForgeControls({ requirements, setRequirements }) {
  return (
    <div className="bench-questions">
      <label><span>What is this machine here to do?</span><select value={requirements.workload} onChange={(event) => setRequirements((current) => ({ ...current, workload: event.target.value }))}><option value="gaming">Gaming</option><option value="creator">Creator work</option><option value="local_ai">Local AI</option><option value="engineering">Engineering</option><option value="general">General purpose</option></select></label>
      <label><span>Parts ceiling</span><select value={requirements.budget} onChange={(event) => setRequirements((current) => ({ ...current, budget: Number(event.target.value) }))}><option value="150000">Up to $1,500</option><option value="250000">Up to $2,500</option><option value="400000">Up to $4,000</option><option value="700000">Up to $7,000</option></select></label>
      <label><span>What matters most?</span><select value={requirements.priority} onChange={(event) => setRequirements((current) => ({ ...current, priority: event.target.value }))}><option value="balanced">Balanced</option><option value="quiet">Quiet</option><option value="compact">Compact</option><option value="headroom">Performance headroom</option><option value="service">Service access</option></select></label>
    </div>
  );
}

function PandoraControls({ lane, requirements, setRequirements }) {
  const rack = lane === 'rackworks';
  return (
    <div className="bench-questions">
      <label><span>{rack ? 'Compute nodes' : 'Lite nodes'}</span><input type="number" min={rack ? 1 : 2} max={rack ? 20 : 64} value={requirements.nodeCount} onChange={(event) => setRequirements((current) => ({ ...current, nodeCount: Number(event.target.value) }))} /></label>
      <label><span>Circuit envelope</span><select value={requirements.circuit} onChange={(event) => setRequirements((current) => ({ ...current, circuit: Number(event.target.value) }))}>{(rack ? [5000, 10000, 20000] : [1800, 2400, 5000]).map((value) => <option value={value} key={value}>{value.toLocaleString()} W</option>)}</select></label>
      <label><span>Network fabric</span><select value={requirements.fabric} onChange={(event) => setRequirements((current) => ({ ...current, fabric: event.target.value }))}>{(rack ? ['25gbe', '100gbe'] : ['2.5gbe', '10gbe']).map((value) => <option value={value} key={value}>{value.toUpperCase()}</option>)}</select></label>
    </div>
  );
}

export default function ConfiguratorWorkbench({ lane }) {
  const forge = lane === 'forge';
  const rack = lane === 'rackworks';
  const domain = forge ? 'forge' : 'pandora';
  const roles = forge ? FORGE_ROLES : rack ? RACK_ROLES : LITE_ROLES;
  const storageKey = `hyperion-${lane}-workbench-v1`;
  const [catalog, setCatalog] = useState([]);
  const [sourcePosture, setSourcePosture] = useState('loading');
  const [catalogMeta, setCatalogMeta] = useState({ total: 0, generatedAt: null, refreshState: 'loading' });
  const [selectedRole, setSelectedRole] = useState(roles[0]);
  const [selectedIds, setSelectedIds] = useState(forge ? DEFAULT_FORGE : {});
  const [query, setQuery] = useState('');
  const [catalogSort, setCatalogSort] = useState('recommended');
  const [showBlocked, setShowBlocked] = useState(false);
  const [visibleCount, setVisibleCount] = useState(8);
  const [requirements, setRequirements] = useState(forge
    ? { workload: 'gaming', budget: 250000, priority: 'balanced' }
    : { nodeCount: rack ? 2 : 4, circuit: rack ? 10000 : 2400, fabric: rack ? '25gbe' : '2.5gbe' });
  const [runtime, setRuntime] = useState({ state: 'idle', message: 'Local draft ready.', result: null });
  const [failedVisualAsset, setFailedVisualAsset] = useState(null);

  useEffect(() => {
    try {
      const draft = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (draft) {
        setSelectedIds(draft.selectedIds || (forge ? DEFAULT_FORGE : {}));
        setRequirements(draft.requirements || requirements);
      } else if (forge) {
        const guide = JSON.parse(localStorage.getItem('hyperion-forge-concierge-v2') || 'null');
        if (guide?.answers) {
          const destination = guide.answers.destination;
          const budgetMap = { under_1500: 150000, '1500_2500': 250000, '2500_4000': 400000, '4000_plus': 700000 };
          const priority = guide.answers.footprint === 'compact'
            ? 'compact'
            : ['near_silent', 'quiet'].includes(guide.answers.acoustics)
              ? 'quiet'
              : guide.answers.service === 'self_service'
                ? 'service'
                : 'balanced';
          setRequirements({
            workload: destination === 'deployment' ? 'engineering' : destination === 'sim_rig' ? 'gaming' : destination || 'general',
            budget: budgetMap[guide.answers.budget] || 250000,
            priority,
          });
        }
      }
    } catch { /* local draft is optional */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forge, storageKey]);

  const refreshCatalog = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setCatalogMeta((current) => ({ ...current, refreshState: 'loading' }));
    const params = new URLSearchParams();
    if (forge) {
      params.set('limit', '200');
      params.set('workload_profile', requirements.workload);
      params.set('priority', requirements.priority);
      params.set('sort', 'recommended');
      const selectedPartIds = Object.values(selectedIds).filter(Boolean);
      if (selectedPartIds.length) params.set('selected_part_ids', selectedPartIds.join(','));
    } else {
      params.set('lane', lane === 'rackworks' ? 'rackworks' : 'lite_grid');
    }
    try {
      const response = await fetch(`/api/configurator/${domain}?${params}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('catalog_unavailable');
      const payload = await response.json();
      const observedAt = payload.generated_at || new Date().toISOString();
      setCatalog((current) => reconcileCatalog(current, payload.items || [], selectedIds, observedAt));
      setSourcePosture(payload.source_posture || 'unknown');
      setCatalogMeta({
        total: payload.pagination?.total ?? payload.items?.length ?? 0,
        generatedAt: observedAt,
        refreshState: 'current',
      });
    } catch {
      const fallback = forge
        ? FORGE_CONFIGURATOR_FALLBACK
        : {
            ...PANDORA_CONFIGURATOR_FALLBACK,
            items: PANDORA_CONFIGURATOR_FALLBACK.items.filter(
              (item) => item.product_lane === (rack ? 'rackworks' : 'lite_grid'),
            ),
          };
      setCatalog((current) => reconcileCatalog(current, fallback.items, selectedIds, fallback.generated_at || new Date().toISOString()));
      setSourcePosture(fallback.source_posture);
      setCatalogMeta({
        total: fallback.pagination?.total ?? fallback.items.length,
        generatedAt: fallback.generated_at || null,
        refreshState: 'degraded',
      });
    }
  }, [domain, forge, lane, rack, requirements.priority, requirements.workload, selectedIds]);

  useEffect(() => { refreshCatalog(); }, [refreshCatalog]);
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') refreshCatalog({ silent: true }); };
    const timer = window.setInterval(refresh, 60_000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [refreshCatalog]);

  const byId = useMemo(() => new Map(catalog.map((item) => [itemId(item), item])), [catalog]);
  const selected = useMemo(() => Object.fromEntries(
    Object.entries(selectedIds).map(([role, id]) => [role, byId.get(id)]).filter(([, item]) => item),
  ), [byId, selectedIds]);
  const issues = useMemo(() => compatibility(selected, lane), [lane, selected]);
  const ranked = useMemo(() => catalog
    .filter((item) => itemRole(item) === selectedRole && `${item.manufacturer} ${item.model} ${itemId(item)}`.toLowerCase().includes(query.toLowerCase()))
    .map((item) => ({ item, recommendation: browserRecommendation(item, selected, selectedRole, lane, requirements) }))
    .filter(({ recommendation }) => showBlocked || recommendation.fit !== 'blocker')
    .sort((left, right) => {
      if (catalogSort === 'price_asc') return (itemPrice(left.item) ?? Number.MAX_SAFE_INTEGER) - (itemPrice(right.item) ?? Number.MAX_SAFE_INTEGER) || itemId(left.item).localeCompare(itemId(right.item));
      if (catalogSort === 'price_desc') return (itemPrice(right.item) ?? -1) - (itemPrice(left.item) ?? -1) || itemId(left.item).localeCompare(itemId(right.item));
      if (catalogSort === 'name') return title(left.item).localeCompare(title(right.item));
      return right.recommendation.score - left.recommendation.score || itemId(left.item).localeCompare(itemId(right.item));
    }), [catalog, catalogSort, lane, query, requirements, selected, selectedRole, showBlocked]);
  const filtered = ranked.slice(0, visibleCount);
  const total = useMemo(() => Object.values(selected).reduce((sum, item) => sum + (itemPrice(item) || 0), 0), [selected]);
  const pricedCount = Object.values(selected).filter((item) => itemPrice(item) != null).length;
  const availablePricedCount = Object.values(selected).filter((item) => itemPrice(item) != null && isObservedAvailable(item)).length;
  const availabilityChangedCount = Object.values(selected).filter((item) => item.source_posture === 'availability_changed').length;
  const visual = visualForLane(lane);
  const visualAvailable = failedVisualAsset !== visual.asset;
  const assembly = useMemo(() => assemblyState(roles, selected), [roles, selected]);

  useEffect(() => { setVisibleCount(8); }, [catalogSort, query, selectedRole, showBlocked]);

  const choose = (item) => {
    setSelectedIds((current) => ({ ...current, [selectedRole]: itemId(item) }));
    setRuntime({ state: 'idle', message: `${title(item)} added to the local tray.`, result: null });
    const nextIndex = roles.indexOf(selectedRole) + 1;
    if (nextIndex < roles.length) setSelectedRole(roles[nextIndex]);
  };

  const save = () => {
    localStorage.setItem(storageKey, JSON.stringify({
      schema_version: 'hyperion-configurator-draft/1',
      lane,
      selectedIds,
      requirements,
      authority_result: runtime.result,
      saved_at: new Date().toISOString(),
    }));
    setRuntime((current) => current.result
      ? { ...current, state: 'complete', message: 'Authority receipt and device draft saved.' }
      : { state: 'saved', message: 'Draft saved on this device.', result: null });
  };

  const forgeRequirements = () => {
    const priority = requirements.priority;
    return {
      schema_version: 'forge-requirements/1',
      workload_profile: requirements.workload,
      operational_lane: requirements.workload === 'local_ai' ? 'workstation' : 'fast_validated',
      budget: { currency: 'USD', max_parts_minor: requirements.budget },
      minimums: {
        memory_gb: selected.memory?.specs?.capacity_gb || 16,
        storage_gb: selected.storage?.specs?.capacity_gb || 1000,
        gpu_count: 1,
      },
      constraints: {
        cooling_mode: 'any',
        allowed_motherboard_form_factors: selected.motherboard?.specs?.form_factor ? [selected.motherboard.specs.form_factor] : [],
        required_part_ids: [],
        excluded_part_ids: [],
        max_complexity_score: 30,
        fresh_offer_required: true,
      },
      priorities: {
        workload_fit: 5,
        cost: priority === 'balanced' ? 4 : 3,
        power_headroom: priority === 'headroom' ? 5 : 3,
        evidence: 5,
        serviceability: priority === 'service' ? 5 : 3,
        compactness: priority === 'compact' ? 5 : 1,
        upgradeability: 3,
        acoustics: priority === 'quiet' ? 5 : 2,
      },
      unknown_policy: 'review',
    };
  };

  const pandoraRequirements = () => rack ? {
    schema_version: 'pandora-rackworks-requirements/1',
    product_lane: 'rackworks',
    workload_lane: 'mixed',
    node_count: requirements.nodeCount,
    accelerator_count: requirements.nodeCount,
    memory_gb_total: requirements.nodeCount * 256,
    usable_storage_tb: 48,
    rack_units_available: 42,
    circuit_capacity_w: requirements.circuit,
    network_fabric: requirements.fabric,
    redundancy: 'power',
    cooling_posture: 'contained_air',
    max_budget_minor: Math.max(total * 2, 500000),
    component_overrides: Object.fromEntries(Object.entries(selectedIds).filter(([, id]) => id)),
  } : {
    schema_version: 'pandora-lite-grid-requirements/1',
    product_lane: 'lite_grid',
    workload_lane: 'mixed',
    node_count: requirements.nodeCount,
    memory_gb_per_node: 64,
    storage_gb_per_node: 1024,
    circuit_capacity_w: requirements.circuit,
    network_fabric: requirements.fabric,
    placement: 'shelf',
    acoustic_posture: 'balanced',
    max_budget_minor: Math.max(total * 2, 200000),
    component_overrides: Object.fromEntries(Object.entries(selectedIds).filter(([, id]) => id)),
  };

  const runReview = async () => {
    setRuntime({ state: 'loading', message: 'Opening the engineering desk…', result: null });
    const idempotency = crypto.randomUUID();
    try {
      const payload = forge ? {
        schema_version: 'forge-build-session/1',
        title: `${requirements.workload.replaceAll('_', ' ')} Forge draft`,
        requirements: forgeRequirements(),
        selected_items: Object.entries(selectedIds).filter(([, id]) => id).map(([role, forge_part_id]) => ({ role, forge_part_id, quantity: 1 })),
      } : {
        schema_version: 'pandora-plan-create/1',
        title: rack ? 'Pandora Rackworks draft' : 'Pandora Lite Grid draft',
        requirements: pandoraRequirements(),
      };
      const response = await fetch(`/api/configurator/${domain}/${forge ? 'builds' : 'plans'}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json', 'idempotency-key': idempotency },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error?.message || body?.detail || 'Managed engineering runtime is unavailable.');
      setRuntime({
        state: 'complete',
        message: forge ? 'Immutable Forge draft created. Formal composition can now continue at the engineering desk.' : 'Immutable Pandora plan created and validated.',
        result: body,
      });
      localStorage.setItem(storageKey, JSON.stringify({ schema_version: 'hyperion-configurator-draft/1', lane, selectedIds, requirements, authority_result: body, saved_at: new Date().toISOString() }));
    } catch (error) {
      save();
      setRuntime({ state: 'local', message: `${error.message} Your device draft is safe and clearly remains local-only.`, result: null });
    }
  };

  const meta = forge
    ? { eyebrow: 'HYPERION // FORGE BUILD BENCH', heading: 'Build it with the whole map visible.', copy: 'Compare components, see every price source and fit check move, then create an immutable engineering draft.', back: '/forge/configurator', canonical: '/forge/configurator/build' }
    : rack
      ? { eyebrow: 'HYPERION // PANDORA RACKWORKS', heading: 'Lay out the rack before the room pays for it.', copy: 'Shape nodes, fabric, power, and enclosure capacity with explicit site-review posture.', back: '/pandora', canonical: '/pandora/configurator' }
      : { eyebrow: 'HYPERION // PANDORA LITE GRID', heading: 'Compose a small fleet as one system.', copy: 'Explore compact nodes, fabric, frames, and circuit headroom without pretending a draft is a deployment.', back: '/pandora-lite', canonical: '/pandora-lite/configurator' };

  return (
    <main className={`configurator-workbench is-${lane}`}>
      <Helmet><title>{forge ? 'Forge PC Builder' : rack ? 'Pandora Rackworks Configurator' : 'Pandora Lite Grid Configurator'} | Hyperion Industries</title><meta name="description" content={meta.copy} /><link rel="canonical" href={`https://hyperion-industries.dev${meta.canonical}`} /></Helmet>
      <div className="bench-shell">
        <header className="bench-hero">
          <div><Link to={meta.back}><ArrowLeft size={14} />Back to the guided route</Link><span>{meta.eyebrow}</span><h1>{meta.heading}</h1><p>{meta.copy}</p></div>
          <div className="bench-source"><CircleDot /><span>Source posture</span><strong>{sourcePosture.replaceAll('_', ' ')}</strong><small>{catalogMeta.total} catalog records · {catalogMeta.generatedAt ? `checked ${new Date(catalogMeta.generatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'awaiting first refresh'}</small><button type="button" onClick={() => refreshCatalog()} disabled={catalogMeta.refreshState === 'loading'}><RefreshCw className={catalogMeta.refreshState === 'loading' ? 'bench-spin' : ''} />Refresh availability</button></div>
        </header>
        {forge ? <ForgeControls requirements={requirements} setRequirements={setRequirements} /> : <PandoraControls lane={lane} requirements={requirements} setRequirements={setRequirements} />}
        <GuideRail lane={lane} role={selectedRole} selected={selected} issues={issues} />
        <section className="bench-cinematic" aria-label={`${visual.title} and interactive assembly preview`}>
          <figure className={`bench-concept-art${visualAvailable ? '' : ' is-missing'}`}>
            <div className="bench-concept-frame">
              {visualAvailable
                ? <img src={visual.asset} alt={visual.alt} onError={() => setFailedVisualAsset(visual.asset)} />
                : <div className="bench-concept-fallback"><ImageOff /><span>Concept reference unavailable</span></div>}
              <span className="bench-concept-scan" aria-hidden="true" />
              <span className="bench-concept-index" aria-hidden="true">{String(Math.min(assembly.selectedCount, assembly.totalCount)).padStart(2, '0')} / {String(assembly.totalCount).padStart(2, '0')}</span>
            </div>
            <figcaption>
              <span className="bench-concept-eyebrow">AI-GENERATED CONCEPT REFERENCE</span>
              <h2>{visual.title}</h2>
              <p>Use this for spatial orientation and build storytelling only. Exact identity and engineering checks come from the selected records.</p>
              <span className="bench-visual-truth"><ShieldCheck size={14} />{VISUAL_AUTHORITY.label}</span>
            </figcaption>
          </figure>
          <BuildStage
            lane={lane}
            selected={selected}
            selectedRole={selectedRole}
            roles={roles}
            issues={issues}
          />
        </section>
        <div className="bench-grid">
          <nav className="bench-roles" aria-label="Component categories">
            {roles.map((role, index) => {
              const chosen = selected[role];
              return <button type="button" key={role} className={selectedRole === role ? 'is-active' : ''} onClick={() => setSelectedRole(role)}><span>{chosen ? <Check size={13} /> : String(index + 1).padStart(2, '0')}</span><div><strong>{LABELS[role]}</strong><small>{chosen ? chosen.model : 'Choose a component'}</small></div><ChevronRight size={14} /></button>;
            })}
          </nav>
          <section className="bench-catalog">
            <header>
              <div><span>NOW VISITING</span><h2>{LABELS[selectedRole]}</h2><small>{ranked.length} matching option{ranked.length === 1 ? '' : 's'} · ranked for {requirements.workload.replaceAll('_', ' ')}</small></div>
              <div className="bench-catalog-tools">
                <label className="bench-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${LABELS[selectedRole].toLowerCase()}…`} /></label>
                <label className="bench-sort"><SlidersHorizontal /><select value={catalogSort} onChange={(event) => setCatalogSort(event.target.value)}><option value="recommended">Recommended</option><option value="price_asc">Price low to high</option><option value="price_desc">Price high to low</option><option value="name">Manufacturer / model</option></select></label>
                <label className="bench-show-blocked"><input type="checkbox" checked={showBlocked} onChange={(event) => setShowBlocked(event.target.checked)} /><span>Show fit blockers</span></label>
              </div>
            </header>
            <div className="bench-part-list">
              {filtered.map(({ item, recommendation }) => {
                const chosen = selectedIds[selectedRole] === itemId(item);
                return <PartCard key={itemId(item)} item={item} recommendation={recommendation} chosen={chosen} lane={lane} requirements={requirements} onChoose={choose} />;
              })}
              {!ranked.length && <div className="bench-empty"><Database /><strong>No compatible components in this view.</strong><p>Change the search, show fit blockers, or wait for the next managed-source refresh.</p></div>}
              {ranked.length > visibleCount && <button type="button" className="bench-load-more" onClick={() => setVisibleCount((current) => current + 8)}>Show 8 more <span>{ranked.length - visibleCount} remaining</span></button>}
            </div>
          </section>
          <aside className="bench-tray">
            <header><PackageCheck /><div><span>BUILD TRAY</span><strong>{Object.keys(selected).length}/{roles.length} stops</strong></div></header>
            <div className="bench-total"><span>Running estimate</span><strong>{money(total)}</strong><small>{pricedCount} observed line{pricedCount === 1 ? '' : 's'} · not a quote</small></div>
            <div className="bench-fit">
              <span>Fit posture</span>
              {issues.length ? issues.map((issue) => <p key={issue.code}><AlertTriangle />{issue.label}</p>) : <p className="is-good"><Check />No deterministic browser blocker found.</p>}
              {availabilityChangedCount > 0 && <p><RefreshCw />{availabilityChangedCount} selected part{availabilityChangedCount === 1 ? '' : 's'} left the current feed. The saved choice remains visible for replacement.</p>}
              {!forge && <p><Gauge />Formal circuit and topology checks run when the plan is created.</p>}
            </div>
            <div className="bench-runtime" data-state={runtime.state}><span>{runtime.state === 'loading' ? <LoaderCircle className="bench-spin" /> : runtime.state === 'complete' ? <Check /> : <Zap />}</span><p>{runtime.message}</p></div>
            {runtime.result && <div className="bench-result"><span>Authority receipt</span><strong>{runtime.result.build_id || runtime.result.plan_id}</strong><small>{runtime.result.revision?.revision_hash?.slice(0, 16)}…</small></div>}
            <div className="bench-actions"><button type="button" className="is-secondary" onClick={save}>Save device draft</button><button type="button" disabled={runtime.state === 'loading' || (forge && issues.length > 0)} onClick={runReview}>{runtime.state === 'loading' ? 'Opening desk…' : 'Create engineering draft'}<ArrowRight size={15} /></button><a href="#purchase-desk">Open purchase desk<ArrowRight size={15} /></a></div>
            <footer><Box /><span>No checkout · no order · no compatibility promise</span></footer>
          </aside>
        </div>
        <OrderReadiness
          lane={lane}
          roles={roles}
          selectedIds={selectedIds}
          issues={issues}
          sourcePosture={sourcePosture}
          pricedCount={availablePricedCount}
          total={total}
          requirements={requirements}
          runtime={runtime}
          onSave={save}
        />
      </div>
    </main>
  );
}
