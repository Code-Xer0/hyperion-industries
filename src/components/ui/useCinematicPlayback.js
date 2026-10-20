import { useEffect, useRef, useState } from 'react';

// Playback belongs to the visible surface. Media stays unloaded until eligible,
// and an explicit pause is never undone by a render or a tab switch.
export default function useCinematicPlayback({ autoplay = false, source } = {}) {
  const videoRef = useRef(null);
  const surfaceRef = useRef(null);
  const [allowed, setAllowed] = useState(false);
  const [visible, setVisible] = useState(false);
  const [foreground, setForeground] = useState(!document.hidden);
  const [wanted, setWanted] = useState(autoplay);
  const [loaded, setLoaded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [presented, setPresented] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection = navigator.connection;
    const preferences = () => setAllowed(!motion.matches && !connection?.saveData);
    const visibility = () => setForeground(!document.hidden);
    const otherPlayback = (event) => {
      if (event.target instanceof HTMLVideoElement && event.target !== videoRef.current) {
        videoRef.current?.pause();
        setWanted(false);
      }
    };
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.1 });
    if (surfaceRef.current) observer.observe(surfaceRef.current);
    preferences();
    motion.addEventListener('change', preferences);
    connection?.addEventListener('change', preferences);
    document.addEventListener('visibilitychange', visibility);
    document.addEventListener('play', otherPlayback, true);
    return () => {
      observer.disconnect();
      motion.removeEventListener('change', preferences);
      connection?.removeEventListener('change', preferences);
      document.removeEventListener('visibilitychange', visibility);
      document.removeEventListener('play', otherPlayback, true);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;
    let cancelled = false;
    if (!(allowed && visible && foreground && wanted)) {
      video.pause();
      return undefined;
    }
    // Keep the poster available for the first paint; setting src happens only
    // after the observer and preference checks, never through preload markup.
    const frame = requestAnimationFrame(() => {
      if (!loaded) { setLoaded(true); return; }
      video.play().catch(() => { if (!cancelled) setWanted(false); });
    });
    return () => { cancelled = true; cancelAnimationFrame(frame); };
  }, [allowed, visible, foreground, wanted, loaded, source]);

  return {
    surfaceRef, videoRef, allowed, loaded, playing, presented,
    // While a slow film is buffering the control still says Play. A click must
    // keep requesting playback, not invert the pending autoplay into a pause.
    toggle: () => setWanted(!playing),
    onPlay: () => { setPlaying(true); setPresented(true); },
    onPause: () => setPlaying(false),
    onError: () => { setPlaying(false); setPresented(false); setWanted(false); },
  };
}
