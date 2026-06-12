/* ── Pointer-aware card FX (founder surface) ────────────────────────────────
 * One delegated, rAF-throttled pointer handler for the whole page; a single
 * shared highlight node is moved into whichever card is under the cursor, so
 * there are no per-card listeners and no layout thrash. Sets --mx/--my (%) on
 * the highlight and a subtle perspective tilt on the card via `transform` —
 * which composes with the design's idle float (`translate` property) and
 * hover depress (`scale` property) without fighting either.
 *
 * Desktop-only by design: gated on (hover:hover) and (pointer:fine).
 * Tilt is disabled under prefers-reduced-motion; the cursor highlight remains
 * (it is input-driven, not continuous animation).
 */

const CARD_SEL = [
  '.sx-card', '.syscard', '.agent', '.post',
  '.ns-item', '.contact-card', '.radio-shell', '.portrait-land',
].join(',');

// large surfaces feel wrong rotating — highlight only
const NO_TILT_SEL = '.radio-shell, .contact-card, .portrait-land';

const MAX_TILT = 2.4; // degrees

export function initPointerFx(root) {
  if (!root) return () => {};
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (!fine.matches) return () => {};
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const glow = document.createElement('div');
  glow.className = 'fp-cursor-glow';
  glow.setAttribute('aria-hidden', 'true');

  let card = null;
  let raf = 0;
  let ev = null;

  const apply = () => {
    raf = 0;
    if (!card || !ev) return;
    const r = card.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const px = (ev.clientX - r.left) / r.width;   // 0..1
    const py = (ev.clientY - r.top) / r.height;
    glow.style.setProperty('--mx', `${(px * 100).toFixed(2)}%`);
    glow.style.setProperty('--my', `${(py * 100).toFixed(2)}%`);
    if (!reduce && !card.matches(NO_TILT_SEL)) {
      const rx = ((0.5 - py) * MAX_TILT).toFixed(3);
      const ry = ((px - 0.5) * MAX_TILT).toFixed(3);
      card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    }
  };

  const enter = (target) => {
    if (card === target) return;
    leave();
    card = target;
    card.classList.add('fp-lit');
    card.appendChild(glow);
  };

  const leave = () => {
    if (!card) return;
    card.classList.remove('fp-lit');
    card.style.transform = '';
    if (glow.parentNode === card) card.removeChild(glow);
    card = null;
  };

  const onMove = (e) => {
    const t = e.target instanceof Element ? e.target.closest(CARD_SEL) : null;
    if (t && root.contains(t)) enter(t);
    else leave();
    ev = e;
    if (!raf) raf = requestAnimationFrame(apply);
  };

  const onLeave = () => leave();

  root.addEventListener('pointermove', onMove, { passive: true });
  root.addEventListener('pointerleave', onLeave, { passive: true });

  return () => {
    root.removeEventListener('pointermove', onMove);
    root.removeEventListener('pointerleave', onLeave);
    if (raf) cancelAnimationFrame(raf);
    leave();
    glow.remove();
  };
}
