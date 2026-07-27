// =========================================================
// <SignalField> — ambient particle lattice behind the card.
//
// Mirrors the founder-page <SingularityBackground> so the card
// and /founders/* read as one system: same particle density,
// drift speed, link distance and falloff, same pointer pull.
// The only difference is the colour source — this reads the live
// --accent CSS var instead of taking a prop, so the field
// re-skins with the operator.
//
// Performance (matched to the founder page):
//  - 30fps throttle, not uncapped rAF
//  - device pixel ratio capped at 1.5
//  - particle count scales with viewport area, capped 90 (45 mobile)
//  - pauses on document hidden via Page Visibility API
//  - single static paint when motion=off or prefers-reduced-motion
// =========================================================

const { useRef: useRefSF, useEffect: useEffectSF } = React;

// Founder-page constants — keep in sync with
// src/components/ui/SingularityBackground.jsx.
const SF_LINK_DIST = 118;
const SF_LINK_ALPHA = 0.16;
const SF_DOT_ALPHA = 0.36;
const SF_POINTER_RADIUS = 190;
const SF_POINTER_FORCE = 0.012;
const SF_POINTER_GLOW = 0.055;

function SignalField({ enabled = true }) {
  const canvasRef = useRefSF(null);

  useEffectSF(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)");
    const animate = enabled && !reduce;

    let raf = 0;
    let prevFrame = 0;
    let w = 0, h = 0;
    let particles = [];
    const pointer = { x: -9999, y: -9999, active: false };

    const readAccent = () => {
      const hex = (getComputedStyle(document.documentElement)
        .getPropertyValue("--accent").trim() || "#ff2a36").replace("#", "");
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `${r}, ${g}, ${b}`;
    };
    let rgb = readAccent();

    const initParticles = () => {
      const mobile = Math.min(w, h) < 720;
      const cap = mobile ? 45 : 90;
      const areaCount = Math.floor((w * h) / 18000);
      const count = Math.max(18, Math.min(cap, areaCount));

      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.68,
        vy: (Math.random() - 0.5) * 0.68,
        radius: (Math.random() * 1.35) + 0.45,
      }));
    };

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      const pr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(w * pr);
      canvas.height = Math.round(h * pr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(pr, 0, 0, pr, 0, 0);
      rgb = readAccent();
      initParticles();
    };

    const shouldInteract = () => !coarse.matches && animate;

    const draw = (advance) => {
      ctx.clearRect(0, 0, w, h);
      const live = shouldInteract() && pointer.active;

      // soft halo under the cursor
      if (live) {
        const grad = ctx.createRadialGradient(
          pointer.x, pointer.y, 0, pointer.x, pointer.y, SF_POINTER_RADIUS
        );
        grad.addColorStop(0, `rgba(${rgb}, ${SF_POINTER_GLOW})`);
        grad.addColorStop(1, `rgba(${rgb}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, SF_POINTER_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }

      // nodes — drift, bounce off the edges, pull gently toward the cursor
      ctx.fillStyle = `rgba(${rgb}, ${SF_DOT_ALPHA})`;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (advance) {
          if (live) {
            const dx = pointer.x - p.x;
            const dy = pointer.y - p.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 0 && dist < SF_POINTER_RADIUS) {
              const force = (SF_POINTER_RADIUS - dist) / SF_POINTER_RADIUS;
              p.x += dx * force * SF_POINTER_FORCE;
              p.y += dy * force * SF_POINTER_FORCE;
            }
          }
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > w) p.vx *= -1;
          if (p.y < 0 || p.y > h) p.vy *= -1;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // links — only between near neighbours, fading with distance
      ctx.lineWidth = 1;
      for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) {
          const dx = particles[a].x - particles[b].x;
          if (dx > SF_LINK_DIST || dx < -SF_LINK_DIST) continue; // cheap early-out
          const dy = particles[a].y - particles[b].y;
          if (dy > SF_LINK_DIST || dy < -SF_LINK_DIST) continue;
          const dist = Math.hypot(dx, dy);
          if (dist >= SF_LINK_DIST) continue;
          const alpha = (1 - (dist / SF_LINK_DIST)) * SF_LINK_ALPHA;
          ctx.strokeStyle = `rgba(${rgb}, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(particles[a].x, particles[a].y);
          ctx.lineTo(particles[b].x, particles[b].y);
          ctx.stroke();
        }
      }
    };

    // 30fps throttle — matches the founder page and halves the paint cost
    const tick = (ts) => {
      if (document.hidden) return;
      if (ts - prevFrame >= 1000 / 30) {
        prevFrame = ts;
        draw(true);
      }
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      cancelAnimationFrame(raf);
      if (!animate || document.hidden) { draw(false); return; }
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e) => {
      if (!shouldInteract()) return;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    };
    const onLeave = () => { pointer.active = false; };
    const onResize = () => { resize(); if (!animate) draw(false); };
    const onTweak = () => { rgb = readAccent(); if (!animate) draw(false); };

    resize();
    start();

    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", start);
    coarse.addEventListener("change", onLeave);
    window.addEventListener("tweakchange", onTweak);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", start);
      coarse.removeEventListener("change", onLeave);
      window.removeEventListener("tweakchange", onTweak);
    };
  }, [enabled]);

  return <canvas ref={canvasRef} className="signal-field" aria-hidden="true" />;
}

Object.assign(window, { SignalField });
