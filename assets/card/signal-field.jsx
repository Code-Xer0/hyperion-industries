// =========================================================
// <SignalField> — ambient particle mesh behind the card.
//
// Low-opacity nodes drifting on long, slow velocities. Lines
// drawn between neighbours under a distance threshold. Cursor
// applies a soft gravitational pull within ~140px.
//
// Performance:
//  - DPR-aware canvas
//  - Node count scales with viewport area (capped)
//  - Pauses on document hidden via Page Visibility API
//  - Skipped entirely on prefers-reduced-motion (or when off)
//  - Falls back to a single repaint (static mesh) when motion=off
// =========================================================

const { useRef: useRefSF, useEffect: useEffectSF } = React;

function SignalField({ enabled = true }) {
  const canvasRef = useRefSF(null);

  useEffectSF(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animate = enabled && !reduce;

    let raf = null;
    let mouseX = -9999, mouseY = -9999;
    let nodes = [];
    let w = 0, h = 0;
    let dpr = 1;

    const hexToRgb = (hex) => {
      const h2 = (hex || "#ff2a36").replace("#", "");
      const r = parseInt(h2.slice(0, 2), 16);
      const g = parseInt(h2.slice(2, 4), 16);
      const b = parseInt(h2.slice(4, 6), 16);
      return `${r}, ${g}, ${b}`;
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // density: ~1 node per 14k px² desktop, capped at 110.
      // Mobile gets fewer naturally because area is smaller.
      const target = Math.max(28, Math.min(110, Math.round((w * h) / 14000)));
      nodes = new Array(target).fill(0).map(() => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        // small per-node drift seed so they don't lockstep
        phase: Math.random() * Math.PI * 2,
      }));
    };

    const onMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    const onLeave = () => { mouseX = -9999; mouseY = -9999; };

    const draw = (t) => {
      const rgb = hexToRgb(
        getComputedStyle(document.documentElement)
          .getPropertyValue("--accent").trim() || "#ff2a36"
      );

      ctx.clearRect(0, 0, w, h);

      // 1) update + draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];

        // cursor gravity (soft, capped)
        const dxC = mouseX - n.x;
        const dyC = mouseY - n.y;
        const d2C = dxC * dxC + dyC * dyC;
        if (d2C < 19600) { // 140²
          const dC = Math.sqrt(d2C) || 1;
          const f = (140 - dC) / 140 * 0.05;
          n.vx += (dxC / dC) * f;
          n.vy += (dyC / dC) * f;
        }

        // friction
        n.vx *= 0.94;
        n.vy *= 0.94;

        // gentle idle wobble — so even with no cursor the field moves
        n.x += n.vx + Math.cos((t * 0.00009) + n.phase) * 0.04;
        n.y += n.vy + Math.sin((t * 0.00011) + n.phase) * 0.04;

        // wrap edges (no bounce — feels more like a continuous field)
        if (n.x < -10) n.x = w + 10;
        if (n.x > w + 10) n.x = -10;
        if (n.y < -10) n.y = h + 10;
        if (n.y > h + 10) n.y = -10;

        // draw — single 1px dot
        ctx.fillStyle = `rgba(${rgb}, 0.42)`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 0.9, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2) connecting lines — only between near neighbours
      ctx.lineWidth = 0.5;
      const T = 118;
      const T2 = T * T;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          if (dx > T || dx < -T) continue; // cheap early-out
          const dy = a.y - b.y;
          if (dy > T || dy < -T) continue;
          const d2 = dx * dx + dy * dy;
          if (d2 < T2) {
            const d = Math.sqrt(d2);
            const alpha = (1 - d / T) * 0.16;
            ctx.strokeStyle = `rgba(${rgb}, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // 3) cursor ripple — faint halo where the user is
      if (mouseX > -1000) {
        const grad = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 160);
        grad.addColorStop(0, `rgba(${rgb}, 0.10)`);
        grad.addColorStop(1, `rgba(${rgb}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, 160, 0, Math.PI * 2);
        ctx.fill();
      }

      if (animate) raf = requestAnimationFrame(draw);
    };

    const onVis = () => {
      if (document.hidden) {
        if (raf) { cancelAnimationFrame(raf); raf = null; }
      } else if (animate && raf == null) {
        raf = requestAnimationFrame(draw);
      }
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVis);

    if (animate) raf = requestAnimationFrame(draw);
    else draw(0); // static single render so the field still reads

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [enabled]);

  return <canvas ref={canvasRef} className="signal-field" aria-hidden="true" />;
}

Object.assign(window, { SignalField });
