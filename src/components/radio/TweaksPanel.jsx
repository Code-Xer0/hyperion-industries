import { useState } from 'react';

const SWATCHES = [
  { key: 'red', color: '#E10000', title: 'Operator Red' },
  { key: 'gold', color: '#D4AF37', title: 'Sovereign Gold' },
  { key: 'crimson', color: '#c8232a', title: 'Deep Crimson' },
  { key: 'ember', color: '#ff5a2c', title: 'Ember' },
];

/**
 * Tweaks panel — the owner-facing control surface ported 1:1 from the design.
 * Accent (incl. ember), ambient intensity, card motion, gravity lattice
 * (off by default), film grain, and portrait visibility. State + persistence
 * live in FounderPage; this is the presentational panel + gear toggle.
 */
export default function TweaksPanel({ tweaks, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="fp-gear" aria-label="Tweaks" title="Tweaks" onClick={() => setOpen((o) => !o)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {open && (
        <div className="fp-tweaks" role="dialog" aria-label="Tweaks">
          <div className="th"><span>Tweaks</span><button onClick={() => setOpen(false)} aria-label="Close">×</button></div>

          <div className="fp-tw">
            <div className="lbl">Accent</div>
            <div className="fp-swatches">
              {SWATCHES.map((s) => (
                <button key={s.key} className={`fp-sw${tweaks.accent === s.key ? ' on' : ''}`} style={{ background: s.color }}
                  title={s.title} aria-label={s.title} onClick={() => onChange('accent', s.key)} />
              ))}
            </div>
          </div>

          <div className="fp-tw">
            <div className="lbl">Ambient intensity <span className="val">{tweaks.amb}%</span></div>
            <input className="fp-range" type="range" min="0" max="160" step="10" value={tweaks.amb}
              onChange={(e) => onChange('amb', Number(e.target.value))} aria-label="Ambient intensity" />
          </div>

          <div className="fp-tw">
            <div className="lbl">Card motion</div>
            <div className="fp-seg">
              <button className={tweaks.cards === 'float' ? 'on' : ''} onClick={() => onChange('cards', 'float')}>Float</button>
              <button className={tweaks.cards === 'still' ? 'on' : ''} onClick={() => onChange('cards', 'still')}>Still</button>
            </div>
          </div>

          <div className="fp-tw">
            <div className="lbl">Display</div>
            <label className="fp-toggle"><input type="checkbox" checked={tweaks.lattice} onChange={(e) => onChange('lattice', e.target.checked)} /> Gravity lattice</label>
            <label className="fp-toggle"><input type="checkbox" checked={tweaks.grain} onChange={(e) => onChange('grain', e.target.checked)} /> Film grain</label>
            <label className="fp-toggle"><input type="checkbox" checked={tweaks.portrait} onChange={(e) => onChange('portrait', e.target.checked)} /> Show portrait</label>
          </div>
        </div>
      )}
    </>
  );
}
