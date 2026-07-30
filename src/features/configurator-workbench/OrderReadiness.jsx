import { useMemo, useRef, useState } from 'react';
import {
  ArrowRight, Check, CheckCircle2, CircleDashed, Clock3, LoaderCircle,
  LockKeyhole, PackageCheck, RefreshCw, ShieldCheck, TriangleAlert,
} from 'lucide-react';
import forgeContract from '../../../shared/intake/contracts/forms/forge-configurator.form.json';
import pandoraContract from '../../../shared/intake/contracts/forms/pandora-readiness.form.json';
import {
  assessOrderReadiness,
  buildOrderSubmission,
  createOrderAttempt,
} from './orderReadinessModel.js';

const API_ORIGIN = import.meta.env.PROD
  ? 'https://hyperion-operator.hyperion-industries-intake.workers.dev'
  : '';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const gateIcon = {
  ready: CheckCircle2,
  pending: Clock3,
  review: TriangleAlert,
  blocked: CircleDashed,
};

async function intakeApi(path, options) {
  const response = await fetch(`${API_ORIGIN}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      ...(options?.headers || {}),
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(body?.error?.message || 'The purchase desk could not receive this request.');
    error.code = body?.error?.code || 'request_failed';
    throw error;
  }
  return body;
}

export default function OrderReadiness({
  lane,
  roles,
  selectedIds,
  issues,
  sourcePosture,
  pricedCount,
  total,
  requirements,
  runtime,
  onSave,
}) {
  const [identity, setIdentity] = useState({ name: '', email: '', organization: '' });
  const [fulfillment, setFulfillment] = useState({
    country: 'US',
    timing: 'as_soon_as_ready',
    mode: 'pickup_or_ship',
    marketplaceOptIn: false,
  });
  const [consent, setConsent] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [state, setState] = useState('idle');
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);
  const attemptRef = useRef(null);
  const readiness = useMemo(() => assessOrderReadiness({
    roles,
    selectedIds,
    issues,
    sourcePosture,
    runtimeState: runtime.state,
    pricedCount,
  }), [issues, pricedCount, roles, runtime.state, selectedIds, sourcePosture]);

  const resetAttempt = () => {
    attemptRef.current = null;
    setError('');
  };
  const updateIdentity = (field, value) => {
    resetAttempt();
    setIdentity((current) => ({ ...current, [field]: value }));
  };
  const updateFulfillment = (field, value) => {
    resetAttempt();
    setFulfillment((current) => ({ ...current, [field]: value }));
  };

  const submit = async () => {
    if (state === 'submitting') return;
    const errors = [];
    if (!readiness.canStage) errors.push('Complete the system and clear browser fit blockers first.');
    if (!identity.name.trim()) errors.push('Name is required.');
    if (!EMAIL.test(identity.email.trim())) errors.push('Enter a valid email address.');
    if (!consent) errors.push('Consent to process this fulfillment request is required.');
    if (!reviewed) errors.push('Confirm that you reviewed the selected system and open gates.');
    if (errors.length) {
      setError(errors.join(' '));
      return;
    }

    setState('submitting');
    setError('');
    onSave();
    try {
      attemptRef.current ||= createOrderAttempt();
      const contract = lane === 'forge' ? forgeContract : pandoraContract;
      const payload = await buildOrderSubmission({
        attempt: attemptRef.current,
        lane,
        formId: contract.form_id,
        formVersion: contract.version,
        identity,
        fulfillment,
        requirements,
        roles,
        selectedIds,
        sourcePosture,
        runtime,
        issues,
        totalMinor: total,
        entryUrl: window.location.href,
        effectsMode: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduced' : 'full',
      });
      const result = await intakeApi('/api/intake/submissions', {
        method: 'POST',
        headers: { 'idempotency-key': attemptRef.current.idempotency },
        body: JSON.stringify(payload),
      });
      setReceipt(result.receipt);
      setState('complete');
    } catch (submissionError) {
      setState('error');
      setError(submissionError.message || 'The purchase desk could not receive this request.');
    }
  };

  if (receipt) {
    return (
      <section className="order-desk is-receipt" id="purchase-desk" aria-labelledby="purchase-desk-title">
        <div className="order-receipt-mark"><Check /></div>
        <div>
          <span>FULFILLMENT SIGNAL RECEIVED · HELD FOR REVIEW</span>
          <h2 id="purchase-desk-title">The purchase desk has the exact build trail.</h2>
          <p>Reference <strong>{receipt.reference}</strong>. Your device draft is saved and the operator queue now holds the selected manifest, source posture, fit preflight, and delivery preferences.</p>
        </div>
        <div className="order-receipt-state">
          <small>Current authority</small>
          <strong>{receipt.status}</strong>
          <p>No quote, payment, or merchant order has been created. The next action is a formal compatibility and purchase-time offer refresh.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="order-desk" id="purchase-desk" aria-labelledby="purchase-desk-title">
      <header className="order-desk-header">
        <div>
          <span><PackageCheck size={15} /> HYPERION // PURCHASE DESK</span>
          <h2 id="purchase-desk-title">Take this build from tray to fulfillment.</h2>
          <p>One decisive handoff preserves the exact selection and opens an operator-owned path to compatibility, live offers, payable totals, and merchant release.</p>
        </div>
        <div className="order-readiness-score" data-ready={readiness.canStage}>
          <small>Preflight posture</small>
          <strong>{readiness.canStage ? 'Ready to stage' : `${readiness.blockingCount} blocker${readiness.blockingCount === 1 ? '' : 's'}`}</strong>
          <span>{readiness.readyCount}/{readiness.gates.length} gates complete</span>
        </div>
      </header>

      <div className="order-gates" aria-label="Order-readiness gates">
        {readiness.gates.map((gate, index) => {
          const Icon = gateIcon[gate.state];
          return (
            <article key={gate.id} data-state={gate.state}>
              <div><span>{String(index + 1).padStart(2, '0')}</span><Icon /></div>
              <strong>{gate.label}</strong>
              <p>{gate.detail}</p>
              <small>{gate.state}</small>
            </article>
          );
        })}
      </div>

      <div className="order-desk-body">
        <div className="order-commitment">
          <span>WHAT THIS CLICK DOES</span>
          <h3>It creates the real fulfillment trail—not a pretend order.</h3>
          <ol>
            <li><CheckCircle2 /><div><strong>Preserves this system</strong><p>The selected IDs and requirements are hashed into the operator request.</p></div></li>
            <li><RefreshCw /><div><strong>Queues the five-minute refresh</strong><p>Exact listings, availability, shipping, tax, and condition are rechecked before a quote.</p></div></li>
            <li><ShieldCheck /><div><strong>Stops on every changed total</strong><p>Compatibility, seller, destination, and payable-total changes return to review.</p></div></li>
            <li><LockKeyhole /><div><strong>Keeps checkout isolated</strong><p>No address, payment data, merchant credential, or bearer token enters this browser form.</p></div></li>
          </ol>
        </div>

        <form className="order-handoff" onSubmit={(event) => { event.preventDefault(); submit(); }}>
          <div className="order-form-heading">
            <div><span>FINAL HANDOFF</span><h3>Where should the purchase desk meet you?</h3></div>
            <small>Identity is collected only now.</small>
          </div>
          {error && <div className="order-error" role="alert"><TriangleAlert />{error}</div>}
          <div className="order-form-grid">
            <label><span>Name</span><input autoComplete="name" maxLength={200} value={identity.name} onChange={(event) => updateIdentity('name', event.target.value)} /></label>
            <label><span>Email</span><input type="email" autoComplete="email" maxLength={320} value={identity.email} onChange={(event) => updateIdentity('email', event.target.value)} /></label>
            <label><span>Organization <small>optional</small></span><input autoComplete="organization" maxLength={240} value={identity.organization} onChange={(event) => updateIdentity('organization', event.target.value)} /></label>
            <label><span>Delivery country</span><select value={fulfillment.country} onChange={(event) => updateFulfillment('country', event.target.value)}><option value="US">United States</option><option value="CA">Canada</option><option value="GB">United Kingdom</option><option value="EU">European Union</option><option value="other">Another destination</option></select></label>
            <label><span>Purchase timing</span><select value={fulfillment.timing} onChange={(event) => updateFulfillment('timing', event.target.value)}><option value="as_soon_as_ready">As soon as it clears review</option><option value="within_30_days">Within 30 days</option><option value="planning">Planning posture</option></select></label>
            <label><span>Fulfillment</span><select value={fulfillment.mode} onChange={(event) => updateFulfillment('mode', event.target.value)}><option value="pickup_or_ship">Best verified option</option><option value="ship">Ship</option><option value="pickup">Pickup where eligible</option><option value="operator_guidance">Guide me</option></select></label>
          </div>
          <label className="order-check"><input type="checkbox" checked={fulfillment.marketplaceOptIn} onChange={(event) => updateFulfillment('marketplaceOptIn', event.target.checked)} /><span><strong>Include marketplace listings for review</strong><small>New retailer-direct inventory remains the default. Marketplace condition, seller, warranty, and return posture stay visible.</small></span></label>
          <label className="order-check"><input type="checkbox" checked={reviewed} onChange={(event) => { resetAttempt(); setReviewed(event.target.checked); }} /><span><strong>I reviewed this system and the open gates.</strong><small>This is an operator request, not approval of a quote or compatibility promise.</small></span></label>
          <label className="order-check"><input type="checkbox" checked={consent} onChange={(event) => { resetAttempt(); setConsent(event.target.checked); }} /><span><strong>I consent to Hyperion processing this fulfillment request.</strong><small>No marketing consent is collected.</small></span></label>
          <button type="submit" disabled={state === 'submitting' || !readiness.canStage}>
            {state === 'submitting' ? <><LoaderCircle className="bench-spin" />Opening fulfillment trail…</> : <>Stage with the purchase desk<ArrowRight /></>}
          </button>
          <footer><LockKeyhole /><span>Held for operator review · idempotent handoff · no payment or order execution</span></footer>
        </form>
      </div>
    </section>
  );
}
