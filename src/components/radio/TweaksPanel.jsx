import { useEffect, useRef, useState } from 'react';

const SWATCHES = [
  { key: 'red', color: '#E10000', title: 'Operator Red' },
  { key: 'gold', color: '#D4AF37', title: 'Sovereign Gold' },
  { key: 'crimson', color: '#c8232a', title: 'Deep Crimson' },
  { key: 'ember', color: '#ff5a2c', title: 'Ember' },
];

/**
 * Console tuning drawer — the operator-facing display controls.
 * Docked off-screen on the left edge (a thin tab stays visible) so it costs
 * no space on mobile; a one-time hint bounce on page visit signals it exists.
 * Accessibility-first: real dialog semantics, focus moved in on open, Escape
 * and scrim close, full keyboard operability, generous touch targets.
 */
export default function TweaksPanel({ tweaks, onChange }) {
  const [open, setOpen] = useState(false);
  const [hint, setHint] = useState(false);
  const drawerRef = useRef(null);
  const tabRef = useRef(null);

  // One-time clue bounce shortly after the page mounts.
  useEffect(() => {
    const t1 = setTimeout(() => setHint(true), 1600);
    const t2 = setTimeout(() => setHint(false), 4400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // focus management: move focus into the drawer on open, restore on close
  useEffect(() => {
    if (open) drawerRef.current?.querySelector('button, input, [tabindex]')?.focus();
    else tabRef.current?.focus({ preventScroll: true });
  }, [open]);

  // Escape closes from anywhere inside
  const onKeyDown = (e) => { if (e.key === 'Escape') setOpen(false); };

  return (
    <>
      <button
        ref={tabRef}
        className={`fp-dock-tab${hint && !open ? ' hint' : ''}${open ? ' is-open' : ''}`}
        aria-expanded={open}
        aria-controls="fp-console-drawer"
        aria-label={open ? 'Close display console' : 'Open display console'}
        title="Display console"
        onClick={() => setOpen((o) => !o)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" />
          <path d="M1.5 14h5M9.5 8h5M17.5 16h5" />
        </svg>
        <span className="fp-dock-label">Console</span>
      </button>

      {open && <div className="fp-drawer-scrim" onClick={() => setOpen(false)} aria-hidden="true" />}

      <aside
        id="fp-console-drawer"
        ref={drawerRef}
        className={`fp-drawer${open ? ' open' : ''}`}
        role="dialog"
        aria-label="Display console — visual tuning"
        aria-hidden={!open}
        onKeyDown={onKeyDown}
      >
        <header className="fp-drawer-head">
          <div>
            <strong>Display console</strong>
            <span>Visual tuning · saved on this device</span>
          </div>
          <button className="fp-drawer-close" onClick={() => setOpen(false)} aria-label="Close console">×</button>
        </header>

        <section className="fp-ctl" aria-labelledby="fp-ctl-accent">
          <h3 id="fp-ctl-accent">Signal color</h3>
          <div className="fp-accent-row" role="radiogroup" aria-labelledby="fp-ctl-accent">
            {SWATCHES.map((s) => (
              <button
                key={s.key}
                role="radio"
                aria-checked={tweaks.accent === s.key}
                aria-label={s.title}
                className={`fp-accent-chip${tweaks.accent === s.key ? ' on' : ''}`}
                onClick={() => onChange('accent', s.key)}
              >
                <i style={{ background: s.color }} aria-hidden="true" />
                <span>{s.title.split(' ').pop()}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="fp-ctl">
          <label htmlFor="fp-amb-range"><h3>Ambience level <output htmlFor="fp-amb-range">{tweaks.amb}%</output></h3></label>
          <input
            id="fp-amb-range"
            className="fp-range"
            type="range" min="0" max="160" step="10"
            value={tweaks.amb}
            onChange={(e) => onChange('amb', Number(e.target.value))}
            aria-valuetext={`${tweaks.amb} percent`}
          />
        </section>

        <section className="fp-ctl" aria-labelledby="fp-ctl-motion">
          <h3 id="fp-ctl-motion">Card motion</h3>
          <div className="fp-switch-row" role="radiogroup" aria-labelledby="fp-ctl-motion">
            <button role="radio" aria-checked={tweaks.cards === 'float'} className={tweaks.cards === 'float' ? 'on' : ''} onClick={() => onChange('cards', 'float')}>Drift</button>
            <button role="radio" aria-checked={tweaks.cards === 'still'} className={tweaks.cards === 'still' ? 'on' : ''} onClick={() => onChange('cards', 'still')}>Still</button>
          </div>
        </section>

        <section className="fp-ctl" aria-labelledby="fp-ctl-layers">
          <h3 id="fp-ctl-layers">Layers</h3>
          <label className="fp-line"><input type="checkbox" checked={tweaks.lattice} onChange={(e) => onChange('lattice', e.target.checked)} /> <span>Gravity wells</span></label>
          <label className="fp-line"><input type="checkbox" checked={tweaks.grain} onChange={(e) => onChange('grain', e.target.checked)} /> <span>Film grain</span></label>
          <label className="fp-line"><input type="checkbox" checked={tweaks.portrait} onChange={(e) => onChange('portrait', e.target.checked)} /> <span>Operator portrait</span></label>
        </section>
      </aside>
    </>
  );
}
