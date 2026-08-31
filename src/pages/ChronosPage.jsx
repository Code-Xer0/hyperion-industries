import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import { CHRONOS_SERVICES } from '../data/commercialOffers';
import './CommercialPage.css';

const releaseUrl = 'https://github.com/Code-Xer0/CHR0N.OS-Preview/releases/tag/v0.2.3-beta.1';

export default function ChronosPage() {
  return (
    <PageShell>
      <Helmet>
        <title>CHR0N.OS | Local-First Archive Intelligence</title>
        <meta name="description" content="Recover scattered files and preserve their provenance with CHR0N.OS, Hyperion's public local-first archive intelligence flagship." />
        <link rel="canonical" href="https://hyperion-industries.dev/chronos" />
      </Helmet>
      <main className="commercial-page" style={{ '--commercial-accent': '#55d9ff' }}>
        <section className="commercial-hero" style={{ '--commercial-hero-image': "url('/assets/cinematic-v2/chronos-archive-observatory.webp')" }}>
          <div className="commercial-hero-copy">
            <p className="commercial-kicker">HYPERION FLAGSHIP · PUBLIC BETA · LOCAL-FIRST</p>
            <h1>Your files have history.<br /><em>Keep it.</em></h1>
            <p>CHR0N.OS helps people recover messy archives, preserve where files came from, and make the next handoff legible—without making the cloud the source of truth.</p>
            <div className="commercial-actions">
              <a className="btn btn-gold" href="https://chr0nos.app">Open the public beta <ExternalLink size={15} /></a>
              <Link className="btn btn-ghost" to="/intake/continuity?service=assessment&source=chronos">Book an archive assessment</Link>
            </div>
          </div>
          <aside className="commercial-rail" aria-label="CHR0N.OS public posture">
            <header><span className="commercial-status">CURRENT RELEASE</span><strong>v0.2.3 beta 1</strong></header>
            <article><span>Source of truth</span><strong>Your local archive</strong></article>
            <article><span>Public capability</span><strong>Capture · provenance · search · review</strong></article>
            <article><span>Boundary</span><strong>No silent automation or custody transfer</strong></article>
            <article><span>Download</span><strong><a href={releaseUrl}>Verified release lane ↗</a></strong></article>
          </aside>
        </section>

        <section className="commercial-section is-tinted" aria-labelledby="chron-proof-title">
          <div className="commercial-section-heading"><div><span>01 · PRODUCTION EVIDENCE</span><h2 id="chron-proof-title">A real product, shown with a fictional archive.</h2></div><p>These are direct v0.2.3 product captures from an isolated Project Aurora demo workspace. They show shipped beta surfaces, not concept art or customer data.</p></div>
          <div className="commercial-proof">
            <article><img src="/assets/chronos/v023/chronos-023-intake.png" alt="CHR0N.OS file intake surface using the fictional Project Aurora demo corpus" loading="lazy" /><h3>Capture with context</h3><p>Bring files into a working archive while preserving their source and keeping the original record untouched.</p></article>
            <article><img src="/assets/chronos/v023/chronos-023-timeline-ingested.png" alt="CHR0N.OS timeline of fictional Project Aurora artifacts" loading="lazy" /><h3>See time and lineage</h3><p>Review archive state chronologically so aging records, gaps, and handoff pressure become visible.</p></article>
            <article><img src="/assets/chronos/v023/chronos-023-library-ingested.png" alt="CHR0N.OS library after fictional Project Aurora intake" loading="lazy" /><h3>Recover the working set</h3><p>Search and inspect a coherent local library instead of rediscovering the same scattered material again.</p></article>
          </div>
        </section>

        <section className="commercial-section" aria-labelledby="chron-services-title">
          <div className="commercial-section-heading"><div><span>02 · SERVICES</span><h2 id="chron-services-title">Start small. Recover what matters.</h2></div><p>The software remains available as a public beta. Paid work adds review, setup, migration, and team operating design—not a hidden license gate.</p></div>
          <div className="commercial-grid">
            {CHRONOS_SERVICES.map((offer) => <article className="commercial-card" key={offer.id}><span>CHR0N.OS SERVICE</span><h3>{offer.name}</h3><div className="commercial-price">{offer.price}</div><p>{offer.summary}</p><ul>{offer.deliverables.map((item) => <li key={item}>{item}</li>)}</ul><Link to={`/intake/continuity?service=${offer.id}&source=chronos`}>Start this assessment <ArrowRight size={14} /></Link></article>)}
          </div>
        </section>

        <section className="commercial-section is-tinted"><div className="commercial-final"><div><span className="commercial-kicker">03 · OPERATOR REVIEW</span><h2>Let the archive remember before the system acts.</h2></div><div><p>Every paid engagement begins with a bounded intake and a reviewed proposal. Submitting a request does not create an order, move a file, or authorize automation.</p><div className="commercial-actions"><Link className="btn btn-gold" to="/intake/continuity?source=chronos">Start a continuity signal <ArrowRight size={15} /></Link><a className="btn btn-ghost" href={releaseUrl}>Read the release notes</a></div><div className="commercial-boundary">Proposal first · customer approval required · payments sandbox only</div></div></div></section>
      </main>
    </PageShell>
  );
}
