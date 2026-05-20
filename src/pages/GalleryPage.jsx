import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import SectionHero from '../components/ui/SectionHero';
import './SubPage.css';

import HoverEditor from '../components/ui/HoverEditor';
import galleryAssets from '../data/gallery.json';
import content from '../data/content.json';

export default function GalleryPage() {
  const [filter, setFilter] = useState('All');
  const assets = galleryAssets;

  const filteredAssets = filter === 'All' ? assets : assets.filter(a => a.type === filter);

  return (
    <PageShell>
      <HoverEditor model="content">
        <SectionHero
          eyebrow={content.gallery.hero.eyebrow}
          title={content.gallery.hero.title}
          lead={content.gallery.hero.lead}
        >
          <Link to="/build-archive" className="btn btn-gold">Open Trading Card Archive</Link>
          <Link to="/forge" className="btn btn-ghost">Enter the Forge</Link>
        </SectionHero>
      </HoverEditor>

      {/* ── Operator Hero ── */}
      <HoverEditor model="content">
        <section className="gallery-operator-hero">
          <img src={content.gallery.operatorHero.image} alt="Δeus χ wide Hyperion operator visual" />
          <div className="gallery-operator-overlay" />
          <div className="shell gallery-operator-content">
            <div className="sp-label">Completed asset</div>
            <h2 style={{ maxWidth: '560px', fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800 }}>{content.gallery.operatorHero.title}</h2>
            <p style={{ maxWidth: '520px', color: 'var(--text-soft)', lineHeight: 1.75, marginTop: '12px' }}>{content.gallery.operatorHero.desc}</p>
          </div>
        </section>
      </HoverEditor>

      {/* ── Media Strip ── */}
      <HoverEditor model="content">
        <section className="section section-alt">
          <div className="shell">
            <div className="sp-media-strip">
              <img src={content.gallery.mediaStrip.image1} alt="Wide Hyperion Δeus χ brand plate" />
              <img src={content.gallery.mediaStrip.image2} alt="Circular Δeus χ avatar asset" />
            </div>
          </div>
        </section>
      </HoverEditor>

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
            {filteredAssets.map((a, i) => {
              const originalIndex = galleryAssets.findIndex(ga => ga.src === a.src);
              return (
                <HoverEditor key={i} model="gallery" index={originalIndex}>
                  <article className={`gallery-asset-card${a.reference ? ' reference' : ''}`}>
                    <img src={a.src} alt={a.label} />
                    <div className="gallery-asset-overlay" />
                    <div className="gallery-asset-label">
                      <strong>{a.label}</strong>
                      <span>{a.desc}</span>
                    </div>
                  </article>
                </HoverEditor>
              );
            })}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
