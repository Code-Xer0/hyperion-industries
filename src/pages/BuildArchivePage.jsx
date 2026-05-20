import { Link } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import SectionHero from '../components/ui/SectionHero';
import Carousel3D from '../components/ui/Carousel3D';
import HoverEditor from '../components/ui/HoverEditor';
import content from '../data/content.json';
import './SubPage.css';

export default function BuildArchivePage() {
  return (
    <PageShell>
      <HoverEditor model="content">
        <SectionHero
          eyebrow={content.buildarchive.hero.eyebrow}
          title={content.buildarchive.hero.title}
          lead={content.buildarchive.hero.lead}
        >
          <Link to="/forge" className="btn btn-gold">Enter the Forge</Link>
          <a href="mailto:forge@hyperion-industries.dev?subject=Build%20Inquiry" className="btn btn-ghost">Start Inquiry</a>
        </SectionHero>
      </HoverEditor>

      <section className="section" style={{ overflow: 'hidden' }}>
        <div className="shell">
          <Carousel3D />
        </div>
      </section>

      <section className="section section-alt">
        <HoverEditor model="content">
          <div className="shell" style={{ textAlign: 'center' }}>
            <h2 className="h2" style={{ fontFamily: 'var(--font-display)' }}>{content.buildarchive.footer.title}</h2>
            <p className="body-lead" style={{ margin: '0 auto' }}>{content.buildarchive.footer.desc}</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', margin: '28px auto 0' }}>
              <a href="mailto:forge@hyperion-industries.dev" className="btn btn-gold">Contact the Forge</a>
            </div>
          </div>
        </HoverEditor>
      </section>
    </PageShell>
  );
}
