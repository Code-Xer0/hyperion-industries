import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import PageShell from '../../components/layout/PageShell';
import { HYPERION_DIGITAL_PRODUCTS } from '../../data/commercialOffers';
import './ProductConfiguratorPage.css';

const PROJECTIONS = [
  { id: 'codex', label: 'Codex' },
  { id: 'claude-code', label: 'Claude Code' },
  { id: 'gemini-cli', label: 'Gemini CLI' },
  { id: 'generic', label: 'Generic agent instructions' },
];
const fieldSets = {
  'agent-policy': [
    { name: 'business', label: 'Business or team name', required: true, max: 100 },
    { name: 'project', label: 'What kind of project or repository is this?', required: true, max: 500 },
    { name: 'canonical', label: 'Canonical policy location', required: true, max: 160, placeholder: 'AGENTS.md at repository root' },
    { name: 'authorityOwner', label: 'Who approves changes and publication?', required: true, max: 240 },
    { name: 'existingRules', label: 'Existing rules or known conflicts', max: 800 },
  ],
  'flight-pack': [
    { name: 'project', label: 'Project name and bounded area of work', required: true, max: 180 },
    { name: 'objective', label: 'What should be true when this work is done?', required: true, max: 800 },
    { name: 'scope', label: 'Files, systems, and actions in scope', required: true, max: 800 },
    { name: 'acceptance', label: 'Observable acceptance criteria', required: true, max: 800 },
    { name: 'verification', label: 'Verification command or review method', required: true, max: 240 },
  ],
  'routing-kit': [
    { name: 'hardware', label: 'Local hardware and memory', required: true, max: 300, placeholder: 'GPU/VRAM, system RAM, CPU, OS' },
    { name: 'localRuntime', label: 'Local model runtime or service', max: 180 },
    { name: 'subscriptions', label: 'Subscriptions and provider access', required: true, max: 300 },
    { name: 'workloads', label: 'Workload classes to route', required: true, max: 500 },
    { name: 'monthlyBudget', label: 'Maximum monthly API spend (USD)', required: true, max: 20, placeholder: '50' },
    { name: 'constraints', label: 'Privacy, latency, and quality constraints', required: true, max: 500 },
  ],
};

const emptyProjectionState = () => Object.fromEntries(PROJECTIONS.map(({ id }) => [id, true]));

export default function ProductConfiguratorPage() {
  const { productId } = useParams();
  const product = useMemo(() => HYPERION_DIGITAL_PRODUCTS.find((item) => item.id === productId), [productId]);
  const fields = fieldSets[productId] || [];
  const [values, setValues] = useState({});
  const [projections, setProjections] = useState(emptyProjectionState);
  const [state, setState] = useState('idle');
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState(null);

  if (!product) {
    return <PageShell><main className="product-config-page"><h1>Product not found</h1><Link to="/store">Return to the storefront</Link></main></PageShell>;
  }

  const update = (event) => setValues((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  const compilePreview = async (event) => {
    event.preventDefault();
    setState('loading');
    setMessage('Checking the configuration and requested projections…');
    setPreview(null);
    try {
      const selectedProjections = Object.entries(projections).filter(([, enabled]) => enabled).map(([id]) => id);
      const response = await fetch('/api/commerce/products/preview', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ product_id: product.id, configuration: values, ...(product.id === 'agent-policy' ? { projections: selectedProjections } : {}) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error?.message || 'The configuration could not be validated.');
      setPreview(result.preview);
      setState('ready');
      setMessage('Configuration validated. This preview does not create a paid package or account entitlement.');
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : 'The configuration could not be validated.');
    }
  };

  return (
    <PageShell>
      <Helmet>
        <title>Configure {product.name} | Hyperion Industries</title>
        <meta name="description" content={`Configure a preview for ${product.name}. Checkout remains in sandbox preparation.`} />
      </Helmet>
      <main className="product-config-page">
        <Link className="product-back-link" to="/store"><ArrowLeft size={15} /> Storefront</Link>
        <header className="product-config-heading">
          <span>PERSONALIZED PRODUCT · CONFIGURATION PREVIEW</span>
          <h1>{product.name}</h1>
          <p>{product.summary}</p>
          <div className="product-price-row"><strong>{product.price}</strong><span>one-time · no subscription</span></div>
        </header>
        <div className="product-config-layout">
          <form className="product-config-form" onSubmit={compilePreview}>
            <fieldset>
              <legend>1 · Describe the operating environment</legend>
              {fields.map((field) => (
                <label className="product-config-field" key={field.name}>
                  <span>{field.label}{field.required && <b aria-hidden="true"> *</b>}</span>
                  {field.max > 200 ? (
                    <textarea name={field.name} value={values[field.name] || ''} onChange={update} maxLength={field.max} required={field.required} placeholder={field.placeholder || ''} rows={3} />
                  ) : (
                    <input name={field.name} value={values[field.name] || ''} onChange={update} maxLength={field.max} required={field.required} placeholder={field.placeholder || ''} />
                  )}
                </label>
              ))}
            </fieldset>
            {product.id === 'agent-policy' && <fieldset>
              <legend>2 · Select instruction projections</legend>
              <p>All four are selected by default. The files guide agent behavior; runtime permissions still come from each agent environment.</p>
              <div className="product-projection-list">
                {PROJECTIONS.map(({ id, label }) => (
                  <label key={id}>
                    <input type="checkbox" checked={projections[id]} onChange={(event) => setProjections((previous) => ({ ...previous, [id]: event.target.checked }))} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>}
            <button className="btn btn-gold product-preview-button" type="submit" disabled={state === 'loading' || (product.id === 'agent-policy' && !Object.values(projections).some(Boolean))}>
              {state === 'loading' ? 'Validating…' : 'Validate configuration'} <ArrowRight size={15} />
            </button>
            <p className={`product-config-message is-${state}`} role="status" aria-live="polite">{message}</p>
          </form>

          <aside className="product-config-summary">
            <span>PACKAGE SHAPE</span>
            <h2>What this product prepares</h2>
            <ul>{product.deliverables.map((item) => <li key={item}><CheckCircle2 size={14} />{item}</li>)}</ul>
            {preview && <div className="product-preview-result"><span>VALIDATED PREVIEW</span><p>{preview.summary}</p><code>{preview.artifact_names.join(' · ')}</code></div>}
            <div className="product-config-terms">
              <strong>Checkout is still being prepared.</strong>
              <p>No payment is taken here. Before checkout opens, you will review the generated files, buyer watermark, price, and license. Future major versions are separate purchases. A refund revokes future downloads and regeneration.</p>
            </div>
          </aside>
        </div>
      </main>
    </PageShell>
  );
}
