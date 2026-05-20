import { Link } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import SectionHero from '../components/ui/SectionHero';
import HoverEditor from '../components/ui/HoverEditor';
import content from '../data/content.json';
import './SubPage.css';

export default function DevDiaryPage() {
  const entries = [
    { tag: 'Shipped', title: 'Public site stabilization', desc: 'Homepage messaging, Forge separation, systems pages, gallery assets, and public-ready contact paths are being tightened for near-term traffic.' },
    { tag: 'Building', title: 'Routed ecosystem', desc: 'Hyperion is moving from one long brochure into a hub with dedicated wings for systems, builds, media, updates, and commerce placeholders.' },
    { tag: 'Testing', title: 'Archive presentation', desc: 'The build archive keeps the heavier trading-card carousel away from the homepage so performance and focus can be managed separately.' },
  ];

  return (
    <PageShell>
      <HoverEditor model="content">
        <SectionHero
          eyebrow={content.devdiary.hero.eyebrow}
          title={content.devdiary.hero.title}
          lead={content.devdiary.hero.lead}
        >
          <Link to="/contact" className="btn btn-gold">Contact Hyperion</Link>
          <Link to="/" className="btn btn-ghost">Back to Hub</Link>
        </SectionHero>
      </HoverEditor>

      <section className="section section-alt">
        <div className="shell">
          <div className="sp-label">Current Status</div>
          <div className="sp-grid-3">
            {entries.map(e => (
              <article key={e.title} className="sp-lane-card">
                <div className="sp-status">{e.tag}</div>
                <h3 style={{ margin: '8px 0' }}>{e.title}</h3>
                <p>{e.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="sp-grid-2">
            <HoverEditor model="content">
              <div>
                <div className="sp-label">What will live here</div>
                <h2 className="h2" style={{ fontFamily: 'var(--font-display)' }}>{content.devdiary.roadmap.title}</h2>
              </div>
              <div className="sp-panel">
                <p>{content.devdiary.roadmap.desc}</p>
                <div className="sp-chips">
                  {['What shipped', 'What changed', 'What is next', 'Known gaps'].map(c => (
                    <span key={c} className="sp-chip">{c}</span>
                  ))}
                </div>
              </div>
            </HoverEditor>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
