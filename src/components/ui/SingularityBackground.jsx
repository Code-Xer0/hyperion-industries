import { useEffect, useRef } from 'react';

const DEFAULT_PRIMARY = '255, 199, 44';

const parseRgb = (value) => {
  const channels = String(value ?? DEFAULT_PRIMARY)
    .split(',')
    .map((channel) => Number.parseFloat(channel.trim()));

  return channels.length === 3 && channels.every(Number.isFinite)
    ? channels.map((channel) => Math.max(0, Math.min(255, channel)))
    : [255, 199, 44];
};

const mixChannels = (first, second, amount) => first.map(
  (channel, index) => Math.round(channel + ((second[index] - channel) * amount)),
);

const rgbString = (channels) => channels.map(Math.round).join(', ');

/**
 * Site-wide ambient particle lattice. Route palette changes interpolate inside
 * one loop; founder dossiers can still mount their own color-compatible copy.
 */
export default function SingularityBackground({
  color = DEFAULT_PRIMARY,
  secondaryColor = color,
  intensity = 1,
  density = 1,
  speed = 1,
  interactive = true,
  id = 'singularity',
  dataAmbient,
  style,
}) {
  const canvasRef = useRef(null);
  const redrawRef = useRef(null);
  const targetRef = useRef({
    primary: parseRgb(color),
    secondary: parseRgb(secondaryColor),
    intensity,
    density,
    speed,
    interactive,
  });

  targetRef.current = {
    primary: parseRgb(color),
    secondary: parseRgb(secondaryColor),
    intensity: Math.max(0, intensity),
    density: Math.max(0.2, density),
    speed: Math.max(0, speed),
    interactive,
  };

  useEffect(() => {
    redrawRef.current?.();
  }, [color, secondaryColor, intensity, density, speed, interactive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const context = canvas.getContext('2d');
    if (!context) return undefined;

    const coarsePointer = window.matchMedia('(pointer: coarse)');
    const current = {
      primary: [...targetRef.current.primary],
      secondary: [...targetRef.current.secondary],
      intensity: targetRef.current.intensity,
    };
    const pointer = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      radius: 190,
      active: false,
    };

    let width = window.innerWidth;
    let height = window.innerHeight;
    let particles = [];
    let animationFrameId = 0;
    let previousFrame = 0;

    const shouldInteract = () => !coarsePointer.matches
      && targetRef.current.interactive;

    const initParticles = () => {
      const mobile = Math.min(width, height) < 720;
      const cap = mobile ? 45 : 90;
      const areaCount = Math.floor((width * height) / 18000);
      const count = Math.max(18, Math.min(cap, Math.round(areaCount * targetRef.current.density)));

      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.68,
        vy: (Math.random() - 0.5) * 0.68,
        radius: (Math.random() * 1.35) + 0.45,
        tone: Math.random(),
      }));
    };

    const sizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      pointer.x = width / 2;
      pointer.y = height / 2;
      initParticles();
    };

    const easePalette = (snap = false) => {
      const amount = snap ? 1 : 0.055;
      ['primary', 'secondary'].forEach((key) => {
        current[key] = current[key].map(
          (channel, index) => channel + ((targetRef.current[key][index] - channel) * amount),
        );
      });
      current.intensity += (targetRef.current.intensity - current.intensity) * amount;
    };

    const draw = ({ advance = true, snap = false } = {}) => {
      easePalette(snap);
      context.clearRect(0, 0, width, height);

      const primary = rgbString(current.primary);
      const interactivePointer = shouldInteract() && pointer.active;

      if (interactivePointer) {
        const gradient = context.createRadialGradient(
          pointer.x,
          pointer.y,
          0,
          pointer.x,
          pointer.y,
          pointer.radius,
        );
        gradient.addColorStop(0, `rgba(${primary}, ${0.055 * current.intensity})`);
        gradient.addColorStop(1, `rgba(${primary}, 0)`);
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(pointer.x, pointer.y, pointer.radius, 0, Math.PI * 2);
        context.fill();
      }

      particles.forEach((particle) => {
        if (advance) {
          if (interactivePointer) {
            const dx = pointer.x - particle.x;
            const dy = pointer.y - particle.y;
            const distance = Math.hypot(dx, dy);
            if (distance > 0 && distance < pointer.radius) {
              const force = (pointer.radius - distance) / pointer.radius;
              particle.x += dx * force * 0.012;
              particle.y += dy * force * 0.012;
            }
          }

          particle.x += particle.vx * targetRef.current.speed;
          particle.y += particle.vy * targetRef.current.speed;
          if (particle.x < 0 || particle.x > width) particle.vx *= -1;
          if (particle.y < 0 || particle.y > height) particle.vy *= -1;
        }

        const particleColor = mixChannels(current.primary, current.secondary, particle.tone);
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(${rgbString(particleColor)}, ${0.36 * current.intensity})`;
        context.fill();
      });

      for (let first = 0; first < particles.length; first += 1) {
        for (let second = first + 1; second < particles.length; second += 1) {
          const distance = Math.hypot(
            particles[first].x - particles[second].x,
            particles[first].y - particles[second].y,
          );
          if (distance >= 118) continue;

          const opacity = (1 - (distance / 118)) * 0.16 * current.intensity;
          context.beginPath();
          context.moveTo(particles[first].x, particles[first].y);
          context.lineTo(particles[second].x, particles[second].y);
          context.strokeStyle = `rgba(${primary}, ${opacity})`;
          context.lineWidth = 1;
          context.stroke();
        }
      }
    };

    const animate = (timestamp) => {
      if (document.hidden) return;

      if (timestamp - previousFrame >= 1000 / 30) {
        previousFrame = timestamp;
        draw();
      }
      animationFrameId = window.requestAnimationFrame(animate);
    };

    const start = () => {
      window.cancelAnimationFrame(animationFrameId);
      if (document.hidden) {
        draw({ advance: false, snap: true });
        return;
      }
      animationFrameId = window.requestAnimationFrame(animate);
    };

    const handlePointerMove = (event) => {
      if (!shouldInteract()) return;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    };
    const handlePointerLeave = () => { pointer.active = false; };
    const handleVisibility = () => start();
    const handleResize = () => {
      sizeCanvas();
      if (document.hidden) draw({ advance: false, snap: true });
    };

    redrawRef.current = () => {
      if (document.hidden) draw({ advance: false, snap: true });
    };

    sizeCanvas();
    start();

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave);
    document.addEventListener('visibilitychange', handleVisibility);
    coarsePointer.addEventListener('change', handlePointerLeave);

    return () => {
      redrawRef.current = null;
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
      document.removeEventListener('visibilitychange', handleVisibility);
      coarsePointer.removeEventListener('change', handlePointerLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id={id}
      data-ambient={dataAmbient}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        ...style,
      }}
    />
  );
}
