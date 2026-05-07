(function initGravityParticles() {
  const canvas = document.getElementById("gravity-particles");
  if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const ctx = canvas.getContext("2d", { alpha: true });
  const pointer = { x: -9999, y: -9999, active: false };
  const particles = [];
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  let width = 0;
  let height = 0;
  let hidden = document.hidden;
  let raf = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = coarse ? Math.min(30, Math.floor(width * height / 38000)) : Math.min(78, Math.max(38, Math.floor(width * height / 23000)));
    particles.length = 0;
    for (let i = 0; i < count; i += 1) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      particles.push({
        x,
        y,
        ox: x,
        oy: y,
        vx: (Math.random() - 0.5) * 0.16,
        vy: (Math.random() - 0.5) * 0.16,
        r: Math.random() * 1.1 + 0.35,
        tone: Math.random()
      });
    }
  }

  function tick() {
    if (!hidden) {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        const dx = pointer.x - p.x;
        const dy = pointer.y - p.y;
        const distSq = dx * dx + dy * dy;
        const radius = coarse ? 0 : 185;
        if (pointer.active && distSq < radius * radius) {
          const dist = Math.sqrt(distSq) || 1;
          const force = (1 - dist / radius) * 0.016;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
        p.vx += (p.ox - p.x) * 0.0009;
        p.vy += (p.oy - p.y) * 0.0009;
        p.vx *= 0.966;
        p.vy *= 0.966;
        p.x += p.vx;
        p.y += p.vy;
        ctx.beginPath();
        ctx.fillStyle = p.tone > 0.7 ? "rgba(33,214,232,0.2)" : "rgba(255,255,255,0.14)";
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    raf = requestAnimationFrame(tick);
  }

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("pointermove", (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = !coarse;
  }, { passive: true });
  window.addEventListener("pointerleave", () => { pointer.active = false; }, { passive: true });
  document.addEventListener("visibilitychange", () => { hidden = document.hidden; });
  resize();
  raf = requestAnimationFrame(tick);
  window.addEventListener("beforeunload", () => cancelAnimationFrame(raf), { once: true });
})();
