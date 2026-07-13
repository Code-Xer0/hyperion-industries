import { useEffect, useRef } from 'react';

/**
 * GravityWells — slow-drifting pools of accent light. This used to draw a
 * full warped wire-grid ("gravity lattice"); the operator cut the grid and
 * kept the wells, so all that remains is the soft mass glows wandering the
 * viewport. Reads its colour from the host's --accent custom property.
 * Fixed, screen-blended, pointer-events:none. Mount inside .founder-page.
 */
export default function GravityLattice({ className = 'fp-lattice', intensity = 1 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W = 0, H = 0, dpr = 1, raf = null, running = false, last = 0;
    let wellR = 300;
    let masses = [];
    let col = [225, 0, 0];

    function accentRGB() {
      const c = (getComputedStyle(canvas).getPropertyValue('--accent') || '#E10000').trim();
      const hex = c.replace('#', '');
      if (hex.length >= 6) {
        return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
      }
      return [225, 0, 0];
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      wellR = Math.max(200, Math.min(460, Math.min(W, H) * 0.42));
    }

    function initMasses() {
      const n = W < 700 ? 3 : 5;
      masses = [];
      for (let i = 0; i < n; i++) masses.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.22,
        m: 0.75 + Math.random() * 0.5,   // per-well brightness factor
      });
    }

    function step() {
      for (const a of masses) {
        a.x += a.vx; a.y += a.vy;
        if (a.x < -wellR) a.x = W + wellR; if (a.x > W + wellR) a.x = -wellR;
        if (a.y < -wellR) a.y = H + wellR; if (a.y > H + wellR) a.y = -wellR;
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const [R, G, B] = col;
      for (const a of masses) {
        const r = wellR * a.m;
        const g = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, r);
        g.addColorStop(0, `rgba(${R},${G},${B},${(0.14 * a.m * intensity).toFixed(3)})`);
        g.addColorStop(0.55, `rgba(${R},${G},${B},${(0.05 * a.m * intensity).toFixed(3)})`);
        g.addColorStop(1, `rgba(${R},${G},${B},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(a.x - r, a.y - r, r * 2, r * 2);
      }
    }

    function loop(t) {
      if (!running) return;
      if (t - last > 33) { last = t; step(); draw(); }
      raf = requestAnimationFrame(loop);
    }

    function start() {
      if (running) return;
      running = true; last = 0; raf = requestAnimationFrame(loop);
    }
    function stop() {
      running = false; if (raf) cancelAnimationFrame(raf); raf = null;
    }

    function setup() {
      resize(); initMasses(); col = accentRGB();
      start();
    }

    let rt;
    const onResize = () => {
      clearTimeout(rt);
      rt = setTimeout(() => { resize(); initMasses(); }, 160);
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    setup();
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      clearTimeout(rt);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [intensity]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
