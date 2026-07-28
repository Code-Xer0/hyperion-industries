import { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, ArrowLeft, ArrowRight, Check, ChevronDown, CircleAlert, Compass,
  ExternalLink, KeyRound, LoaderCircle, Map, Search, ShieldCheck, Sparkles, X,
} from 'lucide-react';
import contract from '../../../shared/intake/contracts/forms/forge-configurator.form.json';
import { deriveForgeBuildCandidatesProjection } from '../../../shared/intake/forge-build-candidates.js';
import { CONTRACT_VERSION, evaluateRoute } from '../../../shared/intake/model';
import { FORGE_GUIDE_FALLBACK, isForgeGuideBundle } from '../../data/forgeGuideBundle.js';
import { track } from '../../utils/telemetry.js';
import {
  COUNTERFACTUALS, GUIDE_SKIPPED, GUIDE_UNKNOWN, deriveRecommendations,
  deriveRequirements, mapGuideToIntake, matchingCues, migrateLegacyDraft,
  nextQuestionIndex, sha256Document, visibleQuestions,
} from './forgeGuideModel.js';
import './ForgeConfiguratorPage.css';

const API_ORIGIN = '';
const LOCAL_KEY = 'hyperion-forge-concierge-v2';
const LEGACY_KEY = 'hyperion-forge-configurator-v1';
const LOCAL_RETENTION_MS = 14 * 24 * 60 * 60 * 1000;
const LANDMARKS = ['destination', 'work', 'room', 'comfort', 'itinerary'];
const LANDMARK_LABELS = { destination: 'Destination', work: 'Work', room: 'Room', comfort: 'Comfort', itinerary: 'Itinerary' };

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

function optionLabel(question, value) {
  if (value === GUIDE_UNKNOWN) return 'I’m not sure — guide me';
  if (value === GUIDE_SKIPPED) return 'Skipped for now';
  if (Array.isArray(value)) return value.map((item) => optionLabel(question, item)).join(', ');
  return question?.options?.find(([id]) => id === value)?.[1] || String(value || '').replace(/^note:/, '');
}

function statusLabel(value) {
  if (!value || value === GUIDE_UNKNOWN) return 'Unresolved';
  if (value === GUIDE_SKIPPED) return 'Skipped';
  return 'Set';
}

function SourceDrawer({ cue, bundle }) {
  const [open, setOpen] = useState(false);
  const sources = (cue?.source_ids || []).map((id) => bundle.sources.find((source) => source.source_id === id)).filter(Boolean);
  if (!sources.length) return null;
  return (
    <div className="concierge-sources">
      <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        Why I’m asking <ChevronDown size={14} className={open ? 'is-open' : ''} />
      </button>
      {open && <div className="concierge-source-list">
        {sources.map((source) => (
          <article key={source.source_id}>
            <span>{source.evidence_class}</span>
            <strong>{source.organization}</strong>
            <p>{source.display_name} · {source.source_version}</p>
            <small>Retrieved {new Date(source.retrieved_at).toLocaleDateString()} · {source.state.replaceAll('_', ' ')}</small>
            <a href={source.source_url} target="_blank" rel="noreferrer noopener">
              Visit source <ExternalLink size={12} />
            </a>
          </article>
        ))}
      </div>}
    </div>
  );
}

function SearchSelector({ question, value = [], bundle, onChange }) {
  const [query, setQuery] = useState('');
  const selected = Array.isArray(value) ? value : [];
  const suggestions = question.id === 'reuse'
    ? [
      ['part:gpu', 'Graphics card'], ['part:storage', 'Storage drives'], ['part:memory', 'Memory'],
      ['part:case', 'Case or enclosure'], ['part:psu', 'Power supply'], ['part:cooling', 'Cooling hardware'],
    ].map(([id, label]) => ({ id, label, kind: 'existing part' }))
    : question.id === 'output_target'
      ? bundle.application_aliases.filter((item) => item.kind === 'display')
      : bundle.application_aliases.filter((item) => item.kind !== 'display');
  const filtered = suggestions.filter((item) => {
    const haystack = `${item.label} ${(item.tags || []).join(' ')}`.toLowerCase();
    return !selected.includes(item.id) && haystack.includes(query.trim().toLowerCase());
  }).slice(0, 7);
  const add = (id) => {
    if (!selected.includes(id)) onChange([...selected, id]);
    setQuery('');
  };
  const addNote = () => {
    const clean = query.trim().slice(0, 400);
    if (!clean) return;
    add(`note:${clean}`);
  };
  return (
    <div className="concierge-search">
      {selected.length > 0 && <div className="concierge-chips">
        {selected.map((id) => {
          const found = suggestions.find((item) => item.id === id);
          return <span key={id}>{found?.label || id.replace(/^note:/, '')}<button type="button" aria-label={`Remove ${found?.label || 'note'}`} onClick={() => onChange(selected.filter((item) => item !== id))}><X size={12} /></button></span>;
        })}
      </div>}
      <label>
        <Search size={16} />
        <input
          value={query}
          maxLength={400}
          placeholder={question.id === 'reuse' ? 'Search a part type or describe an exact part…' : 'Search applications, games, models, or workflows…'}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              if (filtered[0]) add(filtered[0].id);
              else addNote();
            }
          }}
        />
      </label>
      {query.trim() && <div className="concierge-results">
        {filtered.map((item) => <button type="button" key={item.id} onClick={() => add(item.id)}><strong>{item.label}</strong><span>{item.kind?.replaceAll('_', ' ')}{item.tags?.length ? ` · ${item.tags.slice(0, 2).join(' · ')}` : ''}</span></button>)}
        {question.allow_free_text && <button type="button" className="is-note" onClick={addNote}><strong>Keep “{query.trim().slice(0, 60)}” as a note</strong><span>Operator note only · not an engineering fact</span></button>}
      </div>}
    </div>
  );
}

function QuestionCard({ question, value, bundle, cue, onAnswer, onBack, canBack, headingRef }) {
  return (
    <section className="concierge-card" aria-labelledby="concierge-question">
      <div className="concierge-guide-line">
        <span><Sparkles size={15} /> Forge Concierge</span>
        {cue && <div><strong>{cue.title}</strong><p>{cue.body}</p></div>}
      </div>
      <div className="concierge-question-head">
        <span>{LANDMARK_LABELS[question.landmark]} · one stop at a time</span>
        <h2 id="concierge-question" tabIndex="-1" ref={headingRef}>{question.prompt}</h2>
        {question.help && <p>{question.help}</p>}
      </div>
      {question.type === 'single_choice' ? (
        <div className="concierge-options">
          {question.options.map(([id, label, description]) => (
            <button type="button" key={id} className={value === id ? 'is-selected' : ''} onClick={() => onAnswer(id, 'answered')}>
              <span>{value === id && <Check size={15} />}</span><strong>{label}</strong>{description && <small>{description}</small>}
            </button>
          ))}
        </div>
      ) : <SearchSelector question={question} value={value} bundle={bundle} onChange={(next) => onAnswer(next, 'answered', false)} />}
      <SourceDrawer cue={cue} bundle={bundle} />
      <footer className="concierge-controls">
        <button type="button" className="forge-button is-ghost" onClick={onBack} disabled={!canBack}><ArrowLeft size={15} />Back</button>
        <div>
          <button type="button" className="concierge-text-button" onClick={() => onAnswer(GUIDE_SKIPPED, 'skipped')}>Skip for now</button>
          <button type="button" className="forge-button is-ghost" onClick={() => onAnswer(GUIDE_UNKNOWN, 'unknown')}>I’m not sure — guide me</button>
          {question.type === 'search_multi' && Array.isArray(value) && value.length > 0 && <button type="button" className="forge-button" onClick={() => onAnswer(value, 'confirmed')}>Continue<ArrowRight size={15} /></button>}
        </div>
      </footer>
    </section>
  );
}

function ProductCard({ item, primary = false }) {
  return (
    <article className={`concierge-spot ${primary ? 'is-primary' : ''}`}>
      <div className="concierge-spot-media"><img src={item.media.path} alt={item.media.alt} loading="lazy" onError={(event) => { event.currentTarget.hidden = true; }} /><span>{item.media.posture.replaceAll('_', ' ')}</span></div>
      <div><small>{item.eyebrow}</small><h3>{item.title}</h3><p>{item.summary}</p><ul>{item.highlights.slice(0, 3).map((highlight) => <li key={highlight}>{highlight}</li>)}</ul><div className="concierge-badges">{item.badges.map((badge) => <span key={badge}>{badge}</span>)}</div></div>
    </article>
  );
}

function candidatePriceBand(candidate) {
  const { minimum_minor: minimum, maximum_minor: maximum, currency } = candidate.price_band;
  if (minimum == null && maximum == null) return 'Price band pending';
  const formatter = new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 });
  return `${minimum == null ? 'Open' : formatter.format(minimum / 100)} - ${maximum == null ? 'Open' : formatter.format(maximum / 100)}`;
}

function RoomKey({
  bundle,
  answers,
  events,
  recommendations,
  onEdit,
  unresolved,
  buildCandidatesProjection,
  preferredTier,
  onPreferCandidate,
}) {
  const destination = bundle.graph.questions.find((question) => question.id === 'destination');
  const seen = new Set();
  const answered = [...events].reverse().filter((event) => {
    if (event.kind === 'edited' || seen.has(event.question_id)) return false;
    seen.add(event.question_id);
    return true;
  }).slice(0, 8);
  return (
    <aside className="concierge-room-key" aria-label="Room Key">
      <div className="room-key-title"><KeyRound size={17} /><div><span>ROOM KEY</span><strong>{optionLabel(destination, answers.destination) || 'Your route is open'}</strong></div></div>
      <div className="room-key-status"><span>NOT A QUOTE</span><span className={unresolved.length ? 'is-review' : ''}>{unresolved.length ? `${unresolved.length} UNRESOLVED` : 'DRAFT READY'}</span></div>
      <section><h3>Current neighborhood</h3><p>{recommendations.items[0]?.title || 'We’ll narrow it together.'}</p></section>
      <section><h3>Inferred priorities</h3><ul>
        <li>Workload fit <b>{answers.destination ? 'high confidence' : 'unresolved'}</b></li>
        <li>Acoustics <b>{statusLabel(answers.acoustics)}</b></li>
        <li>Service access <b>{statusLabel(answers.service)}</b></li>
        <li>Footprint <b>{statusLabel(answers.footprint)}</b></li>
      </ul></section>
      <section className="room-key-builds">
        <h3>Proposed builds</h3>
        {!buildCandidatesProjection?.candidates?.length && <p>Answer the workload questions to reveal build concepts.</p>}
        <div>
          {buildCandidatesProjection?.candidates?.map((candidate) => (
            <button
              type="button"
              key={candidate.candidate_id}
              className={preferredTier === candidate.tier ? 'is-preferred' : ''}
              onClick={() => onPreferCandidate(candidate.tier)}
              aria-pressed={preferredTier === candidate.tier}
            >
              <span><strong>{candidate.tier}</strong><em>{Math.round(candidate.confidence_basis_points / 100)}%</em></span>
              <b>{candidate.title}</b>
              <small>{candidate.component_classes.cpu}</small>
              <small>{candidate.component_classes.gpu}</small>
              <small>{candidatePriceBand(candidate)}</small>
              <i>Not a quote · compatibility unverified</i>
            </button>
          ))}
        </div>
      </section>
      {answered.length > 0 && <section><h3>Answer trail</h3><div className="room-key-trail">{answered.map((event) => {
        const question = bundle.graph.questions.find((item) => item.id === event.question_id);
        return <button type="button" key={`${event.sequence}-${event.question_id}`} onClick={() => onEdit(event.question_id)}><span>{question?.prompt || event.question_id}</span><b>Edit</b></button>;
      })}</div></section>}
      <section className="room-key-boundary"><ShieldCheck size={15} /><p>Guidance is a deterministic public projection. Compatibility, pricing, and selection remain operator-reviewed HypOM work.</p></section>
    </aside>
  );
}

function Itinerary({ mode, requirements, recommendations, counterfactuals, onToggle, onDeepen, onHandoff, onBack, headingRef }) {
  return (
    <section className="concierge-itinerary" aria-labelledby="itinerary-title">
      <header><span><Map size={15} /> YOUR ITINERARY</span><h2 id="itinerary-title" tabIndex="-1" ref={headingRef}>A few neighborhoods worth seeing.</h2><p>These are architecture patterns—not a quote, parts list, compatibility verdict, or inventory promise.</p></header>
      <div className="concierge-spots">{recommendations.items.map((item, index) => <ProductCard item={item} primary={index === 0} key={item.slug} />)}</div>
      <section className="concierge-counterfactuals"><span>Try another route</span><h3>What should we lean toward?</h3><div>{COUNTERFACTUALS.map(([id, label, help]) => <button type="button" key={id} className={counterfactuals.includes(id) ? 'is-selected' : ''} onClick={() => onToggle(id)}><strong>{label}</strong><small>{help}</small></button>)}</div><p>These controls preview the public guidance only. Formal Forge Brain scenarios begin after operator handoff.</p></section>
      <section className="concierge-projection"><div><span>Requirements draft</span><strong>{requirements.unresolved.length ? 'Review posture' : 'Ready for operator review'}</strong></div><dl><div><dt>Workload lane</dt><dd>{requirements.workload_profile?.replaceAll('_', ' ') || 'Unresolved'}</dd></div><div><dt>Operating lane</dt><dd>{requirements.operational_lane?.replaceAll('_', ' ') || 'Unresolved'}</dd></div><div><dt>Budget posture</dt><dd>{requirements.budget ? `Up to $${(requirements.budget.parts_ceiling_minor / 100).toLocaleString()}` : 'Operator guidance needed'}</dd></div><div><dt>Unknown policy</dt><dd>Review · never implicit pass</dd></div></dl>{requirements.unresolved.length > 0 && <p><AlertTriangle size={15} /> {requirements.unresolved.length} item{requirements.unresolved.length === 1 ? '' : 's'} remain explicit for operator clarification.</p>}</section>
      <footer className="concierge-controls"><button type="button" className="forge-button is-ghost" onClick={onBack}><ArrowLeft size={15} />Back</button><div>{mode === 'express' && <button type="button" className="forge-button is-ghost" onClick={onDeepen}>Continue the full tour</button>}<button type="button" className="forge-button" onClick={onHandoff}>Prepare the handoff<ArrowRight size={15} /></button></div></footer>
    </section>
  );
}

function Handoff({ identity, setIdentity, consent, setConsent, reviewed, setReviewed, requirements, decision, errors, errorRef, submitting, onBack, onSubmit, headingRef }) {
  return (
    <section className="concierge-handoff" aria-labelledby="handoff-title">
      {errors.length > 0 && <div className="forge-error" role="alert" ref={errorRef} tabIndex="-1"><CircleAlert size={18} /><div><strong>One last check</strong><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div></div>}
      <header><span>FINAL STOP · IDENTITY ONLY NOW</span><h2 id="handoff-title" tabIndex="-1" ref={headingRef}>Hand the itinerary to a real operator.</h2><p>Your contact details stay with intake. HypOM receives only an operator-approved, source-opaque requirements projection later.</p></header>
      <div className="concierge-handoff-grid">
        <div className="concierge-contact">
          <label><span>Name *</span><input value={identity.name} autoComplete="name" onChange={(event) => setIdentity((current) => ({ ...current, name: event.target.value }))} /></label>
          <label><span>Email *</span><input type="email" value={identity.email} autoComplete="email" onChange={(event) => setIdentity((current) => ({ ...current, email: event.target.value }))} /></label>
          <label><span>Organization <i>optional</i></span><input value={identity.organization} autoComplete="organization" onChange={(event) => setIdentity((current) => ({ ...current, organization: event.target.value }))} /></label>
        </div>
        <div className="concierge-review">
          <h3>Held-review brief</h3>
          <dl><div><dt>Classification</dt><dd>{decision?.classification || 'FX · REVIEW REQUIRED'}</dd></div><div><dt>Unresolved</dt><dd>{requirements.unresolved.length}</dd></div><div><dt>Created now</dt><dd>Intake signal only</dd></div><div><dt>Not created</dt><dd>Quote, configuration, verdict, or order</dd></div></dl>
          <label><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>I consent to Hyperion processing this brief for operator review.</span></label>
          <label><input type="checkbox" checked={reviewed} onChange={(event) => setReviewed(event.target.checked)} /><span>I reviewed this itinerary and want to dispatch this revision.</span></label>
        </div>
      </div>
      <footer className="concierge-controls"><button type="button" className="forge-button is-ghost" onClick={onBack}><ArrowLeft size={15} />Back</button><button type="button" className="forge-button" disabled={submitting} onClick={onSubmit}>{submitting ? <><LoaderCircle className="forge-spin" size={16} />Receiving brief…</> : <>Dispatch for held review<ArrowRight size={15} /></>}</button></footer>
    </section>
  );
}

export default function ForgeConfiguratorPage() {
  const [bundle, setBundle] = useState(FORGE_GUIDE_FALLBACK);
  const [bundlePosture, setBundlePosture] = useState('bundled_verified');
  const [stage, setStage] = useState('welcome');
  const [mode, setMode] = useState('full');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [events, setEvents] = useState([]);
  const [counterfactuals, setCounterfactuals] = useState([]);
  const [identity, setIdentity] = useState({ name: '', email: '', organization: '' });
  const [consent, setConsent] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [decision, setDecision] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [buildCandidatesProjection, setBuildCandidatesProjection] = useState(null);
  const [preferredCandidateTier, setPreferredCandidateTier] = useState(null);
  const [revision, setRevision] = useState(1);
  const [supersedes, setSupersedes] = useState(null);
  const [migratedFrom, setMigratedFrom] = useState(null);
  const ids = useRef({ intake: makeId('int'), session: makeId('ses'), trace: makeId('trc'), idempotency: makeId('idem') });
  const headingRef = useRef(null);
  const errorRef = useRef(null);

  useEffect(() => {
    let live = true;
    fetch('/api/forge/guide', { headers: { accept: 'application/json' } })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('guide_unavailable')))
      .then((payload) => {
        const candidate = payload.bundle || payload;
        if (live && isForgeGuideBundle(candidate)) {
          setBundle(candidate);
          setBundlePosture(payload.source_posture || candidate.source_posture || 'hypom_approved');
        }
      })
      .catch(() => { if (live) setBundlePosture('bundled_verified'); });
    return () => { live = false; };
  }, []);

  useEffect(() => {
    try {
      const draft = JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null');
      if (draft?.expires_at > Date.now()) {
        setStage(draft.stage || 'welcome'); setMode(draft.mode || 'full'); setQuestionIndex(draft.questionIndex || 0);
        setAnswers(draft.answers || {}); setEvents(draft.events || []); setCounterfactuals(draft.counterfactuals || []);
        setIdentity((current) => ({ ...current, ...(draft.identity || {}) })); setConsent(Boolean(draft.consent));
        setPreferredCandidateTier(draft.preferredCandidateTier || null);
        setRevision(draft.revision || 1); setSupersedes(draft.supersedes || null); setMigratedFrom(draft.migratedFrom || null);
        ids.current = { ...ids.current, ...(draft.ids || {}) };
        return;
      }
      localStorage.removeItem(LOCAL_KEY);
      const legacy = migrateLegacyDraft(JSON.parse(localStorage.getItem(LEGACY_KEY) || 'null'));
      if (legacy) {
        setAnswers(legacy.answers); setIdentity((current) => ({ ...current, ...legacy.identity })); setConsent(legacy.consent);
        setRevision(legacy.revision); setSupersedes(legacy.supersedes); setMigratedFrom(legacy.migrated_from);
        if (legacy.ids) ids.current = { ...ids.current, ...legacy.ids };
        setStage('welcome');
      }
    } catch { /* Local recovery is best-effort and never blocks the guide. */ }
  }, []);

  useEffect(() => {
    if (receipt) return;
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify({
        schema_version: 'forge-guide-session/1', stage, mode, questionIndex, answers, events,
        counterfactuals, identity, consent, preferredCandidateTier, revision, supersedes, migratedFrom, ids: ids.current,
        expires_at: Date.now() + LOCAL_RETENTION_MS,
      }));
    } catch { /* Browser storage is optional. */ }
  }, [answers, consent, counterfactuals, events, identity, migratedFrom, mode, preferredCandidateTier, questionIndex, receipt, revision, stage, supersedes]);

  useEffect(() => { requestAnimationFrame(() => headingRef.current?.focus()); }, [questionIndex, stage]);

  const questions = useMemo(() => visibleQuestions(bundle, answers, mode), [answers, bundle, mode]);
  const question = questions[questionIndex] || questions[0];
  const cues = useMemo(() => matchingCues(bundle, answers), [answers, bundle]);
  const cue = [...cues].reverse().find((item) => !events.some((event) => event.cue_key === item.cue_key)) || cues.at(-1);
  const recommendations = useMemo(() => deriveRecommendations(bundle, answers, counterfactuals), [answers, bundle, counterfactuals]);
  const requirements = useMemo(() => deriveRequirements(bundle, answers, counterfactuals), [answers, bundle, counterfactuals]);

  useEffect(() => {
    let active = true;
    deriveForgeBuildCandidatesProjection({
      guide_bundle_hash: bundle.bundle_hash,
      requirements_projection: requirements,
    }).then(async (baseProjection) => {
      const preferredCandidateId = baseProjection.candidates
        .find((candidate) => candidate.tier === preferredCandidateTier)?.candidate_id ?? null;
      const projection = preferredCandidateId
        ? await deriveForgeBuildCandidatesProjection({
            guide_bundle_hash: bundle.bundle_hash,
            requirements_projection: requirements,
            generated_at: baseProjection.generated_at,
            preferred_candidate_id: preferredCandidateId,
          })
        : baseProjection;
      if (active) setBuildCandidatesProjection(projection);
    }).catch(() => {
      if (active) setBuildCandidatesProjection(null);
    });
    return () => { active = false; };
  }, [bundle.bundle_hash, preferredCandidateTier, requirements]);

  const start = (nextMode) => {
    setMode(nextMode); setStage('questions'); setQuestionIndex(0);
    track('forge_guide_start', { mode: nextMode });
  };

  const advance = (nextAnswers, currentQuestion) => {
    const nextQuestions = visibleQuestions(bundle, nextAnswers, mode);
    const current = nextQuestions.findIndex((item) => item.id === currentQuestion.id);
    const next = nextQuestionIndex(nextQuestions, nextAnswers, Math.max(0, current + 1));
    if (next < 0) setStage('itinerary');
    else setQuestionIndex(next);
  };

  const answerQuestion = (value, kind, shouldAdvance = true) => {
    const sequence = events.length + 1;
    const nextAnswers = { ...answers, [question.id]: value };
    setAnswers(nextAnswers);
    setEvents((current) => [...current, {
      sequence, question_id: question.id, kind, answered_at: new Date().toISOString(), cue_key: cue?.cue_key || null,
    }]);
    setDecision(null); setReceipt(null);
    track('forge_guide_question', { question_id: question.id, action: kind, mode });
    if (shouldAdvance) advance(nextAnswers, question);
  };

  const back = () => {
    if (stage !== 'questions') { setStage('questions'); setQuestionIndex(Math.max(0, questions.length - 1)); return; }
    setQuestionIndex((index) => Math.max(0, index - 1));
    track('forge_guide_back', { question_id: question?.id || 'unknown', mode });
  };

  const editQuestion = (id) => {
    const full = visibleQuestions(bundle, answers, 'full');
    const index = full.findIndex((item) => item.id === id);
    if (index < 0) return;
    setMode('full'); setStage('questions'); setQuestionIndex(index);
    setEvents((current) => [...current, { sequence: current.length + 1, question_id: id, kind: 'edited', answered_at: new Date().toISOString() }]);
  };

  const deepen = () => {
    const full = visibleQuestions(bundle, answers, 'full');
    const next = nextQuestionIndex(full, answers, 0);
    setMode('full');
    if (next < 0) setStage('itinerary');
    else { setQuestionIndex(next); setStage('questions'); }
    track('forge_guide_deepen', { mode: 'express' });
  };

  const toggleCounterfactual = (id) => {
    setCounterfactuals((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    track('forge_guide_counterfactual', { counterfactual_id: id });
  };

  const openHandoff = async () => {
    const intakeAnswers = mapGuideToIntake(answers);
    const local = evaluateRoute({ lane: 'forge', answers: intakeAnswers });
    try {
      const response = await api('/api/intake/evaluate', { method: 'POST', body: JSON.stringify({ lane: 'forge', answers: intakeAnswers, automated_classification: true }) });
      setDecision(response.decision);
    } catch { setDecision(local); }
    setStage('handoff');
  };

  const submit = async () => {
    const nextErrors = [];
    if (!identity.name.trim()) nextErrors.push('Name is required.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identity.email)) nextErrors.push('Enter a valid email address.');
    if (!consent) nextErrors.push('Consent to process this brief is required.');
    if (!reviewed) nextErrors.push('Confirm that you reviewed this itinerary.');
    setErrors(nextErrors);
    if (nextErrors.length || submitting) {
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    setSubmitting(true);
    const now = new Date().toISOString();
    const projection = { ...requirements };
    const projectionHash = await sha256Document(projection);
    projection.projection_hash = projectionHash;
    const candidateProjection = buildCandidatesProjection?.requirements_projection_hash === projectionHash
      ? buildCandidatesProjection
      : await deriveForgeBuildCandidatesProjection({
          guide_bundle_hash: bundle.bundle_hash,
          requirements_projection: projection,
          generated_at: now,
        });
    const sessionDocument = {
      schema_version: 'forge-guide-session/1',
      graph_version: bundle.graph.version,
      ordered_answer_events: events,
      skipped_questions: events.filter((event) => event.kind === 'skipped').map((event) => event.question_id),
      guide_cues_shown: [...new Set(events.map((event) => event.cue_key).filter(Boolean))],
      lane_recommendations: recommendations.items.map((item) => item.slug),
      requested_counterfactuals: counterfactuals,
      unresolved_fields: requirements.unresolved.map((item) => item.field),
    };
    const sessionHash = await sha256Document(sessionDocument);
    const intakeAnswers = mapGuideToIntake(answers);
    const rawAnswers = Object.entries(answers).map(([id, value]) => [`guide.${id}`, value]);
    const payload = {
      intake_id: ids.current.intake, session_id: ids.current.session, submission_id: makeId('sub'),
      revision, supersedes_submission_id: supersedes, form_id: contract.form_id, form_version: contract.version,
      locale: navigator.language || 'en-US', submitted_at: now, trace_id: ids.current.trace, client_reviewed: true,
      identity: { contact_name: identity.name.trim(), email: identity.email.trim().toLowerCase(), phone: null, organization: identity.organization.trim() || null, organization_domain: null },
      answers: [...Object.entries(intakeAnswers), ...rawAnswers].map(([question_id, value]) => ({ question_id, value, answered_at: now, source: 'client', data_classification: 'client_confidential' })),
      artifacts: [],
      consents: [
        { consent_id: 'process_intake', notice_version: CONTRACT_VERSION, granted: true, recorded_at: now },
        { consent_id: 'automated_classification', notice_version: CONTRACT_VERSION, granted: true, recorded_at: now },
      ],
      client_context: {
        entry_url: window.location.href, effects_mode: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduced' : 'full',
        save_resume_used: true, guide_mode: mode, guide_bundle_hash: bundle.bundle_hash,
        question_graph_version: bundle.graph.version, guide_session_hash: sessionHash,
        guide_requirements_projection: projection, recommendation_reason_codes: recommendations.reason_codes,
        guide_build_candidates_projection: candidateProjection,
        unresolved_items: requirements.unresolved.map((item) => item.field),
        requested_counterfactuals: counterfactuals,
      },
    };
    try {
      const result = await api('/api/intake/submissions', { method: 'POST', headers: { 'idempotency-key': ids.current.idempotency }, body: JSON.stringify(payload) });
      setReceipt(result.receipt);
      localStorage.removeItem(LOCAL_KEY);
      localStorage.removeItem(LEGACY_KEY);
    } catch (error) {
      setErrors([error.message || 'The itinerary was not received. Your local draft remains available.']);
      requestAnimationFrame(() => errorRef.current?.focus());
    } finally { setSubmitting(false); }
  };

  const correct = () => {
    if (!receipt) return;
    setSupersedes(receipt.submission_id); setRevision(receipt.revision + 1); ids.current.idempotency = makeId('idem');
    setReviewed(false); setReceipt(null); setStage('questions'); setQuestionIndex(0);
  };

  const currentLandmark = stage === 'itinerary' || stage === 'handoff' ? 'itinerary' : question?.landmark || 'destination';
  const progressIndex = Math.max(0, LANDMARKS.indexOf(currentLandmark));

  return (
    <main className="forge-configurator-page">
      <Helmet><title>Forge Concierge | Hyperion Industries</title><meta name="description" content="Take a guided, source-backed route from what you want to accomplish to a held-review Hyperion Forge system brief." /><link rel="canonical" href="https://hyperion-industries.dev/forge/configurator" /></Helmet>
      <div className="forge-configurator-shell">
        <header className="forge-hero"><div><Link to="/forge" className="forge-back"><ArrowLeft size={15} />Forge District</Link><p>HYPERION // FORGE CONCIERGE</p><h1>Tell us where<br /><em>you want to go.</em></h1><span>One useful question at a time · evidence-backed · operator reviewed</span></div><div className="forge-hero-mark" aria-hidden="true"><Compass /><Sparkles /></div></header>

        {stage !== 'welcome' && !receipt && <nav className="concierge-progress" aria-label="Concierge progress">{LANDMARKS.map((landmark, index) => <span key={landmark} className={index === progressIndex ? 'is-active' : index < progressIndex ? 'is-complete' : ''}><b>{index < progressIndex ? <Check size={12} /> : String(index + 1).padStart(2, '0')}</b>{LANDMARK_LABELS[landmark]}</span>)}</nav>}

        {receipt ? (
          <section className="concierge-receipt"><Check size={34} /><span>SIGNAL RECEIVED · HELD FOR REVIEW</span><h2>Your itinerary is with the Forge desk.</h2><p>Reference <strong>{receipt.reference}</strong>. No quote, configuration, compatibility verdict, payment, or order was created.</p><div><button type="button" className="forge-button is-ghost" onClick={correct}>Correct with a new revision</button><Link className="forge-button" to="/forge">Return to the Forge</Link></div></section>
        ) : stage === 'welcome' ? (
          <section className="concierge-welcome" aria-labelledby="welcome-title">
            <div><span><Compass size={15} /> YOUR GUIDE IS READY</span><h2 id="welcome-title">This should feel like a good shop tour, not a tax form.</h2><p>Start with what you want the system to make possible. The Concierge will explain the tradeoffs, show relevant Forge neighborhoods, and keep every unknown visible for a real operator.</p><div className="concierge-welcome-actions"><button type="button" className="forge-button" onClick={() => start('full')}>Take the guided itinerary<ArrowRight size={15} /></button><button type="button" className="forge-button is-ghost" onClick={() => start('express')}>Show me around · 3 questions</button></div><small>{migratedFrom ? 'Your earlier configurator draft was carried forward safely. ' : ''}Guide source: {bundlePosture.replaceAll('_', ' ')} · {bundle.sources.length} curated source lanes.</small></div><ol><li><b>01</b><span>Tell us the destination.</span></li><li><b>02</b><span>Get useful context as the route sharpens.</span></li><li><b>03</b><span>Preview several system neighborhoods.</span></li><li><b>04</b><span>Hand a source-opaque draft to an operator.</span></li></ol>
          </section>
        ) : (
          <div className="concierge-layout">
            <section className="concierge-main">
              {stage === 'questions' && question && <QuestionCard question={question} value={answers[question.id]} bundle={bundle} cue={cue} onAnswer={answerQuestion} onBack={back} canBack={questionIndex > 0} headingRef={headingRef} />}
              {stage === 'itinerary' && <Itinerary mode={mode} requirements={requirements} recommendations={recommendations} counterfactuals={counterfactuals} onToggle={toggleCounterfactual} onDeepen={deepen} onHandoff={openHandoff} onBack={back} headingRef={headingRef} />}
              {stage === 'handoff' && <Handoff identity={identity} setIdentity={setIdentity} consent={consent} setConsent={setConsent} reviewed={reviewed} setReviewed={setReviewed} requirements={requirements} decision={decision} errors={errors} errorRef={errorRef} submitting={submitting} onBack={() => setStage('itinerary')} onSubmit={submit} headingRef={headingRef} />}
            </section>
            <RoomKey
              bundle={bundle}
              answers={answers}
              events={events}
              recommendations={recommendations}
              onEdit={editQuestion}
              unresolved={requirements.unresolved}
              buildCandidatesProjection={buildCandidatesProjection}
              preferredTier={preferredCandidateTier}
              onPreferCandidate={setPreferredCandidateTier}
            />
          </div>
        )}
      </div>
    </main>
  );
}
