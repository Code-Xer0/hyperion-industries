import { useEffect, useRef } from 'react';

/**
 * GravityLattice — a spacetime grid that bows toward slow-drifting masses.
 * Ported from the Founder Page design's #lattice canvas, but tuned BOLDER:
 * higher line/node/well alpha than the prototype (which the operator found
 * too subtle). Reads its colour from the host's --accent custom property, so
 * it renders red on the operator-red page and navy on the operator-navy page.
 * Fixed, screen-blended, pointer-events:none — the page floats over a living,
 * warping lattice. Mount it INSIDE .founder-page so it inherits --accent.
 */
export default function GravityLattice({ className = 'fp-lattice', intensity = 1 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let W = 0, H = 0, dpr = 1, raf = null, running = false, last = 0;
    let cols = 0, rows = 0, gap = 0, ox = 0, oy = 0;
    let masses = [];
    let grid = [];
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
      gap = Math.max(62, Math.min(96, Math.round(Math.min(W, H) / 12)));
      cols = Math.ceil(W / gap) + 3; rows = Math.ceil(H / gap) + 3;
      ox = (W - (cols - 1) * gap) / 2; oy = (H - (rows - 1) * gap) / 2;
    }

    function initMasses() {
      const n = W < 700 ? 4 : 5;
      masses = [];
      for (let i = 0; i < n; i++) masses.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.24, vy: (Math.random() - 0.5) * 0.24,
        m: 2600 + Math.random() * 2400,
      });
    }

    function step() {
      for (const a of masses) {
        a.x += a.vx; a.y += a.vy;
        if (a.x < -120) a.x = W + 120; if (a.x > W + 120) a.x = -120;
        if (a.y < -120) a.y = H + 120; if (a.y > H + 120) a.y = -120;
      }
    }

    function warp(px, py, out) {
      let dx = 0, dy = 0;
      for (const a of masses) {
        const ax = px - a.x, ay = py - a.y;
        const d2 = ax * ax + ay * ay; const d = Math.sqrt(d2) + 0.001;
        const pull = Math.min(a.m / (d2 + 5200), 34);
        dx -= (ax / d) * pull; dy -= (ay / d) * pull;
      }
      out[0] = px + dx; out[1] = py + dy; out[2] = Math.min(Math.hypot(dx, dy), 40);
    }

    function build() {
      grid = new Array(cols * rows);
      const o = [0, 0, 0];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        warp(ox + c * gap, oy + r * gap, o);
        grid[r * cols + c] = [o[0], o[1], o[2]];
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const R = col[0], G = col[1], B = col[2];
      const k = intensity;
      // gravity wells (soft, low alpha — design-subtle)
      for (const a of masses) {
        const g = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, gap * 2.8);
        g.addColorStop(0, `rgba(${R},${G},${B},${0.10 * k})`);
        g.addColorStop(1, `rgba(${R},${G},${B},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(a.x - gap * 2.8, a.y - gap * 2.8, gap * 5.6, gap * 5.6);
      }
      // lattice lines — alpha rises with warp
      ctx.lineWidth = 0.8;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c, p = grid[i];
          if (c < cols - 1) {
            const q = grid[i + 1]; const a = (0.11 + (p[2] + q[2]) * 0.0105) * k;
            ctx.strokeStyle = `rgba(${R},${G},${B},${a})`;
            ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
          }
          if (r < rows - 1) {
            const q = grid[i + cols]; const a = (0.11 + (p[2] + q[2]) * 0.0105) * k;
            ctx.strokeStyle = `rgba(${R},${G},${B},${a})`;
            ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
          }
        }
      }
      // nodes brighten near wells
      for (let i = 0; i < grid.length; i++) {
        const p = grid[i]; if (p[2] < 2) continue;
        const a = Math.min(0.08 + p[2] * 0.016, 0.6) * k;
        ctx.fillStyle = `rgba(${R},${G},${B},${a})`;
        ctx.beginPath(); ctx.arc(p[0], p[1], 0.9 + p[2] * 0.05, 0, 6.2832); ctx.fill();
      }
    }

    function loop(t) {
      if (!running) return;
      if (t - last > 33) { last = t; step(); build(); draw(); }
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
      if (reduce) { build(); draw(); }   // single static frame, no animation
      else start();
    }

    let rt;
    const onResize = () => {
      clearTimeout(rt);
      rt = setTimeout(() => { resize(); initMasses(); if (reduce) { build(); draw(); } }, 160);
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else if (!reduce) start();
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
