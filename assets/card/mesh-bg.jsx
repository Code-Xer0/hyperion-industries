// =========================================================
// <MeshBG> — animated lattice of dots + connective lines
// Sits behind everything in each card face. Pure canvas,
// low node-count, GPU-friendly. Respects prefers-reduced-motion.
// =========================================================

function MeshBG({ density = 18, color = "255, 42, 54" }) {
  const canvasRef = React.useRef(null);
  const rafRef = React.useRef(0);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // size from parent
    let w = 0, h = 0;
    const parent = canvas.parentElement;
    const resize = () => {
      const r = parent.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildNodes();
    };

    // node lattice: jittered grid so it reads as 'structured noise'
    let nodes = [];
    const buildNodes = () => {
      nodes = [];
      const cols = Math.max(6, Math.round(w / density));
      const rows = Math.max(10, Math.round(h / density));
      const stepX = w / cols;
      const stepY = h / rows;
      for (let r = 0; r <= rows; r++) {
        for (let c = 0; c <= cols; c++) {
          const jx = (Math.sin(r * 13.7 + c * 5.1) * 0.5) * stepX * 0.35;
          const jy = (Math.cos(r * 7.3 + c * 11.9) * 0.5) * stepY * 0.35;
          nodes.push({
            x0: c * stepX + jx,
            y0: r * stepY + jy,
            // per-node phase + freq for drift + opacity
            px: Math.random() * Math.PI * 2,
            py: Math.random() * Math.PI * 2,
            po: Math.random() * Math.PI * 2,
            // amplitude of drift, small
            ax: 0.6 + Math.random() * 1.2,
            ay: 0.6 + Math.random() * 1.2,
          });
        }
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    // connection threshold a touch bigger than grid step
    const linkDist = density * 1.55;
    const linkDist2 = linkDist * linkDist;

    let start = performance.now();
    const tick = (now) => {
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, w, h);

      // compute current positions
      const pts = nodes.map((n) => {
        const dx = reduced ? 0 : Math.sin(t * 0.45 + n.px) * n.ax;
        const dy = reduced ? 0 : Math.cos(t * 0.38 + n.py) * n.ay;
        const op = 0.18 + (Math.sin(t * 0.7 + n.po) * 0.5 + 0.5) * 0.55;
        return { x: n.x0 + dx, y: n.y0 + dy, op };
      });

      // draw connecting lines
      ctx.lineWidth = 0.55;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j];
          const ddx = a.x - b.x;
          const ddy = a.y - b.y;
          const d2 = ddx * ddx + ddy * ddy;
          if (d2 < linkDist2) {
            const f = 1 - d2 / linkDist2;
            // shared opacity * proximity, modest cap so it stays subtle
            const alpha = f * 0.22 * Math.min(a.op, b.op);
            if (alpha < 0.01) continue;
            ctx.strokeStyle = `rgba(${color}, ${alpha.toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // draw nodes on top — tiny squares feel more lattice/HUD than circles
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const alpha = p.op * 0.75;
        ctx.fillStyle = `rgba(${color}, ${alpha.toFixed(3)})`;
        ctx.fillRect(p.x - 0.75, p.y - 0.75, 1.5, 1.5);
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [density, color]);

  return <canvas ref={canvasRef} className="mesh-bg" aria-hidden="true" />;
}

Object.assign(window, { MeshBG });
