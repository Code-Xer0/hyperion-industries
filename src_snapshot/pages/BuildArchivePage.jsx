import { Link } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import SectionHero from '../components/ui/SectionHero';
import Carousel3D from '../components/ui/Carousel3D';
import './SubPage.css';

export default function BuildArchivePage() {
  return (
    <PageShell>
      <SectionHero
        eyebrow="Artifact Archive"
        title="Classified hardware."
        lead="A curated archive of premium custom builds by Hyperion Industries. Every machine hand-built, tuned, and documented."
      >
        <Link to="/forge" className="btn btn-gold">Enter the Forge</Link>
        <a href="mailto:forge@hyperion-industries.dev?subject=Build%20Inquiry" className="btn btn-ghost">Start Inquiry</a>
      </SectionHero>

      <section className="section" style={{ overflow: 'hidden' }}>
        <div className="shell">
          <Carousel3D />
        </div>
      </section>

      <section className="section section-alt">
        <div className="shell" style={{ textAlign: 'center' }}>
          <h2 className="h2" style={{ fontFamily: 'var(--font-display)' }}>More builds incoming.</h2>
          <p className="body-lead" style={{ margin: '0 auto' }}>For now, reach out directly for the complete portfolio and past build documentation.</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', margin: '28px auto 0' }}>
            <a href="mailto:forge@hyperion-industries.dev" className="btn btn-gold">Contact the Forge</a>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
