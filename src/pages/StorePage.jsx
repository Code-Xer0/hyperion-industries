import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import { COMMERCE_POSTURE } from '../data/commercialOffers';
import './CommercialPage.css';

const offers = [
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
        <title>Work with Hyperion | Products and Services</title>
        <meta name="description" content="Explore Hyperion Forge builds, Card Studio, CHR0N.OS services, and the Live Site Series. Every paid engagement remains proposal-first." />
        <link rel="canonical" href="https://hyperion-industries.dev/store" />
      </Helmet>
      <main className="commercial-page">
        <section className="commercial-hero" style={{ '--commercial-hero-image': "url('/assets/forge/media-v1/posters/hyperion-workstation-triptych-1280x720.jpg')" }}>
          <div className="commercial-hero-copy">
            <p className="commercial-kicker">HYPERION PRODUCTS + SERVICES</p>
            <h1>Choose the work.<br /><em>Keep the gate.</em></h1>
            <p>Explore the public offer, create a useful brief, and receive a reviewed proposal. No cinematic, form, or button places an order by itself.</p>
            <div className="commercial-actions">
              <Link className="btn btn-gold" to="/intake">Start a project <ArrowRight size={15} /></Link>
              <Link className="btn btn-ghost" to="/build-archive">Review the proof</Link>
            </div>
          </div>
          <aside className="commercial-rail" aria-label="Public commerce readiness">
            <header><span className="commercial-status">COMMERCE POSTURE</span><strong>{publicStatus}</strong></header>
            <article><span>Primary interim provider</span><strong>PayPal · {providerLabel(readiness?.providers?.paypal, 'sandbox setup required')}</strong></article>
            <article><span>Standby provider</span><strong>Stripe · {providerLabel(readiness?.providers?.stripe, 'sandbox setup required')}</strong></article>
            <article><span>Order boundary</span><strong>Approved proposal or proof required</strong></article>
          </aside>
        </section>

        <section className="commercial-section">
          <div className="commercial-section-heading">
            <div><span>01 · STARTING POINTS</span><h2>Four ways to move real work forward.</h2></div>
            <p>Prices appear where the offer is bounded. Custom builds remain reviewed because workload, fit, risk, and delivery change the answer.</p>
          </div>
          <div className="commercial-grid">
            {offers.map(([name, title, copy, path]) => (
              <article className="commercial-card" key={name}>
                <span>{name}</span><h3>{title}</h3><p>{copy}</p>
                <ul><li>Visible scope and next step</li><li>Human review before commitment</li><li>Immutable proposal or proof trail</li></ul>
                <Link to={path}>Explore this lane <ArrowRight size={14} /></Link>
              </article>
            ))}
          </div>
        </section>

        <section className="commercial-section is-tinted">
          <div className="commercial-final">
            <div><span className="commercial-kicker">02 · PAYMENT READINESS</span><h2>Payment follows agreement—not persuasion.</h2></div>
            <div>
              <p>PayPal is being prepared as the primary interim provider and Stripe as a sandbox standby. Neither becomes a live payment path until credentials, webhooks, reconciliation, and a separately authorized live smoke are verified.</p>
              <div className="commercial-actions"><Link className="btn btn-gold" to="/services">View service packages</Link><Link className="btn btn-ghost" to="/contact">Contact Hyperion</Link></div>
              <div className="commercial-boundary">No live capture · no one-click order · proposal or proof required</div>
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
