import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  KeyRound,
  Radio,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  CONTRACT_VERSION,
  evaluateRoute,
  isLaneId,
  LANES,
  LANE_IDS,
} from '../../../shared/intake/model';
import { publicIntakeAttribution } from '../../../shared/intake/attribution';
import './IntakePage.css';

const STEPS = ['Aperture', 'Handshake', 'Signal', 'Load / Limits', 'Fit', 'Review', 'Dispatch'];
const LOCAL_PREFIX = 'hyperion-intake-v1';
const LOCAL_RETENTION_MS = 14 * 24 * 60 * 60 * 1000;
const API_ORIGIN = '';
const FORM_IDS = {
  forge: 'forge-build-profile',
  pandora: 'pandora-readiness',
  continuity: 'continuity-assessment',
  'live-sites': 'live-site-project',
  'operator-identity': 'operator-identity',
  support: 'support',
  relationships: 'relationship',
  general: 'general',
};

const makeId = (prefix) => {
  const value = globalThis.crypto?.randomUUID?.().replaceAll('-', '')
    || `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${value.padEnd(12, 'x')}`;
};

const initialEffects = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'reduced' : 'full';
const localKey = (lane) => `${LOCAL_PREFIX}:${lane}`;
const answerTime = () => new Date().toISOString();

function readLocalDraft(lane) {
  try {
    const value = JSON.parse(localStorage.getItem(localKey(lane)) || 'null');
    if (!value || value.expires_at <= Date.now()) {
      localStorage.removeItem(localKey(lane));
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

function findLocalDraft(draftId) {
  for (const lane of LANE_IDS) {
    const draft = readLocalDraft(lane);
    if (draft?.draft_id === draftId) return draft;
  }
  return null;
}

async function api(path, options = {}) {
  const response = await fetch(`${API_ORIGIN}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
  });
  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(body?.error?.message || 'The intake service is temporarily unavailable.');
    error.code = body?.error?.code || 'request_failed';
    error.status = response.status;
    throw error;
  }
  return body;
}

function OperatorSignal({ effects, step }) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (effects !== 'full') {
      setFrame(effects === 'static' ? 0 : Math.min(1, step % 4));
      return undefined;
    }
    const timer = window.setInterval(() => setFrame((value) => (value + 1) % 4), 420);
    return () => window.clearInterval(timer);
  }, [effects, step]);

  return (
    <div className="intake-operator-visual" aria-hidden="true">
      <div className="intake-operator-aura" />
      <img src={`/assets/city/operator/operator-wave-000${frame}.webp`} alt="" />
      <span className="intake-scan-line" />
    </div>
  );
}

function LaneCards({ selected, onSelect }) {
  return (
    <fieldset className="intake-lane-fieldset">
      <legend>Choose the signal that best matches the work</legend>
      <div className="intake-lane-grid">
        {LANE_IDS.map((laneId) => {
          const lane = LANES[laneId];
          return (
            <label key={laneId} className={`intake-lane-card is-${lane.accent}${selected === laneId ? ' is-selected' : ''}`}>
              <input type="radio" name="lane" value={laneId} checked={selected === laneId} onChange={() => onSelect(laneId)} />
              <span className="intake-lane-signal"><Radio size={15} aria-hidden="true" /></span>
              <strong>{lane.name}</strong>
              <span>{lane.short}</span>
              <small>{lane.maturity}</small>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function Question({ question, value, onChange }) {
  if (question.when && value.whenValue !== question.when.equals) return null;
  if (question.type === 'notice') {
    return <div className="intake-notice" role="note"><ShieldCheck size={18} aria-hidden="true" /><p>{question.label}</p></div>;
  }
  const fieldValue = value.current ?? '';
  const describedBy = question.hint ? `${question.id}-hint` : undefined;

  if (question.type === 'radio') {
    return (
      <fieldset className="intake-question intake-choice-group">
        <legend>{question.label}{question.required && <span aria-hidden="true"> *</span>}</legend>
        {question.hint && <p id={describedBy}>{question.hint}</p>}
        <div className="intake-choice-row">
          {question.options.map((option) => (
            <label key={option.value}>
              <input type="radio" name={question.id} value={option.value} checked={fieldValue === option.value} onChange={() => onChange(question.id, option.value)} />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  return (
    <label className="intake-question" htmlFor={question.id}>
      <span>{question.label}{question.required && <span aria-hidden="true"> *</span>}</span>
      {question.hint && <small id={describedBy}>{question.hint}</small>}
      {question.type === 'textarea' ? (
        <textarea id={question.id} value={fieldValue} rows="4" required={question.required} aria-describedby={describedBy} onChange={(event) => onChange(question.id, event.target.value)} />
      ) : question.type === 'select' ? (
        <select id={question.id} value={fieldValue} required={question.required} aria-describedby={describedBy} onChange={(event) => onChange(question.id, event.target.value)}>
          <option value="">Select one</option>
          {question.options.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
        </select>
      ) : (
        <input id={question.id} type={question.type} value={fieldValue} required={question.required} aria-describedby={describedBy} onChange={(event) => onChange(question.id, event.target.value)} />
      )}
    </label>
  );
}

function ErrorSummary({ errors, summaryRef }) {
  if (!errors.length) return null;
  return (
    <div className="intake-error-summary" role="alert" tabIndex="-1" ref={summaryRef}>
      <CircleAlert size={19} aria-hidden="true" />
      <div><strong>Complete this checkpoint</strong><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>
    </div>
  );
}

function DecisionCard({ decision, source }) {
  if (!decision) return <p className="intake-muted">Complete Load / Limits to generate a deterministic route proposal.</p>;
  return (
    <section className="intake-decision" aria-labelledby="decision-title">
      <header>
        <div><span>Proposed route</span><h3 id="decision-title">{LANES[decision.primary_route]?.name || 'Manual review'} · {decision.classification}</h3></div>
        <small>{source === 'server' ? 'SERVER VERIFIED' : 'LOCAL PREVIEW · SERVER PENDING'}</small>
      </header>
      <p>{decision.client_summary}</p>
      <div className="intake-evidence">
        {decision.evidence.map((item) => (
          <article key={item.id}><span>{item.id}</span><strong>{item.label}</strong><p>{item.observed}</p><small>{item.effect}</small></article>
        ))}
      </div>
      <div className="intake-boundary"><ShieldCheck size={17} aria-hidden="true" />Proposal only. No CRM, order, ticket, payment, memory, CHR0N, or command system has been changed.</div>
    </section>
  );
}

export default function IntakePage({ resumeMode = false }) {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const directLane = isLaneId(params.lane) ? params.lane : null;
  const [lane, setLane] = useState(directLane);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [identity, setIdentity] = useState({ name: '', email: '', organization: '', follow_up_preference: 'email', phone: '' });
  const [consents, setConsents] = useState({ process_intake: false, automated_classification: true, save_resume: false });
  const [clientReviewed, setClientReviewed] = useState(false);
  const [effects, setEffects] = useState(initialEffects);
  const [decision, setDecision] = useState(null);
  const [decisionSource, setDecisionSource] = useState(null);
  const [errors, setErrors] = useState([]);
  const [serviceNote, setServiceNote] = useState('Local autosave active · expires after 14 days');
  const [resumeStatus, setResumeStatus] = useState('idle');
  const [cloudEnabled, setCloudEnabled] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [serviceReadiness, setServiceReadiness] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [revision, setRevision] = useState(1);
  const [supersedes, setSupersedes] = useState(null);
  const ids = useRef({ intake: makeId('int'), session: makeId('ses'), draft: makeId('drf'), trace: makeId('trc'), idempotency: makeId('idem') });
  const cloudVersion = useRef(0);
  const restoreKey = useRef(null);
  const exchangeStarted = useRef(false);
  const prefillApplied = useRef(null);
  const headingRef = useRef(null);
  const errorRef = useRef(null);

  const laneDefinition = lane ? LANES[lane] : null;

  useEffect(() => {
    let active = true;
    api('/api/intake/status')
      .then((result) => { if (active) setServiceReadiness(result?.readiness || {}); })
      .catch(() => { if (active) setServiceReadiness({ storage: 'unverified' }); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (directLane && directLane !== lane) setLane(directLane);
  }, [directLane, lane]);

  useEffect(() => {
    const prefillByLane = {
      'live-sites': { answerId: 'live_site_package', values: ['signal', 'presence', 'system', 'infrastructure'] },
      continuity: { answerId: 'continuity_service', values: ['assessment', 'setup', 'migration', 'team'] },
    };
    const definition = prefillByLane[directLane];
    if (!definition) return;
    const value = new URLSearchParams(window.location.search).get('service');
    const prefillKey = `${directLane}:${value || ''}`;
    if (prefillApplied.current === prefillKey) return;
    prefillApplied.current = prefillKey;
    if (definition.values.includes(value)) {
      setAnswers((current) => ({ ...current, [definition.answerId]: current[definition.answerId] || value }));
    }
  }, [directLane]);

  useEffect(() => {
    if (!lane || restoreKey.current === lane) return;
    restoreKey.current = lane;
    const draft = readLocalDraft(lane);
    if (!draft) return;
    ids.current = { ...ids.current, ...draft.ids, draft: draft.draft_id || draft.ids?.draft || ids.current.draft };
    setAnswers(draft.answers || {});
    setIdentity((value) => ({ ...value, ...(draft.identity || {}) }));
    setConsents((value) => ({ ...value, ...(draft.consents || {}) }));
    setEffects(draft.effects || initialEffects());
    setStep(Math.min(Number(draft.step) || 0, 5));
    setRevision(Number(draft.revision) || 1);
    setSupersedes(draft.supersedes || null);
    setServiceNote('Local draft recovered · expires 14 days after the latest change');
  }, [lane]);

  useEffect(() => {
    if (!lane) return;
    const payload = {
      lane, answers, identity, consents, effects, step, revision, supersedes,
      ids: ids.current, draft_id: ids.current.draft, saved_at: Date.now(), expires_at: Date.now() + LOCAL_RETENTION_MS,
    };
    try { localStorage.setItem(localKey(lane), JSON.stringify(payload)); } catch { /* Browser storage can be disabled. */ }
  }, [answers, consents, effects, identity, lane, revision, step, supersedes]);

  useEffect(() => {
    if (!cloudEnabled || !lane) return undefined;
    const timer = window.setTimeout(async () => {
      try {
        const result = await api(`/api/intake/drafts/${ids.current.draft}`, {
          method: 'PUT',
          body: JSON.stringify({
            lane, form_version: CONTRACT_VERSION, answers, identity, consents, effects_mode: effects,
            expected_version: cloudVersion.current,
          }),
        });
        cloudVersion.current = result.version;
        setServiceNote(`Cloud resume active · version ${result.version} · identified drafts expire after 30 days`);
      } catch (error) {
        setServiceNote(error.code === 'draft_conflict'
          ? 'Cloud save paused: this draft changed elsewhere. Reload from the latest resume link.'
          : 'Cloud save unavailable; the 14-day local draft remains active.');
      }
    }, 900);
    return () => window.clearTimeout(timer);
  }, [answers, cloudEnabled, consents, effects, identity, lane]);

  useEffect(() => {
    if (!resumeMode || exchangeStarted.current) return;
    exchangeStarted.current = true;
    const token = new URLSearchParams(window.location.hash.slice(1)).get('token');
    window.history.replaceState({}, '', `${window.location.pathname}${window.location.search}`);
    if (!token) {
      setResumeStatus('missing');
      return;
    }
    setResumeStatus('exchanging');
    api('/api/intake/resume/exchange', { method: 'POST', body: JSON.stringify({ token }) })
      .then(async (result) => {
        ids.current.draft = result.draft_id;
        setCloudEnabled(true);
        setResumeStatus('ready');
        try {
          const readback = await api(`/api/intake/drafts/${result.draft_id}`);
          const draft = readback.draft;
          if (isLaneId(draft.lane)) {
            setLane(draft.lane);
            setAnswers(draft.answers || {});
            setIdentity((value) => ({ ...value, ...(draft.identity || {}) }));
            setConsents((value) => ({ ...value, ...(draft.consents || {}) }));
            setEffects(draft.effects_mode || initialEffects());
            cloudVersion.current = draft.version;
          }
        } catch (error) {
          if (error.status !== 404) throw error;
          const local = findLocalDraft(result.draft_id);
          if (local) {
            setLane(local.lane);
            setAnswers(local.answers || {});
            setIdentity((value) => ({ ...value, ...(local.identity || {}) }));
            setConsents((value) => ({ ...value, ...(local.consents || {}) }));
          } else {
            setLane('general');
          }
        }
      })
      .catch(() => setResumeStatus('invalid'));
  }, [navigate, resumeMode]);

  useEffect(() => {
    requestAnimationFrame(() => headingRef.current?.focus());
  }, [step]);

  const updateAnswer = useCallback((id, value) => {
    setAnswers((current) => ({ ...current, [id]: value }));
    setDecision(null);
    setReceipt(null);
  }, []);

  const chooseLane = (nextLane) => {
    setLane(nextLane);
    setAnswers({});
    setDecision(null);
    setReceipt(null);
    restoreKey.current = null;
    navigate({ pathname: `/intake/${nextLane}`, search: location.search }, { replace: params.lane === undefined });
  };

  const visibleQuestions = useCallback((section) => {
    if (!laneDefinition) return [];
    return laneDefinition.questions[section].filter((question) => !question.when || answers[question.when.field] === question.when.equals);
  }, [answers, laneDefinition]);

  const validate = () => {
    const nextErrors = [];
    if (step === 0 && !lane) nextErrors.push('Choose one intake lane.');
    if (step === 1) {
      if (!identity.name.trim()) nextErrors.push('Name is required.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identity.email)) nextErrors.push('Enter a valid email address.');
      if (identity.follow_up_preference === 'phone' && !identity.phone.trim()) nextErrors.push('Phone is required when phone follow-up is selected.');
      if (!consents.process_intake) nextErrors.push('Consent to process this intake is required.');
    }
    if (step === 2 || step === 3) {
      const section = step === 2 ? 'signal' : 'load';
      visibleQuestions(section).filter((question) => question.required).forEach((question) => {
        if (answers[question.id] === undefined || answers[question.id] === null || String(answers[question.id]).trim() === '') {
          nextErrors.push(`${question.label} is required.`);
        }
      });
    }
    if (step === 5 && !clientReviewed) nextErrors.push('Confirm that you reviewed the signal before dispatch.');
    setErrors(nextErrors);
    if (nextErrors.length) requestAnimationFrame(() => errorRef.current?.focus());
    return nextErrors.length === 0;
  };

  const evaluate = async () => {
    const localDecision = evaluateRoute({ lane, answers, automatedClassification: consents.automated_classification });
    try {
      const result = await api('/api/intake/evaluate', {
        method: 'POST',
        body: JSON.stringify({ lane, answers, automated_classification: consents.automated_classification }),
      });
      setDecision(result.decision);
      setDecisionSource('server');
    } catch {
      setDecision(localDecision);
      setDecisionSource('local');
    }
  };

  const next = async () => {
    if (!validate()) return;
    setErrors([]);
    if (step === 3) await evaluate();
    setStep((value) => Math.min(6, value + 1));
  };

  const back = () => {
    setErrors([]);
    setStep((value) => Math.max(0, value - 1));
  };

  const requestResume = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identity.email)) {
      setErrors(['Enter a valid email address before enabling resume.']);
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    setConsents((value) => ({ ...value, save_resume: true }));
    setResumeStatus('requesting');
    try {
      await api('/api/intake/resume/request', {
        method: 'POST', body: JSON.stringify({ email: identity.email, draft_id: ids.current.draft }),
      });
      setResumeStatus('sent');
    } catch {
      setResumeStatus('unavailable');
    }
  };

  const submit = async () => {
    if (!lane || !clientReviewed || submitting) return;
    setSubmitting(true);
    setErrors([]);
    const now = answerTime();
    const submissionId = makeId('sub');
    const formId = FORM_IDS[lane];
    const payload = {
      intake_id: ids.current.intake,
      session_id: ids.current.session,
      submission_id: submissionId,
      revision,
      supersedes_submission_id: supersedes,
      form_id: formId,
      form_version: CONTRACT_VERSION,
      locale: navigator.language || 'en-US',
      submitted_at: now,
      trace_id: ids.current.trace,
      client_reviewed: true,
      identity: {
        contact_name: identity.name.trim(), email: identity.email.trim().toLowerCase(),
        phone: identity.follow_up_preference === 'phone' ? identity.phone.trim() : null,
        organization: identity.organization.trim() || null, organization_domain: null,
        existing_client_reference: lane === 'support' ? (answers.existing_client_reference || null) : null,
      },
      answers: Object.entries(answers).map(([question_id, value]) => ({
        question_id, value, answered_at: now, source: 'client', data_classification: 'client_confidential',
      })),
      artifacts: [],
      consents: [
        { consent_id: 'process_intake', notice_version: CONTRACT_VERSION, granted: true, recorded_at: now },
        { consent_id: 'automated_classification', notice_version: CONTRACT_VERSION, granted: consents.automated_classification, recorded_at: now },
        { consent_id: 'save_resume', notice_version: CONTRACT_VERSION, granted: consents.save_resume, recorded_at: now },
      ],
      client_context: {
        ...publicIntakeAttribution(window.location, document.referrer),
        effects_mode: effects,
        save_resume_used: cloudEnabled,
      },
    };
    try {
      const result = await api('/api/intake/submissions', {
        method: 'POST', headers: { 'idempotency-key': ids.current.idempotency }, body: JSON.stringify(payload),
      });
      setReceipt(result.receipt);
      if (lane) localStorage.removeItem(localKey(lane));
    } catch (error) {
      setErrors([error.message || 'The signal was not received. Your local draft is still available.']);
      requestAnimationFrame(() => errorRef.current?.focus());
    } finally {
      setSubmitting(false);
    }
  };

  const correct = () => {
    if (!receipt) return;
    setSupersedes(receipt.submission_id);
    setRevision(receipt.revision + 1);
    ids.current.idempotency = makeId('idem');
    setClientReviewed(false);
    setReceipt(null);
    setStep(2);
  };

  const reviewRows = useMemo(() => {
    if (!laneDefinition) return [];
    return [...laneDefinition.questions.signal, ...laneDefinition.questions.load]
      .filter((question) => question.type !== 'notice' && answers[question.id] !== undefined)
      .map((question) => [question.label, String(answers[question.id])]);
  }, [answers, laneDefinition]);

  const renderStep = () => {
    if (resumeMode && ['missing', 'invalid', 'exchanging'].includes(resumeStatus)) {
      return (
        <div className="intake-resume-state">
          <KeyRound size={30} aria-hidden="true" />
          <h2>{resumeStatus === 'exchanging' ? 'Redeeming your one-time link…' : 'This resume link is missing, expired, or already used.'}</h2>
          <p>The link itself contains no answers. Return to Intake to continue from a 14-day local draft or request another link.</p>
          <Link className="intake-button is-primary" to="/intake">Open Intake</Link>
        </div>
      );
    }
    if (step === 0) return <LaneCards selected={lane} onSelect={chooseLane} />;
    if (step === 1) {
      return (
        <div className="intake-contact-grid">
          <label>Name <span aria-hidden="true">*</span><input value={identity.name} autoComplete="name" onChange={(event) => setIdentity({ ...identity, name: event.target.value })} /></label>
          <label>Email <span aria-hidden="true">*</span><input type="email" value={identity.email} autoComplete="email" onChange={(event) => setIdentity({ ...identity, email: event.target.value })} /></label>
          <label>Organization <span className="intake-optional">Optional</span><input value={identity.organization} autoComplete="organization" onChange={(event) => setIdentity({ ...identity, organization: event.target.value })} /></label>
          <label>Follow-up preference<select value={identity.follow_up_preference} onChange={(event) => setIdentity({ ...identity, follow_up_preference: event.target.value })}><option value="email">Email</option><option value="phone">Phone</option></select></label>
          {identity.follow_up_preference === 'phone' && <label>Phone <span aria-hidden="true">*</span><input type="tel" value={identity.phone} autoComplete="tel" onChange={(event) => setIdentity({ ...identity, phone: event.target.value })} /></label>}
          <div className="intake-consents">
            <label><input type="checkbox" checked={consents.process_intake} onChange={(event) => setConsents({ ...consents, process_intake: event.target.checked })} /><span>I consent to Hyperion processing this signal for operator review. <strong>Required</strong></span></label>
            <label><input type="checkbox" checked={consents.automated_classification} onChange={(event) => setConsents({ ...consents, automated_classification: event.target.checked })} /><span>Use deterministic automated classification. If declined, diagnostics are skipped and the signal goes to manual review.</span></label>
            <label><input type="checkbox" checked={consents.save_resume} onChange={(event) => setConsents({ ...consents, save_resume: event.target.checked })} /><span>Enable private resume. Cloud saving starts only after a one-time link is redeemed.</span></label>
            {consents.save_resume && (
              <button type="button" className="intake-resume-button" onClick={requestResume} disabled={resumeStatus === 'requesting'}>
                <KeyRound size={15} aria-hidden="true" />{resumeStatus === 'sent' ? 'Resume link requested' : resumeStatus === 'unavailable' ? 'Resume email unavailable' : 'Send one-time resume link'}
              </button>
            )}
          </div>
        </div>
      );
    }
    if (step === 2 || step === 3) {
      const section = step === 2 ? 'signal' : 'load';
      return (
        <fieldset className="intake-question-set">
          <legend>{step === 2 ? 'Describe the signal' : 'Define load, limits, and known unknowns'}</legend>
          {visibleQuestions(section).map((question) => <Question key={question.id} question={question} value={{ current: answers[question.id], whenValue: question.when ? answers[question.when.field] : undefined }} onChange={updateAnswer} />)}
        </fieldset>
      );
    }
    if (step === 4) return <DecisionCard decision={decision} source={decisionSource} />;
    if (step === 5) {
      return (
        <div className="intake-review">
          <section><span>Contact</span><h3>{identity.name}</h3><p>{identity.email}{identity.organization ? ` · ${identity.organization}` : ''}</p><button type="button" onClick={() => setStep(1)}>Edit contact</button></section>
          <section><span>{laneDefinition.name} signal</span>{reviewRows.map(([label, value]) => <dl key={label}><dt>{label}</dt><dd>{value}</dd></dl>)}<button type="button" onClick={() => setStep(2)}>Correct answers</button></section>
          <label className="intake-review-confirm"><input type="checkbox" checked={clientReviewed} onChange={(event) => setClientReviewed(event.target.checked)} /><span>I reviewed these answers and want to dispatch this revision for operator review.</span></label>
        </div>
      );
    }
    if (receipt) {
      return (
        <div className="intake-receipt" role="status">
          <span><Check size={22} aria-hidden="true" /></span>
          <p className="intake-kicker">Signal received</p>
          <h2>Received for operator review.</h2>
          <p>Reference <strong>{receipt.reference}</strong> · Revision {receipt.revision}</p>
          <p>The Worker is holding this immutable revision in the operator feed. Founder Command can receive it on its next configured pull; that delivery is not approval.</p>
          <p>No CRM, order, ticket, payment, memory, CHR0N, or command action was created automatically.</p>
          <div className="intake-actions"><button type="button" className="intake-button" onClick={correct}><RotateCcw size={15} />Correct with a new revision</button><Link className="intake-button is-primary" to="/">Return to City</Link></div>
        </div>
      );
    }
    return (
      <div className="intake-dispatch">
        <ShieldCheck size={32} aria-hidden="true" />
        <p className="intake-kicker">Authority boundary</p>
        <h2>Dispatch to the review queue.</h2>
        <p>This creates one immutable submission revision, one evidence-linked routing decision, one receipt, one metadata-only audit event, and a held-for-review outbox record.</p>
        {serviceReadiness?.storage === 'configuration_required' && <p className="intake-service-warning" role="alert">The receiving service is not ready. Your local draft is safe; dispatch is paused.</p>}
        <button type="button" className="intake-button is-primary is-large" onClick={submit} disabled={submitting || serviceReadiness?.storage === 'configuration_required'}>{submitting ? 'Receiving signal…' : 'Dispatch for operator review'}</button>
      </div>
    );
  };

  const stepDescription = [
    'Name the continuity failure and open the narrowest useful lane.', 'Add only the contact detail needed for follow-up.', 'State the outcome in your own language.',
    'Make constraints and unknowns visible.', 'Inspect the rule evidence and proposed route.', 'Correct the signal before it becomes immutable.',
    'Stop at the operator-review boundary.',
  ][step];

  return (
    <main className="intake-page" data-effects={effects}>
      <div className="intake-shell">
        <aside className={`intake-operator-panel is-${laneDefinition?.accent || 'cyan'}`}>
          <div className="intake-brand-line"><span>HYPERION // ASSESSMENT INTAKE</span><small>PUBLIC EDGE · v{CONTRACT_VERSION}</small></div>
          <OperatorSignal effects={effects} step={step} />
          <div className="intake-operator-copy">
            <p className="intake-kicker">Operator signal</p>
            <h1>{laneDefinition?.name || 'Find the right lane.'}</h1>
            <p>{laneDefinition?.operatorLine || 'Seven routes. One truthful stop: a human reviews every dispatch.'}</p>
          </div>
          <div className="intake-effects">
            <label htmlFor="effects-mode"><Sparkles size={14} aria-hidden="true" />Effects</label>
            <select id="effects-mode" value={effects} onChange={(event) => setEffects(event.target.value)}><option value="full">Full</option><option value="reduced">Reduced</option><option value="static">Static</option></select>
          </div>
        </aside>

        <section className="intake-form-panel" aria-labelledby="intake-step-title">
          <header className="intake-form-head">
            <Link to="/" className="intake-exit"><ArrowLeft size={15} aria-hidden="true" />City Gate</Link>
            <div className="intake-save-state"><span className={`intake-service-dot is-${serviceReadiness?.storage || 'checking'}`} aria-hidden="true" /><span>{serviceReadiness?.storage === 'ready' ? 'Receiving service ready' : serviceReadiness?.storage === 'configuration_required' ? 'Receiving service paused' : serviceReadiness?.storage === 'unverified' ? 'Receiving service unverified' : 'Checking receiving service'} · {serviceNote}</span></div>
          </header>
          <nav className="intake-progress" aria-label="Intake progress">
            <ol>{STEPS.map((label, index) => <li key={label} aria-current={index === step ? 'step' : undefined} className={index < step ? 'is-complete' : index === step ? 'is-current' : ''}><span>{index < step ? <Check size={12} /> : index + 1}</span><small>{label}</small></li>)}</ol>
            <progress value={step + 1} max={STEPS.length}>{step + 1} of {STEPS.length}</progress>
          </nav>
          <div className="intake-step-head">
            <p>Checkpoint {step + 1} / {STEPS.length}</p>
            <h2 id="intake-step-title" ref={headingRef} tabIndex="-1">{STEPS[step]}</h2>
            <p>{stepDescription}</p>
          </div>
          <ErrorSummary errors={errors} summaryRef={errorRef} />
          <form className="intake-form" onSubmit={(event) => event.preventDefault()} noValidate>
            {renderStep()}
          </form>
          {!receipt && !(resumeMode && ['missing', 'invalid', 'exchanging'].includes(resumeStatus)) && step < 6 && (
            <footer className="intake-navigation">
              <button type="button" className="intake-button" onClick={back} disabled={step === 0}><ArrowLeft size={15} />Back</button>
              <span>{laneDefinition?.maturity || 'ROUTING OPEN'}</span>
              <button type="button" className="intake-button is-primary" onClick={next}>Continue<ArrowRight size={15} /></button>
            </footer>
          )}
        </section>
      </div>
    </main>
  );
}
