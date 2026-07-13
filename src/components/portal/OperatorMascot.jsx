import { useEffect, useState } from 'react';
import './OperatorMascot.css';

const frames = [0, 1, 2, 3].map(
  (frame) => `/assets/city/operator/operator-wave-${String(frame).padStart(4, '0')}.webp`,
);

export default function OperatorMascot() {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    let interval;

    const stop = () => {
      window.clearInterval(interval);
      interval = undefined;
    };
    const start = () => {
      stop();
      if (document.hidden) return;
      interval = window.setInterval(() => {
        setFrame((current) => (current + 1) % frames.length);
      }, 180);
    };
    const onVisibility = () => start();

    start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <div className="operator-mascot" aria-label="Hyperion Operator mascot waving">
      <img src={frames[frame]} alt="Hyperion Operator mascot waving" draggable="false" />
    </div>
  );
}
