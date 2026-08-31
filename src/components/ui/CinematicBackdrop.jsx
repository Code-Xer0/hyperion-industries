import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import './CinematicBackdrop.css';

export default function CinematicBackdrop({ asset, className = '', label = 'Play cinematic' }) {
  const videoRef = useRef(null);
  const [active, setActive] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const stop = () => {
      videoRef.current?.pause();
      setPlaying(false);
    };
    const onVisibility = () => document.hidden && stop();
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    if (!asset.external_poster_id) return undefined;
    document.documentElement.classList.add('home-entry');
    return () => document.documentElement.classList.remove('home-entry');
  }, [asset.external_poster_id]);

  const toggle = async () => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || navigator.connection?.saveData) return;
    if (!active) setActive(true);
    requestAnimationFrame(async () => {
      const video = videoRef.current;
      if (!video) return;
      if (!video.paused) {
        video.pause();
        setPlaying(false);
        return;
      }
      try {
        await video.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
      }
    });
  };

  return (
    <div className={`cinematic-backdrop ${className}`} style={{ '--cinematic-focal-point': asset.focal_point }}>
      {!asset.external_poster_id && <img src={asset.poster} alt="" fetchPriority="high" decoding="async" />}
      {active && (
        <video ref={videoRef} src={asset.video} muted loop playsInline preload="metadata" onPause={() => setPlaying(false)} onPlay={() => setPlaying(true)} />
      )}
      <button type="button" onClick={toggle} aria-label={playing ? 'Pause cinematic' : label}>
        {playing ? <Pause size={14} /> : <Play size={14} />}
        <span>{playing ? 'Pause film' : 'Play film'}</span>
      </button>
    </div>
  );
}
