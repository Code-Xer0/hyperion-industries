import { useEffect, useState } from 'react';
import { useRadio } from './RadioContext';

const GLYPH = '/assets/founder/hyperion-mark.svg';

/**
 * Persistent mini Hyperion Radio player — fixed bottom-right, stays in view as
 * you scroll, syncs both ways with the full console. Auto-hides when the full
 * Radio section (#fp-radio) is on screen; can be collapsed to a glyph bubble.
 * Always uses STATIC cover art (the large console handles animated art).
 */
export default function MiniPlayer() {
  const { track, playing, progress, toggle, next, prev } = useRadio();
  const [collapsed, setCollapsed] = useState(false);
  const [radioInView, setRadioInView] = useState(false);

  useEffect(() => {
    const el = document.getElementById('fp-radio');
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((es) => setRadioInView(es[0].isIntersecting), { threshold: 0.18 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const gotoRadio = () => {
    const el = document.getElementById('fp-radio');
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 72, behavior: 'smooth' });
  };

  if (!track) return null;

  const miniClass = [
    'fp-mini',
    playing ? 'is-playing' : 'is-paused',
    radioInView ? 'is-hidden' : '',
    collapsed ? 'is-collapsed' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      <div className={miniClass} aria-label="Hyperion Radio — mini player">
        <button className="mp-cover" onClick={gotoRadio} title="Open Hyperion Radio">
          <img src={track.artStatic} alt="" />
          <span className="mp-eq" aria-hidden="true"><i /><i /><i /><i /></span>
        </button>
        <div className="mp-info" onClick={gotoRadio}>
          <div className="mp-title">{track.title}</div>
          <div className="mp-sub"><span className="mp-led" />Hyperion Radio</div>
        </div>
        <div className="mp-ctrls">
          <button className="mp-btn" onClick={prev} aria-label="Previous">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h2v14H6zM20 5v14L9 12z" /></svg>
          </button>
          <button className="mp-btn mp-play" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
            <svg viewBox="0 0 24 24" fill="currentColor"><path d={playing ? 'M6 5h4v14H6zM14 5h4v14h-4z' : 'M8 5v14l11-7z'} /></svg>
          </button>
          <button className="mp-btn" onClick={next} aria-label="Next">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 5h2v14h-2zM4 5l11 7L4 19z" /></svg>
          </button>
        </div>
        <button className="mp-collapse" onClick={() => setCollapsed(true)} aria-label="Hide player" title="Hide">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
        </button>
        <div className="mp-prog"><i style={{ width: `${progress * 100}%` }} /></div>
      </div>

      <button
        className={`fp-reopen${collapsed && !radioInView ? ' show' : ''}`}
        onClick={() => setCollapsed(false)}
        aria-label="Show Hyperion Radio" title="Hyperion Radio"
      >
        <img src={GLYPH} alt="" />
      </button>
    </>
  );
}
