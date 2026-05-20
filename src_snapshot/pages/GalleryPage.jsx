import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import SectionHero from '../components/ui/SectionHero';
import './SubPage.css';

export default function GalleryPage() {
  const [filter, setFilter] = useState('All');

  const assets = [
    { src: '/assets/operators/deus-x-portrait-complete.png', label: 'Avatar base', desc: 'Primary portrait for crops, dossiers, and operator panels.', type: 'Portraits' },
    { src: '/assets/operators/deus-x-tarot-card.png', label: 'Tarot complete', desc: 'Use when the card artifact itself is the content.', type: 'Cards' },
    { src: '/assets/operators/deus-x-card-reference-sheet.png', label: 'Reference sheet', desc: 'Design source, not a default public hero image.', type: 'References', reference: true },
  ];

  const filteredAssets = filter === 'All' ? assets : assets.filter(a => a.type === filter);

  return (
    <PageShell>
      <SectionHero
        eyebrow="Gallery wing"
        title="Signals, cards, renders, and field pieces."
        lead="A cleaner public shelf for the visual side of Hyperion: build cards, product marks, operator visuals, showcase pieces, and cinematic previews."
      >
        <Link to="/build-archive" className="btn btn-gold">Open Trading Card Archive</Link>
        <Link to="/forge" className="btn btn-ghost">Enter the Forge</Link>
      </SectionHero>

      {/* ── Operator Hero ── */}
      <section className="gallery-operator-hero">
        <img src="/assets/operators/deus-x-terminal-frame.png" alt="Δeus χ wide Hyperion operator visual" />
        <div className="gallery-operator-overlay" />
        <div className="shell gallery-operator-content">
          <div className="sp-label">Completed asset</div>
          <h2 style={{ maxWidth: '560px', fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800 }}>Operator visuals now have room to breathe.</h2>
          <p style={{ maxWidth: '520px', color: 'var(--text-soft)', lineHeight: 1.75, marginTop: '12px' }}>Finished pieces are used as presentation assets. Reference sheets stay available as source material for future cards, avatars, wallpapers, and hidden details.</p>
        </div>
      </section>

      {/* ── Media Strip ── */}
      <section className="section section-alt">
        <div className="shell">
          <div className="sp-media-strip">
            <img src="/assets/operators/deus-x-wide-brand.png" alt="Wide Hyperion Δeus χ brand plate" />
            <img src="/assets/operators/deus-x-avatar-orb.png" alt="Circular Δeus χ avatar asset" />
          </div>
        </div>
      </section>

      {/* ── Asset Grid ── */}
      <section className="section">
        <div className="shell">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div className="sp-label" style={{ marginBottom: 0 }}>Asset Gallery</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['All', 'Portraits', 'Cards', 'References'].map(f => (
                <button 
                  key={f} 
                  onClick={() => setFilter(f)}
                  style={{
                    background: filter === f ? 'var(--gold-glow)' : 'transparent',
                    border: `1px solid ${filter === f ? 'var(--border-gold)' : 'var(--border-soft)'}`,
                    color: filter === f ? 'var(--gold)' : 'var(--text-dim)',
                    padding: '6px 12px',
                    borderRadius: '100px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-display)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    cursor: 'pointer',
                    transition: 'all 0.16s ease'
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="gallery-asset-grid">
            {filteredAssets.map((a, i) => (
              <article key={i} className={`gallery-asset-card${a.reference ? ' reference' : ''}`}>
                <img src={a.src} alt={a.label} />
                <div className="gallery-asset-overlay" />
                <div className="gallery-asset-label">
                  <strong>{a.label}</strong>
                  <span>{a.desc}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
