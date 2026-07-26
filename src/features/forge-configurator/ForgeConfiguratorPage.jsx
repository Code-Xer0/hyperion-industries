import { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ArrowRight, Check, CircleAlert, Cpu, Gauge, HardDrive, LoaderCircle, ShieldCheck, Sparkles, Wrench } from 'lucide-react';
import contract from '../../../shared/intake/contracts/forms/forge-configurator.form.json';
import { CONTRACT_VERSION, evaluateRoute } from '../../../shared/intake/model';
import './ForgeConfiguratorPage.css';

const API_ORIGIN = import.meta.env.PROD
  ? 'https://hyperion-operator.hyperion-industries-intake.workers.dev'
  : '';
const LOCAL_KEY = 'hyperion-forge-configurator-v1';
const LOCAL_RETENTION_MS = 14 * 24 * 60 * 60 * 1000;
const STEPS = ['System', 'Workload', 'Limits', 'Handoff', 'Review'];

const makeId = (prefix) => {
  const value = globalThis.crypto?.randomUUID?.().replaceAll('-', '')
    || `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${value.padEnd(12, 'x')}`;
};

async function api(path, options = {}) {
  const response = await fetch(`${API_ORIGIN}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
  });
  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(body?.error?.message || 'The Forge intake service is temporarily unavailable.');
    error.code = body?.error?.code || 'request_failed';
    throw error;
  }
  return body;
}

const sharedFields = {
  system: [
    { id: 'forge.outcome', label: 'What must this system make possible?', type: 'textarea', required: true, hint: 'Describe the outcome, not a parts list.' },
    { id: 'forge.location', label: 'Where will it live?', type: 'select', required: true, options: [['desk_home', 'Desk / home'], ['desk_office', 'Desk / office'], ['studio_lab', 'Studio / lab'], ['field_mobile', 'Field / mobile'], ['rack_server', 'Rack / equipment room'], ['unknown', 'Not sure yet']] },
    { id: 'forge.local_first', label: 'Should it remain useful without a cloud dependency?', type: 'select', required: true, options: [['yes', 'Yes, custody matters'], ['no', 'No strong preference'], ['unknown', 'Not sure yet']] },
  ],
  limits: [
    { id: 'forge.form_factor', label: 'Size envelope', type: 'select', required: true, options: [['standard_tower', 'Standard tower'], ['compact', 'Compact'], ['very_compact', 'Very compact'], ['rack', 'Rack / equipment case'], ['no_constraint', 'No strong size limit'], ['unknown', 'Not sure yet']] },
    { id: 'forge.acoustics', label: 'Noise envelope', type: 'select', required: true, options: [['flexible', 'Flexible'], ['normal_office', 'Normal office'], ['quiet_studio', 'Quiet studio'], ['near_silent', 'Near silent'], ['unknown', 'Not sure yet']] },
    { id: 'forge.visual', label: 'Visual direction', type: 'checks', options: [['understated', 'Understated'], ['hyperion_cinematic', 'Hyperion cinematic'], ['client_brand', 'Client brand'], ['rgb_controlled', 'Controlled RGB'], ['no_lighting', 'No lighting']] },
    { id: 'forge.budget', label: 'Budget boundary', type: 'select', required: true, options: [['under_1500', 'Under $1,500'], ['1500_2500', '$1,500–$2,500'], ['2500_4000', '$2,500–$4,000'], ['4000_6500', '$4,000–$6,500'], ['6500_plus', '$6,500+'], ['unknown', 'Need a recommendation']] },
    { id: 'forge.timeline', label: 'Timing posture', type: 'select', required: true, options: [['flexible', 'Flexible / discovery first'], ['one_month', 'About one month'], ['quarter', 'This quarter'], ['urgent', 'A real deadline exists'], ['unknown', 'Not sure yet']] },
  ],
  handoff: [
    { id: 'forge.services', label: 'What should Hyperion carry?', type: 'checks', required: true, options: [['architecture', 'Architecture'], ['parts_sourcing', 'Parts sourcing'], ['assembly', 'Assembly'], ['os_setup', 'OS and application setup'], ['data_migration', 'Data migration'], ['delivery', 'Delivery / install'], ['benchmarking', 'Benchmarking'], ['documentation', 'Documentation']] },
    { id: 'forge.support', label: 'Support posture', type: 'select', required: true, options: [['handoff_only', 'Handoff only'], ['warranty_only', 'Warranty / repair'], ['scheduled_support', 'Scheduled support'], ['managed_support', 'Managed support'], ['unknown', 'Decide after discovery']] },
  ],
};

const branchFields = {
  desktop: [
    { id: 'forge.workloads', label: 'Primary workloads', type: 'checks', required: true, options: [['gaming', 'Gaming'], ['software_development', 'Software development'], ['office_web', 'Daily work'], ['streaming', 'Streaming'], ['data_analysis', 'Data analysis']] },
    { id: 'forge.applications', label: 'Games, applications, or tools that define success', type: 'textarea', required: true },
    { id: 'forge.sustained_load', label: 'Heavy-load duration', type: 'select', required: true, options: [['rare_bursts', 'Rare bursts'], ['hours_weekly', 'Hours weekly'], ['hours_daily', 'Hours daily'], ['continuous', 'Continuous'], ['unknown', 'Not sure yet']] },
  ],
  creator: [
    { id: 'forge.workloads', label: 'Primary workloads', type: 'checks', required: true, options: [['video_editing', 'Video editing'], ['photo_design', 'Photo / design'], ['3d_rendering', '3D rendering'], ['audio', 'Audio production'], ['simulation_cad', 'CAD / simulation']] },
    { id: 'forge.applications', label: 'Applications, engines, or codecs that define success', type: 'textarea', required: true },
    { id: 'forge.sustained_load', label: 'Heavy-load duration', type: 'select', required: true, options: [['hours_weekly', 'Hours weekly'], ['hours_daily', 'Hours daily'], ['continuous', 'Continuous'], ['unknown', 'Not sure yet']] },
  ],
  local_ai: [
    { id: 'forge.ai_level', label: 'How central is local AI?', type: 'select', required: true, options: [['exploring', 'Exploring'], ['regular_inference', 'Regular inference'], ['daily_service', 'Daily service'], ['training_or_tuning', 'Training / tuning'], ['unknown', 'Not sure yet']] },
    { id: 'forge.applications', label: 'Models, applications, data scale, or workload targets', type: 'textarea', required: true },
    { id: 'forge.data_scale', label: 'Active data that must remain fast', type: 'select', required: true, options: [['under_1tb', 'Under 1 TB'], ['1_to_4tb', '1–4 TB'], ['4_to_12tb', '4–12 TB'], ['over_12tb', 'Over 12 TB'], ['unknown', 'Not sure yet']] },
    { id: 'forge.sustained_load', label: 'Heavy-load duration', type: 'select', required: true, options: [['hours_daily', 'Hours daily'], ['continuous', 'Continuous'], ['unknown', 'Not sure yet']] },
  ],
  upgrade_repair: [
    { id: 'forge.current_path', label: 'Current work', type: 'select', required: true, options: [['upgrade', 'Upgrade'], ['repair_diagnose', 'Repair / diagnose'], ['replace', 'Replace a current machine'], ['unknown', 'Need help deciding']] },
    { id: 'forge.current_specs', label: 'Current system and known specifications', type: 'textarea', required: true },
    { id: 'forge.reuse_parts', label: 'Parts worth evaluating for reuse', type: 'checks', options: [['cpu', 'CPU'], ['gpu', 'GPU'], ['memory', 'Memory'], ['storage', 'Storage'], ['power_supply', 'Power supply'], ['case', 'Case'], ['nothing', 'Nothing / unknown']] },
    { id: 'forge.current_failure', label: 'What currently breaks, slows down, or feels wrong?', type: 'textarea', required: true },
  ],
  sim_rig: [
    { id: 'forge.sim_titles', label: 'Primary titles, vehicles, or simulation environments', type: 'textarea', required: true },
    { id: 'forge.sim_displays', label: 'Display / VR target', type: 'select', required: true, options: [['single', 'Single display'], ['triple', 'Triple display'], ['ultrawide', 'Ultrawide'], ['vr', 'VR'], ['mixed', 'Mixed / unsure']] },
    { id: 'forge.sim_controls', label: 'Controls and physical gear', type: 'textarea', required: true, hint: 'Wheelbase, pedals, flight controls, motion, audio, or existing hardware.' },
    { id: 'forge.room_constraints', label: 'Room, mounting, delivery, or power constraints', type: 'textarea', required: true },
  ],
  deployment: [
    { id: 'deployment_goal', label: 'What workload or capability should this deployment support?', type: 'textarea', required: true },
    { id: 'site_control', label: 'Do you control the intended site or rack location?', type: 'select', required: true, options: [['yes', 'Yes'], ['no', 'No'], ['unknown', 'Not sure yet']] },
    { id: 'power_network_readiness', label: 'Current power and network posture', type: 'select', required: true, options: [['documented', 'Documented and available'], ['partial', 'Partially known'], ['not_ready', 'Not ready'], ['unknown', 'Not sure yet']] },
    { id: 'onsite_sponsor', label: 'Is there an accountable on-site technical sponsor?', type: 'select', required: true, options: [['yes', 'Yes'], ['no', 'No'], ['unknown', 'Not sure yet']] },
    { id: 'regulated_environment', label: 'Is the environment regulated or controlled?', type: 'select', required: true, options: [['yes', 'Yes'], ['no', 'No'], ['unknown', 'Not sure yet']] },
  ],
};

function valuePresent(value) {
  return Array.isArray(value) ? value.length > 0 : Boolean(String(value || '').trim());
}

function FormField({ field, value, onChange }) {
  const current = value ?? (field.type === 'checks' ? [] : '');
  if (field.type === 'textarea') {
    return <label className="forge-field forge-field-wide"><span>{field.label}{field.required && <b> *</b>}</span>{field.hint && <small>{field.hint}</small>}<textarea value={current} rows="4" onChange={(event) => onChange(field.id, event.target.value)} /></label>;
  }
  if (field.type === 'select') {
    return <label className="forge-field"><span>{field.label}{field.required && <b> *</b>}</span><select value={current} onChange={(event) => onChange(field.id, event.target.value)}><option value="">Select one</option>{field.options.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>;
  }
  if (field.type === 'checks') {
    return <fieldset className="forge-field forge-field-wide forge-checks"><legend>{field.label}{field.required && <b> *</b>}</legend><div>{field.options.map(([id, label]) => <label key={id}><input type="checkbox" checked={current.includes(id)} onChange={(event) => onChange(field.id, event.target.checked ? [...current, id] : current.filter((item) => item !== id))} /><span>{label}</span></label>)}</div></fieldset>;
  }
  return null;
}

function Panel({ label, title, children, tone = 'default' }) {
  return <section className={`forge-panel is-${tone}`}><div className="forge-panel-head"><span>{label}</span>{title && <h2>{title}</h2>}</div>{children}</section>;
}

function StatusBadge({ children, tone = 'gold' }) {
  return <span className={`forge-status is-${tone}`}>{children}</span>;
}

function branchLabel(id) {
  return contract.branches.find((branch) => branch.id === id)?.label || 'Forge brief';
}

function deriveProfile(branch, answers) {
  const missing = [];
  const required = [...sharedFields.system, ...(branchFields[branch] || []), ...sharedFields.limits, ...sharedFields.handoff]
    .filter((field) => field.required);
  required.forEach((field) => { if (!valuePresent(answers[field.id]) || answers[field.id] === 'unknown') missing.push(field.label); });
  const conflicts = [];
  if (answers['forge.form_factor'] === 'very_compact' && answers['forge.acoustics'] === 'near_silent' && answers['forge.sustained_load'] === 'continuous') {
    conflicts.push('Very compact, near-silent, continuous-load systems need an operator thermal review.');
  }
  if (branch === 'deployment' && ['unknown', 'not_ready'].includes(answers.power_network_readiness)) {
    conflicts.push('Deployment readiness is incomplete until power and network posture are clarified.');
  }
  return { missing, conflicts, completion: required.length ? Math.round(((required.length - missing.length) / required.length) * 100) : 0 };
}

export default function ForgeConfiguratorPage() {
  const [branch, setBranch] = useState('');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [identity, setIdentity] = useState({ name: '', email: '', organization: '', preference: 'email', phone: '' });
  const [consent, setConsent] = useState(false);
  const [clientReviewed, setClientReviewed] = useState(false);
  const [decision, setDecision] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [revision, setRevision] = useState(1);
  const [supersedes, setSupersedes] = useState(null);
  const ids = useRef({ intake: makeId('int'), session: makeId('ses'), trace: makeId('trc'), idempotency: makeId('idem') });
  const errorRef = useRef(null);
  const headingRef = useRef(null);

  useEffect(() => {
    try {
      const draft = JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null');
      if (draft?.expires_at > Date.now()) {
        setBranch(draft.branch || ''); setStep(Math.min(draft.step || 0, 4)); setAnswers(draft.answers || {});
        setIdentity((current) => ({ ...current, ...(draft.identity || {}) })); setConsent(Boolean(draft.consent));
        setRevision(draft.revision || 1); setSupersedes(draft.supersedes || null); ids.current = { ...ids.current, ...(draft.ids || {}) };
      } else localStorage.removeItem(LOCAL_KEY);
    } catch { /* Draft recovery is best-effort only. */ }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify({ branch, step, answers, identity, consent, revision, supersedes, ids: ids.current, expires_at: Date.now() + LOCAL_RETENTION_MS }));
    } catch { /* Browser storage is optional. */ }
  }, [answers, branch, consent, identity, revision, step, supersedes]);

  useEffect(() => { requestAnimationFrame(() => headingRef.current?.focus()); }, [step]);

  const profile = useMemo(() => deriveProfile(branch, answers), [answers, branch]);
  const fields = useMemo(() => {
    if (!branch) return [];
    if (step === 1) return [...sharedFields.system, ...(branchFields[branch] || [])];
    if (step === 2) return sharedFields.limits;
    if (step === 3) return sharedFields.handoff;
    return [];
  }, [branch, step]);

  const updateAnswer = (id, value) => { setAnswers((current) => ({ ...current, [id]: value })); setDecision(null); setReceipt(null); };
  const selectBranch = (next) => { setBranch(next); setAnswers({ 'forge.system_type': next }); setStep(1); setDecision(null); setReceipt(null); };

  const validateStep = () => {
    const next = [];
    if (step === 0 && !branch) next.push('Choose the Forge system you want to shape.');
    if ([1, 2, 3].includes(step)) {
      fields.filter((field) => field.required).forEach((field) => {
        if (!valuePresent(answers[field.id])) next.push(`${field.label} is required.`);
      });
    }
    if (step === 3) {
      if (!identity.name.trim()) next.push('Name is required.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identity.email)) next.push('Enter a valid email address.');
      if (!consent) next.push('Consent to process this build brief is required.');
    }
    if (step === 4 && !clientReviewed) next.push('Confirm that you reviewed this build brief before dispatch.');
    setErrors(next);
    if (next.length) requestAnimationFrame(() => errorRef.current?.focus());
    return next.length === 0;
  };

  const evaluate = async () => {
    const local = evaluateRoute({ lane: 'forge', answers });
    try {
      const response = await api('/api/intake/evaluate', { method: 'POST', body: JSON.stringify({ lane: 'forge', answers, automated_classification: true }) });
      setDecision(response.decision);
    } catch { setDecision(local); }
  };

  const next = async () => {
    if (!validateStep()) return;
    setErrors([]);
    if (step === 3) await evaluate();
    setStep((current) => Math.min(4, current + 1));
  };

  const submit = async () => {
    if (!validateStep() || submitting) return;
    setSubmitting(true);
    const now = new Date().toISOString();
    const payload = {
      intake_id: ids.current.intake, session_id: ids.current.session, submission_id: makeId('sub'), revision,
      supersedes_submission_id: supersedes, form_id: contract.form_id, form_version: contract.version,
      locale: navigator.language || 'en-US', submitted_at: now, trace_id: ids.current.trace, client_reviewed: true,
      identity: { contact_name: identity.name.trim(), email: identity.email.trim().toLowerCase(), phone: identity.preference === 'phone' ? identity.phone.trim() || null : null, organization: identity.organization.trim() || null, organization_domain: null },
      answers: Object.entries({ ...answers, 'forge.system_type': branch }).map(([question_id, value]) => ({ question_id, value, answered_at: now, source: 'client', data_classification: 'client_confidential' })),
      artifacts: [],
      consents: [{ consent_id: 'process_intake', notice_version: CONTRACT_VERSION, granted: true, recorded_at: now }, { consent_id: 'automated_classification', notice_version: CONTRACT_VERSION, granted: true, recorded_at: now }],
      client_context: { entry_url: window.location.href, effects_mode: 'full', save_resume_used: true },
    };
    try {
      const result = await api('/api/intake/submissions', { method: 'POST', headers: { 'idempotency-key': ids.current.idempotency }, body: JSON.stringify(payload) });
      setReceipt(result.receipt); localStorage.removeItem(LOCAL_KEY);
    } catch (error) {
      setErrors([error.message || 'The build brief was not received. Your local draft remains available.']);
      requestAnimationFrame(() => errorRef.current?.focus());
    } finally { setSubmitting(false); }
  };

  const correct = () => {
    if (!receipt) return;
    setSupersedes(receipt.submission_id); setRevision(receipt.revision + 1); ids.current.idempotency = makeId('idem'); setClientReviewed(false); setReceipt(null); setStep(1);
  };

  return (
    <main className="forge-configurator-page">
      <Helmet><title>Forge Configurator | Hyperion Industries</title><meta name="description" content="Shape a custom Hyperion system around the work, room, budget, and support reality—then dispatch it for operator review." /><link rel="canonical" href="https://hyperion-industries.dev/forge/configurator" /></Helmet>
      <div className="forge-configurator-shell">
        <header className="forge-hero"><div><Link to="/forge" className="forge-back"><ArrowLeft size={15} />Forge District</Link><p>HYPERION // FORGE CONFIGURATOR</p><h1>Shape the system<br /><em>around the work.</em></h1><span>Guided build brief · operator review · no checkout</span></div><div className="forge-hero-mark" aria-hidden="true"><Cpu /><Sparkles /></div></header>

        <div className="forge-layout">
          <section className="forge-main" aria-labelledby="forge-step-title">
            <nav className="forge-progress" aria-label="Configurator progress">{STEPS.map((label, index) => <span key={label} className={index === step ? 'is-active' : index < step ? 'is-complete' : ''}><b>{String(index + 1).padStart(2, '0')}</b>{label}</span>)}</nav>
            {errors.length > 0 && <div className="forge-error" role="alert" ref={errorRef} tabIndex="-1"><CircleAlert size={18} /><div><strong>Complete this checkpoint</strong><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div></div>}
            {receipt ? (
              <Panel label="SIGNAL RECEIVED" title="Build brief held for review" tone="success"><div className="forge-receipt"><Check size={32} /><p>Reference <strong>{receipt.reference}</strong>. Your brief is in the Forge review queue; no order, payment, or quote was created.</p><div><button type="button" className="forge-button is-ghost" onClick={correct}>Correct with a new revision</button><Link className="forge-button" to="/forge">Return to the Forge</Link></div></div></Panel>
            ) : <>
              <Panel label={`CHECKPOINT ${String(step + 1).padStart(2, '0')}`} title={STEPS[step]}>
                <h2 id="forge-step-title" tabIndex="-1" ref={headingRef} className="forge-step-title">{step === 0 ? 'Choose the system lane.' : step === 1 ? `Describe the ${branchLabel(branch).toLowerCase()}.` : step === 2 ? 'Set the non-negotiables.' : step === 3 ? 'Define the handoff.' : 'Review before dispatch.'}</h2>
                {step === 0 && <div className="forge-branch-grid">{contract.branches.map((item) => <button type="button" key={item.id} onClick={() => selectBranch(item.id)} className={`forge-branch ${branch === item.id ? 'is-selected' : ''}`}><span>{item.id === 'upgrade_repair' ? <Wrench /> : item.id === 'local_ai' ? <Cpu /> : item.id === 'deployment' ? <HardDrive /> : <Gauge />}</span><strong>{item.label}</strong><small>{item.description}</small></button>)}</div>}
                {[1, 2, 3].includes(step) && <div className="forge-fields">{fields.map((field) => <FormField field={field} key={field.id} value={answers[field.id]} onChange={updateAnswer} />)}{step === 3 && <div className="forge-contact"><label className="forge-field"><span>Name <b>*</b></span><input value={identity.name} autoComplete="name" onChange={(event) => setIdentity((current) => ({ ...current, name: event.target.value }))} /></label><label className="forge-field"><span>Email <b>*</b></span><input type="email" value={identity.email} autoComplete="email" onChange={(event) => setIdentity((current) => ({ ...current, email: event.target.value }))} /></label><label className="forge-field"><span>Organization <i>optional</i></span><input value={identity.organization} autoComplete="organization" onChange={(event) => setIdentity((current) => ({ ...current, organization: event.target.value }))} /></label><label className="forge-field"><span>Follow-up</span><select value={identity.preference} onChange={(event) => setIdentity((current) => ({ ...current, preference: event.target.value }))}><option value="email">Email</option><option value="phone">Phone</option><option value="video_call">Video call</option></select></label><label className="forge-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>I consent to Hyperion processing this build brief for operator review. No payment or order is created here.</span></label><p className="forge-boundary"><ShieldCheck size={16} />Files, credentials, private logs, and restricted evidence are not accepted in this public form.</p></div>}</div>}
                {step === 4 && <div className="forge-review"><DataList rows={[['System', branchLabel(branch)], ['Maturity', 'COMMERCIAL LANE · REVIEW REQUIRED'], ['Classification', decision?.classification || (profile.missing.length || profile.conflicts.length ? 'FX · REVIEW REQUIRED' : 'F1 · FOCUSED BRIEF')], ['Boundary', 'No price, compatibility verdict, payment, or order']]} />{(profile.missing.length > 0 || profile.conflicts.length > 0) && <div className="forge-review-warning"><AlertTriangle size={18} /><div><strong>Requirements needing review</strong><ul>{[...profile.missing, ...profile.conflicts].map((item) => <li key={item}>{item}</li>)}</ul></div></div>}<label className="forge-consent"><input type="checkbox" checked={clientReviewed} onChange={(event) => setClientReviewed(event.target.checked)} /><span>I reviewed this build brief and want to dispatch this revision for operator review.</span></label></div>}
              </Panel>
              <footer className="forge-nav">{step > 0 ? <button type="button" className="forge-button is-ghost" onClick={() => { setErrors([]); setStep((current) => current - 1); }}><ArrowLeft size={15} />Back</button> : <Link className="forge-button is-ghost" to="/forge"><ArrowLeft size={15} />Exit</Link>}{step < 4 ? <button type="button" className="forge-button" onClick={next}>Continue<ArrowRight size={15} /></button> : <button type="button" className="forge-button" onClick={submit} disabled={submitting}>{submitting ? <><LoaderCircle className="forge-spin" size={16} />Receiving brief…</> : <>Dispatch for operator review<ArrowRight size={15} /></>}</button>}</footer>
            </>}
          </section>

          <aside className="forge-aside" aria-label="Build profile summary"><Panel label="LIVE BUILD PROFILE" title={branch ? branchLabel(branch) : 'Awaiting system lane'}><div className="forge-meter"><div><span>Profile completeness</span><b>{profile.completion}%</b></div><i><span style={{ width: `${profile.completion}%` }} /></i></div><div className="forge-status-stack"><StatusBadge tone="gold">NOT A QUOTE</StatusBadge><StatusBadge tone={profile.missing.length || profile.conflicts.length ? 'red' : 'cyan'}>{profile.missing.length || profile.conflicts.length ? 'REVIEW REQUIRED' : 'DRAFT PROFILE'}</StatusBadge></div><DataList rows={[['System lane', branch ? branchLabel(branch) : 'Not selected'], ['Budget', answers['forge.budget'] ? sharedFields.limits.find((field) => field.id === 'forge.budget')?.options.find(([id]) => id === answers['forge.budget'])?.[1] : 'Not set'], ['Timing', answers['forge.timeline'] ? sharedFields.limits.find((field) => field.id === 'forge.timeline')?.options.find(([id]) => id === answers['forge.timeline'])?.[1] : 'Not set'], ['Support', answers['forge.support']?.replaceAll('_', ' ') || 'Not set']]} /></Panel><Panel label="OPERATOR POSTURE" title="What happens next" tone="dark"><ol className="forge-posture"><li><b>01</b><span>Your brief enters a held review queue.</span></li><li><b>02</b><span>An operator confirms constraints and fit.</span></li><li><b>03</b><span>Eligible PC work may be proposed to the Forge domain service.</span></li></ol></Panel></aside>
        </div>
      </div>
    </main>
  );
}

function DataList({ rows }) {
  return <dl className="forge-data-list">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || 'Not set'}</dd></div>)}</dl>;
}
