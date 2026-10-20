import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Pause, Play } from 'lucide-react';
import useCinematicPlayback from './useCinematicPlayback';
import './CinematicBackdrop.css';

export default function CinematicBackdrop({ asset, className = '', label = 'Play cinematic', controlTarget, autoplay = false }) {
  const playback = useCinematicPlayback({ autoplay, source: asset.video });
  const [controlHost, setControlHost] = useState(null);
  useEffect(() => {
    setControlHost(controlTarget ? document.getElementById(controlTarget) : null);
  }, [controlTarget]);
  useEffect(() => {
    if (!asset.external_poster_id) return undefined;
    document.documentElement.classList.add('home-entry');
    return () => document.documentElement.classList.remove('home-entry');
  }, [asset.external_poster_id]);
  const control = playback.allowed && (
    <button className="cinematic-control" type="button" onClick={playback.toggle}
      aria-label={playback.playing ? label.replace(/^Play /, 'Pause ') : label}
      aria-controls={asset.id}>
      {playback.playing ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
      <span>{playback.playing ? 'Pause film' : 'Play film'}</span>
    </button>
  );
  return (
    <div ref={playback.surfaceRef} className={`cinematic-backdrop ${className}`} data-playing={playback.playing} data-presented={playback.presented}
      style={{ '--cinematic-focal-point': asset.focal_point }}>
      <img src={asset.poster} alt="" width={asset.poster_width || asset.width} height={asset.poster_height || asset.height}
        fetchPriority={autoplay ? 'high' : 'auto'} loading={autoplay ? 'eager' : 'lazy'} decoding="async" />
      <video id={asset.id} ref={playback.videoRef} src={playback.loaded ? asset.video : undefined} poster={asset.poster}
        muted loop playsInline preload="none" aria-hidden="true"
        onPlaying={playback.onPlay} onPause={playback.onPause} onError={playback.onError} />
      {controlTarget ? (controlHost && createPortal(control, controlHost)) : control}
    </div>
  );
}
