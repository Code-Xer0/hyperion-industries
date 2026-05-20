import PageShell from '../components/layout/PageShell';
import SectionHero from '../components/ui/SectionHero';
import './SubPage.css';

export default function ContactPage() {
  return (
    <PageShell>
      <SectionHero
        eyebrow="Contact layer"
        title="Bring the right signal."
        lead="Reach out for CHR0N.OS pilots, custom builds, deployments, partnerships, support, and aligned collaborations. Hyperion is currently prioritizing builds, pilots, and strategic partnerships."
      />

      <section className="section section-alt">
        <div className="shell">
          <div className="sp-grid-2">
            <div className="sp-contact-list">
              <a className="sp-contact-link" href="mailto:hello@hyperion-industries.dev">
                <strong>hello@hyperion-industries.dev</strong>
                <span className="meta">General inquiries, pilots, partnerships</span>
              </a>
              <a className="sp-contact-link" id="build" href="mailto:forge@hyperion-industries.dev?subject=Hyperion%20Forge%20Build%20Inquiry">
                <strong>forge@hyperion-industries.dev</strong>
                <span className="meta">Custom PCs, sim rigs, local AI boxes, workstations</span>
              </a>
              <a className="sp-contact-link" href="https://chr0nos.app" target="_blank" rel="noopener noreferrer">
                <strong>CHR0N.OS</strong>
                <span className="meta">Downloads and public product preview</span>
              </a>
            </div>
            <div className="sp-panel">
              <h2 style={{ fontSize: '28px' }}>What to include.</h2>
              <p style={{ marginTop: '12px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                For build inquiries, send your budget range, primary use case, timeline, aesthetic direction, and any must-have hardware. For systems or pilot conversations, send the problem, data type, operating constraints, and what success looks like.
              </p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                <a href="mailto:hello@hyperion-industries.dev" className="btn btn-gold">Email Hyperion</a>
                <a href="mailto:forge@hyperion-industries.dev?subject=Hyperion%20Forge%20Build%20Inquiry" className="btn btn-ghost">Start Build Inquiry</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
