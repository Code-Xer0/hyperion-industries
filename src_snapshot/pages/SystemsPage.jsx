import { Link } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import SectionHero from '../components/ui/SectionHero';
import SystemCard from '../components/cards/SystemCard';
import systems from '../data/systems.json';
import './SubPage.css';

export default function SystemsPage() {
  const primary = systems.filter(s => s.id === 'chronos' || s.id === 'mnemos');
  const secondary = systems.filter(s => s.id !== 'chronos' && s.id !== 'mnemos');

  return (
    <PageShell>
      <SectionHero
        eyebrow="Systems wing"
        title="Software that keeps custody close."
        lead="Hyperion builds local-first tools for people who need custody, continuity, and control. Public demos now. Source protected while the systems mature."
      />

      <section className="section section-alt">
        <div className="shell">
          <div className="sp-label">Active Systems</div>
          <div className="sp-grid-2">
            {primary.map(sys => (
              <article key={sys.id} className="sp-system-card">
                <div className="sp-sys-head">
                  <img src={sys.icon} alt="" />
                  <div>
                    <h3>{sys.name}</h3>
                    <div className="sp-status">{sys.statusLabel}</div>
                  </div>
                </div>
                <p>{sys.description}</p>
                {sys.chips && (
                  <div className="sp-chips">
                    {sys.chips.map(c => <span key={c} className="sp-chip">{c}</span>)}
                  </div>
                )}
                {sys.link && (
                  <div className="sp-actions">
                    {sys.link.startsWith('http')
                      ? <a href={sys.link} className="btn btn-gold" target="_blank" rel="noopener noreferrer">Open {sys.name}</a>
                      : <Link to={sys.link} className="btn btn-gold">{sys.linkLabel}</Link>
                    }
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="sp-label">Research & Hardware Lanes</div>
          <div className="sp-grid-3">
            {secondary.map(sys => (
              <article key={sys.id} className="sp-lane-card">
                <div className="sp-sys-head">
                  <img src={sys.icon} alt="" />
                  <div>
                    <h3>{sys.name}</h3>
                    <div className="sp-status">{sys.statusLabel}</div>
                  </div>
                </div>
                <p>{sys.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
