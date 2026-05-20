import { Link } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import SectionHero from '../components/ui/SectionHero';
import './SubPage.css';

export default function DevDiaryPage() {
  const entries = [
    { tag: 'Shipped', title: 'Public site stabilization', desc: 'Homepage messaging, Forge separation, systems pages, gallery assets, and public-ready contact paths are being tightened for near-term traffic.' },
    { tag: 'Building', title: 'Routed ecosystem', desc: 'Hyperion is moving from one long brochure into a hub with dedicated wings for systems, builds, media, updates, and commerce placeholders.' },
    { tag: 'Testing', title: 'Archive presentation', desc: 'The build archive keeps the heavier trading-card carousel away from the homepage so performance and focus can be managed separately.' },
  ];

  return (
    <PageShell>
      <SectionHero
        eyebrow="Lab notes"
        title="What is being built, tested, and refined."
        lead="A public development trail for Hyperion systems, forge work, roadmap notes, and behind-the-scenes updates. The lane is active; long-form entries are being staged."
      >
        <Link to="/contact" className="btn btn-gold">Contact Hyperion</Link>
        <Link to="/" className="btn btn-ghost">Back to Hub</Link>
      </SectionHero>

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
            <div>
              <div className="sp-label">What will live here</div>
              <h2 className="h2" style={{ fontFamily: 'var(--font-display)' }}>Roadmap notes without the fog machine.</h2>
            </div>
            <div className="sp-panel">
              <p>Future entries will cover release notes, CHR0N.OS changes, Mnem.OS progress, Forge build logs, public-good infrastructure decisions, and visual system updates in plain English.</p>
              <div className="sp-chips">
                {['What shipped', 'What changed', 'What is next', 'Known gaps'].map(c => (
                  <span key={c} className="sp-chip">{c}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
