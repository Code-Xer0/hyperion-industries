import { useEffect, useRef } from 'react';

export default function HeroCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let W, H;
    let stars = [];
    let animationFrameId;

    const getPalette = () => {
      const isLight = document.body.classList.contains('theme-light');
      return isLight
        ? {
            grid: 'rgba(130,108,61,0.18)',
            star: 'rgba(48,42,27,',
            accent: 'rgba(201,149,24,',
            link: 'rgba(160,120,31,',
            linkScale: 0.28,
          }
        : {
            grid: 'rgba(42,45,49,0.5)',
            star: 'rgba(245,245,242,',
            accent: 'rgba(255,199,44,',
            link: 'rgba(42,45,49,',
            linkScale: 0.6,
          };
    };

    const resize = () => {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    };

    const init = () => {
      stars = [];
      const n = Math.floor((W * H) / 4200);
      for (let i = 0; i < n; i++) {
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: Math.random() * 1.1 + 0.15,
          o: Math.random() * 0.35 + 0.04,
          p: Math.random() * Math.PI * 2,
          sp: (Math.random() - 0.5) * 0.006,
          accent: Math.random() > 0.84,
        });
      }
    };

    const draw = () => {
      const palette = getPalette();
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = palette.grid;
      ctx.lineWidth = 0.5;

      for (let x = 0; x < W; x += 80) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }

      for (let y = 0; y < H; y += 80) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      for (const s of stars) {
        s.p += s.sp;
        const opacity = Math.max(0, s.o + Math.sin(s.p) * 0.05);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `${s.accent ? palette.accent : palette.star}${opacity})`;
        ctx.fill();
      }

      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const dx = stars[i].x - stars[j].x;
          const dy = stars[i].y - stars[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 80) {
            ctx.beginPath();
            ctx.strokeStyle = `${palette.link}${(1 - d / 80) * palette.linkScale})`;
            ctx.lineWidth = 0.4;
            ctx.moveTo(stars[i].x, stars[i].y);
            ctx.lineTo(stars[j].x, stars[j].y);
            ctx.stroke();
          }
        }
      }
      animationFrameId = requestAnimationFrame(draw);
    };

    const handleResize = () => {
      resize();
      init();
    };

    window.addEventListener('resize', handleResize);

    resize();
    init();
    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="hero-canvas"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
