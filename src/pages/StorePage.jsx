import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Shield, Zap } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import { COMMERCE_POSTURE, HYPERION_DIGITAL_PRODUCTS } from '../data/commercialOffers';
import './CommercialPage.css';

const customOffers = [
  ['Forge Builds', 'Custom computers and local compute', 'Start with the workload, environment, and support horizon. Parts and price follow review.', '/forge/configurator'],
  ['Card Studio', 'Physical and digital identity cards', 'Design a believable card, submit the proof, and move to checkout only after approval.', '/card-studio'],
  ['CHR0N.OS', 'Archive intelligence and continuity services', 'Use the public beta yourself or commission assessment, setup, migration, or team continuity.', '/chronos'],
  ['Live Site Series', 'Conversion sites connected to operations', 'Turn the offer, proof, inquiry, and handoff into one deliberate public system.', '/services'],
];

function providerLabel(provider, fallback) {
  if (!provider) return fallback;
  return provider.configuration === 'configured' ? 'sandbox configured' : 'sandbox setup required';
}

export default function StorePage() {
  const [readiness, setReadiness] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/commerce/readiness', { signal: controller.signal, credentials: 'same-origin' })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('readiness unavailable'))))
      .then((value) => {
        if (value?.contract_version === 'hyperion.commerce-readiness/2') setReadiness(value);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const publicStatus = readiness?.release_state === 'sandbox_ready_for_operator_test'
    ? 'SANDBOX READY · PAYMENTS NOT ACTIVE'
    : COMMERCE_POSTURE.public_status;

  return (
    <PageShell>
      <Helmet>
        <title>Hyperion Storefront | Operational Assets & Stratified Systems</title>
        <meta name="description" content="Three personalized Hyperion digital product designs, with deterministic compilation and checkout in sandbox preparation." />
        <link rel="canonical" href="https://hyperion-industries.dev/store" />
      </Helmet>
      <main className="commercial-page">
        <section className="commercial-hero" style={{ '--commercial-hero-image': "url('/assets/forge/media-v1/posters/hyperion-workstation-triptych-1280x720.jpg')" }}>
          <div className="commercial-hero-copy">
            <p className="commercial-kicker">TWO WAYS TO WORK WITH HYPERION</p>
            <h1>Stratified systems.<br /><em>Two clear doors.</em></h1>
            <p>Configure a personalized operational asset for sandbox review, or engage Hyperion to build and integrate a complete system. The storefront is being prepared; payment and delivery are not active yet.</p>

            <div className="store-doors-grid" aria-label="Two doors to Hyperion capability">
              <a href="#products" className="store-door-card is-product">
                <span className="door-tag"><Zap size={12} /> DOOR 01 · PERSONALIZED PRODUCTS</span>
                <strong>Buy something useful now</strong>
                <p>Agent Policy, Flight Pack, and Local + Frontier Routing Starter Kit, compiled for the way you work.</p>
                <span className="door-link">Three products · $19–49 · sandbox checkout staged <ArrowRight size={13} /></span>
              </a>
              <a href="#custom" className="store-door-card is-custom">
                <span className="door-tag"><Shield size={12} /> DOOR 02 · CUSTOM SYSTEMS</span>
                <strong>Build something serious with Hyperion</strong>
                <p>Compose people, AI, software, data, infrastructure, and hardware into one governed operational system.</p>
                <span className="door-link">Intake assessment · Scoped proposal <ArrowRight size={13} /></span>
              </a>
            </div>

            <div className="commercial-actions">
              <Link className="btn btn-gold" to="/intake">Start an intake assessment <ArrowRight size={15} /></Link>
              <Link className="btn btn-ghost" to="/build-archive">Review past systems</Link>
            </div>
          </div>
          <aside className="commercial-rail" aria-label="Public commerce readiness">
            <header><span className="commercial-status">COMMERCE POSTURE</span><strong>{publicStatus}</strong></header>
            <article><span>Digital delivery</span><strong>Deterministic compilation · Verified receipts</strong></article>
            <article><span>Primary interim provider</span><strong>PayPal · {providerLabel(readiness?.providers?.paypal, 'sandbox setup required')}</strong></article>
            <article><span>Standby provider</span><strong>Stripe · {providerLabel(readiness?.providers?.stripe, 'sandbox setup required')}</strong></article>
            <article><span>Custom work boundary</span><strong>Approved proposal required</strong></article>
          </aside>
        </section>

        {/* DOOR 1: COMPILED DIGITAL PRODUCTS */}
        <section id="products" className="commercial-section">
          <div className="commercial-section-heading">
            <div>
              <span>01 · DOOR ONE: COMPILED OPERATIONAL ASSETS</span>
              <h2>Useful products, tailored to the work.</h2>
            </div>
            <p>
              Each product starts with a short configuration. The compiler validates the requested projections and creates a bounded package. We are preparing sandbox fulfillment before opening checkout.
            </p>
          </div>
          <div className="commercial-grid products-grid">
            {HYPERION_DIGITAL_PRODUCTS.map((prod) => (
              <article className="commercial-card product-card" key={prod.id}>
                <span>{prod.tagline}</span>
                <h3>{prod.name}</h3>
                <div className="commercial-price">
                  {prod.price} <small className="price-tag">One-time · v1 updates</small>
                </div>
                <p>{prod.summary}</p>
                <ul>
                  {prod.deliverables.map((item, idx) => (
                    <li key={idx}><CheckCircle2 size={12} className="check-icon" /> {item}</li>
                  ))}
                </ul>
                <div className="product-card-footer">
                  <div className="formats-badge">
                    {prod.formats.map((fmt) => <code key={fmt}>{fmt}</code>)}
                  </div>
                  <a className="product-sample-link" href={prod.sample} download>Download a free sample</a>
                  <Link to={`/store/configure/${prod.id}`} className="btn btn-gold product-cta">
                    Configure a preview <ArrowRight size={14} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
          <div className="commercial-footnote">
            <p><strong>Planned license:</strong> One purchase covers the purchasing business’s own projects, regeneration, and all v1 compatibility updates. Future major versions are separate purchases; there is no subscription billing. Generated files will show the buyer name, verified email, license ID, policy/compiler versions, and artifact hashes before checkout.</p>
            <p><strong>Access:</strong> Refunds revoke future downloads and regeneration. Disputes suspend access while the payment is reconciled. Historical receipts and generations remain recorded. Account recovery, delivery help, and defect reporting will be available after checkout opens.</p>
          </div>
        </section>

        {/* DOOR 2: CUSTOM HIGH-TICKET WORK */}
        <section id="custom" className="commercial-section is-tinted">
          <div className="commercial-section-heading">
            <div>
              <span>02 · DOOR TWO: STRATIFIED SYSTEMS ENGAGEMENTS</span>
              <h2>Four ways to build serious operational capability.</h2>
            </div>
            <p>
              We integrate people, AI, software, data, infrastructure, and hardware into coherent systems. Custom builds remain reviewed because workload, fit, risk, and delivery change the answer.
            </p>
          </div>
          <div className="commercial-grid">
            {customOffers.map(([name, title, copy, path]) => (
              <article className="commercial-card" key={name}>
                <span>{name}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
                <ul>
                  <li>Visible scope and next step</li>
                  <li>Human review before commitment</li>
                  <li>Immutable proposal or proof trail</li>
                </ul>
                <Link to={path}>Explore this lane <ArrowRight size={14} /></Link>
              </article>
            ))}
          </div>
        </section>

        <section className="commercial-section">
          <div className="commercial-final">
            <div>
              <span className="commercial-kicker">03 · OPERATING DISCIPLINE</span>
              <h2>We don't sell seats or hours. We compose functioning systems.</h2>
            </div>
            <div>
              <p>The SaaS vendor sells an isolated primitive. The staffing agency sells human hours. Hyperion compositions integrate the primitives, data, and skilled operators into functioning systems that survive contact with reality.</p>
              <div className="commercial-actions">
                <Link className="btn btn-gold" to="/intake">Start an assessment</Link>
                <Link className="btn btn-ghost" to="/contact">Contact Hyperion</Link>
              </div>
              <div className="commercial-boundary">Verified receipts · Immutable proposals · No surprise billing</div>
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
