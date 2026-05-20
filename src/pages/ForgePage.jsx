import { Link } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import SectionHero from '../components/ui/SectionHero';
import './SubPage.css';
import content from '../data/content.json';
import HoverEditor from '../components/ui/HoverEditor';

export default function ForgePage() {
  const lanes = [
    { tag: 'Local AI', title: 'Inference boxes', desc: 'GPU-heavy rigs for local models, private archives, research workflows, and agent labs.' },
    { tag: 'Creative', title: 'Studio systems', desc: 'Fast editing, media libraries, render work, capture setups, and clean desk deployments.' },
    { tag: 'Field', title: 'Deployment workstations', desc: 'Reliable machines for operators who need uptime, storage, and clean maintenance paths.' },
  ];

  return (
    <PageShell>
      <HoverEditor model="content">
        <SectionHero
          eyebrow={content.forge.hero.eyebrow}
          title={content.forge.hero.title}
          lead={content.forge.hero.lead}
        >
          <a href="mailto:forge@hyperion-industries.dev?subject=Hyperion%20Forge%20Build%20Inquiry" className="btn btn-gold">Start a Build Inquiry</a>
          <Link to="/build-archive" className="btn btn-ghost">View Build Archive</Link>
        </SectionHero>
      </HoverEditor>

      <section className="section section-alt">
        <div className="shell">
          <HoverEditor model="content">
            <div className="sp-grid-2">
              <div>
                <div className="sp-label">Build lanes</div>
                <div className="sp-panel">
                  <h2>{content.forge.lanes.titlePart1}<br /><em>{content.forge.lanes.titlePart2}</em></h2>
                </div>
              </div>
              <div className="sp-grid-3" style={{ gridTemplateColumns: '1fr' }}>
                {lanes.map(l => (
                  <div key={l.title} className="sp-lane-card">
                    <div className="sp-status">{l.tag}</div>
                    <h3 style={{ margin: '8px 0' }}>{l.title}</h3>
                    <p>{l.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </HoverEditor>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="sp-media-strip">
            <img src="/assets/builds/20230803_133211.jpg" alt="Hyperion custom PC desk setup" />
            <img src="/assets/builds/20221224_211435.jpg" alt="White custom PC build" />
          </div>
          <div className="sp-actions" style={{ justifyContent: 'center', marginTop: '28px' }}>
            <Link to="/build-archive" className="btn btn-gold">Open Artifact Archive</Link>
            <a href="mailto:forge@hyperion-industries.dev?subject=Hyperion%20Forge%20Build%20Inquiry" className="btn btn-ghost">Talk Through a Build</a>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="shell">
          <HoverEditor model="content">
            <div className="sp-grid-2">
              <div>
                <div className="sp-label">Future Forge modules</div>
                <h2 className="h2" style={{ fontFamily: 'var(--font-display)' }}>{content.forge.future.title}</h2>
                <p className="body-lead">{content.forge.future.lead}</p>
              </div>
              <div className="sp-panel">
                <p style={{ color: 'var(--text-dim)', fontSize: '12px', borderLeft: '1px solid var(--border-gold)', paddingLeft: '14px' }}>
                  {content.forge.future.planned}
                </p>
              </div>
            </div>
          </HoverEditor>
        </div>
      </section>
    </PageShell>
  );
}
