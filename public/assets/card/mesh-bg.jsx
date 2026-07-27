// =========================================================
// <MeshBG> — animated lattice of nodes + connective lines.
// Refined build: jittered grid, a few brighter "hub" nodes,
// proximity-lit links, gentle independent drift. Reads the
// live --accent CSS var so it tints per operator. Sits behind
// the card content, masked so it never fights the portrait.
// Pure canvas; GPU-friendly; honours prefers-reduced-motion.
// =========================================================

function MeshBG({ density = 30, energy = 1 }) {
  const canvasRef = React.useRef(null);
  const rafRef = React.useRef(0);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const parent = canvas.parentElement;

    const readAccent = () => {
      const hex = (getComputedStyle(document.documentElement)
        .getPropertyValue("--accent").trim() || "#ff2a36").replace("#", "");
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `${r}, ${g}, ${b}`;
    };
    let rgb = readAccent();

    let w = 0, h = 0, nodes = [];
    const build = () => {
      nodes = [];
      const cols = Math.max(5, Math.round(w / density));
      const rows = Math.max(9, Math.round(h / density));
      const stepX = w / cols, stepY = h / rows;
      let k = 0;
      for (let r = 0; r <= rows; r++) {
        for (let c = 0; c <= cols; c++) {
          // deterministic jitter → structured, not random noise
          const jx = Math.sin(r * 13.7 + c * 5.1) * stepX * 0.33;
          const jy = Math.cos(r * 7.3 + c * 11.9) * stepY * 0.33;
          // ~1 in 9 nodes is a brighter "hub"
          const hub = (k++ % 9) === 0;
          nodes.push({
            x0: c * stepX + jx, y0: r * stepY + jy,
            px: Math.random() * 6.28, py: Math.random() * 6.28, po: Math.random() * 6.28,
            ax: 0.5 + Math.random() * 1.1, ay: 0.5 + Math.random() * 1.1,
            hub,
          });
        }
      }
    };

    const resize = () => {
      const rc = parent.getBoundingClientRect();
      w = rc.width; h = rc.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rgb = readAccent();
      build();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const linkDist = density * 1.6, linkDist2 = linkDist * linkDist;
    const start = performance.now();
    let pulses = [], nextPulse = 1.2;

    const tick = (now) => {
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, w, h);

      const pts = nodes.map((n) => {
        const dx = reduced ? 0 : Math.sin(t * 0.38 * energy + n.px) * n.ax;
        const dy = reduced ? 0 : Math.cos(t * 0.32 * energy + n.py) * n.ay;
        const op = 0.16 + (Math.sin(t * 0.6 * energy + n.po) * 0.5 + 0.5) * 0.5;
        return { x: n.x0 + dx, y: n.y0 + dy, op, hub: n.hub };
      });

      // links — brighter when either endpoint is a hub
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j];
          const ddx = a.x - b.x, ddy = a.y - b.y;
          const d2 = ddx * ddx + ddy * ddy;
          if (d2 >= linkDist2) continue;
          const f = 1 - d2 / linkDist2;
          const boost = (a.hub || b.hub) ? 1.7 : 1;
          const alpha = f * 0.2 * Math.min(a.op, b.op) * boost;
          if (alpha < 0.012) continue;
          ctx.strokeStyle = `rgba(${rgb}, ${alpha.toFixed(3)})`;
          ctx.lineWidth = (a.hub || b.hub) ? 0.7 : 0.5;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // nodes — hubs are a touch larger + brighter, with a soft halo
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        if (p.hub) {
          ctx.fillStyle = `rgba(${rgb}, ${(p.op * 0.22).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3.4, 0, 6.2832);
          ctx.fill();
          ctx.fillStyle = `rgba(${rgb}, ${Math.min(1, p.op * 1.1).toFixed(3)})`;
          ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
        } else {
          ctx.fillStyle = `rgba(${rgb}, ${(p.op * 0.7).toFixed(3)})`;
          ctx.fillRect(p.x - 0.6, p.y - 0.6, 1.2, 1.2);
        }
      }

      // signal pulses — a hub fires, a ring propagates and dies
      if (!reduced && t > nextPulse) {
        const hubs = pts.filter((p) => p.hub);
        const src = hubs[(Math.random() * hubs.length) | 0];
        if (src) pulses.push({ x: src.x, y: src.y, t0: t });
        nextPulse = t + (1.4 + Math.random() * 2.6) / energy;
      }
      pulses = pulses.filter((p) => t - p.t0 < 1.5);
      for (const p of pulses) {
        const age = (t - p.t0) / 1.5;
        ctx.strokeStyle = `rgba(${rgb}, ${((1 - age) * 0.38).toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5 + age * 52, 0, 6.2832);
        ctx.stroke();
        ctx.fillStyle = `rgba(${rgb}, ${((1 - age) * 0.9).toFixed(3)})`;
        ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    // re-read accent when a tweak changes it live
    const onTweak = () => { rgb = readAccent(); };
    window.addEventListener("tweakchange", onTweak);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      window.removeEventListener("tweakchange", onTweak);
    };
  }, [density, energy]);

  return <canvas ref={canvasRef} className="mesh-bg" aria-hidden="true" />;
}

Object.assign(window, { MeshBG });
