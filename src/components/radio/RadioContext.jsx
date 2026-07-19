import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { track as logEvent } from '../../utils/telemetry';

/**
 * RadioContext — one audio engine shared by the full console + the mini player.
 * Ported from the Founder Page design's player: a real <audio> element is used
 * when a track has an `audio` src; otherwise a simulated playhead runs so the
 * whole UI is reviewable in preview ("demo mode"). Position/volume persist in
 * localStorage. Bind real audio later by setting each track's `audio` field.
 */
const RadioContext = createContext(null);
export function useRadio() { return useContext(RadioContext); }

const LS_KEY = 'hyperion_radio';
const SIM_MS = 200;

function canWarmAudio() {
  const connection = typeof navigator === 'undefined' ? null : navigator.connection;
  return !connection?.saveData && !/(^|-)2g/.test(connection?.effectiveType || '');
}

export function RadioProvider({ tracks, children }) {
  const list = useMemo(() => (tracks?.length ? tracks : []), [tracks]);

  const audioRef = useRef(null);
  if (audioRef.current === null && typeof Audio !== 'undefined') {
    const a = new Audio();
    a.preload = 'auto';
    audioRef.current = a;
  }

  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [vol, setVol] = useState(0.8);
  const [curTime, setCurTime] = useState(0);
  const [dur, setDur] = useState(list[0]?.duration || 0);

  // refs mirror state so the sim interval + audio events read fresh values
  const idxRef = useRef(0);
  const playingRef = useRef(false);
  const shuffleRef = useRef(false);
  const repeatRef = useRef(false);
  const simRef = useRef(0);
  const timerRef = useRef(null);
  idxRef.current = idx;
  playingRef.current = playing;
  shuffleRef.current = shuffle;
  repeatRef.current = repeat;

  const telOf = useCallback((i) => { const t = list[i]; return t ? { t: t.id, title: t.title } : {}; }, [list]);

  const hasReal = useCallback((i) => !!list[i]?.audio, [list]);

  const stopSim = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const persist = useCallback(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        idx: idxRef.current, time: simRef.current, vol: audioRef.current?.volume ?? 0.8,
      }));
    } catch { /* ignore */ }
  }, []);

  // hydrate persisted position/volume once
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
      if (typeof s.idx === 'number' && s.idx >= 0 && s.idx < list.length) { setIdx(s.idx); idxRef.current = s.idx; }
      if (typeof s.time === 'number') { simRef.current = s.time; setCurTime(s.time); }
      if (typeof s.vol === 'number') { setVol(s.vol); }
      setDur(list[idxRef.current]?.duration || 0);
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // apply volume to the audio element
  useEffect(() => { if (audioRef.current) audioRef.current.volume = vol; }, [vol]);

  const onEnded = useCallback(() => {
    stopSim();
    logEvent('complete', telOf(idxRef.current));
    if (repeatRef.current) { loadTrack(idxRef.current, true); return; }
    const nextIdx = shuffleRef.current ? Math.floor(Math.random() * list.length) : idxRef.current + 1;
    loadTrack(nextIdx, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.length, stopSim, telOf]);

  const startSim = useCallback(() => {
    stopSim();
    timerRef.current = setInterval(() => {
      if (!playingRef.current || hasReal(idxRef.current)) return;
      simRef.current += SIM_MS / 1000;
      const d = list[idxRef.current]?.duration || 0;
      if (d && simRef.current >= d) { onEnded(); return; }
      setCurTime(simRef.current);
    }, SIM_MS);
  }, [hasReal, list, onEnded, stopSim]);

  // Bind the current track's file to the audio element if it isn't already.
  // loadTrack only runs on skip/select — without this, the FIRST Play after a
  // fresh page load hits an element with no src and silently no-ops (the
  // "songs only play after skipping forward and back" bug).
  const ensureSrc = useCallback(() => {
    const a = audioRef.current;
    if (!a || !hasReal(idxRef.current)) return;
    const want = list[idxRef.current].audio;
    if (!(a.src || '').endsWith(want)) {
      a.src = want; a.load();
      if (simRef.current > 0) { try { a.currentTime = simRef.current; } catch { /* applied on loadedmetadata */ } }
    }
  }, [list, hasReal]);

  const intentWarmRef = useRef(null);
  const warmTrack = useCallback((i) => {
    const nextTrack = list[i];
    if (!nextTrack?.audio || !canWarmAudio()) return;

    let warmer = intentWarmRef.current;
    if (!warmer && typeof Audio !== 'undefined') {
      warmer = new Audio();
      warmer.preload = 'auto';
      warmer.muted = true;
      intentWarmRef.current = warmer;
    }
    if (warmer && !(warmer.src || '').endsWith(nextTrack.audio)) {
      warmer.src = nextTrack.audio;
      warmer.load();
    }
  }, [list]);

  // Warm the CURRENT track as soon as the surface mounts (preload=auto starts
  // buffering immediately), so the first Play is near-instant instead of
  // waiting on a cold fetch.
  useEffect(() => { ensureSrc(); }, [ensureSrc]);

  const startPlayback = useCallback(() => {
    setPlaying(true); playingRef.current = true;
    logEvent('play', telOf(idxRef.current));
    if (hasReal(idxRef.current)) { ensureSrc(); audioRef.current?.play().catch(() => {}); }
    else { startSim(); }
    persist();
  }, [hasReal, ensureSrc, startSim, persist, telOf]);

  const pause = useCallback(() => {
    setPlaying(false); playingRef.current = false;
    stopSim();
    if (hasReal(idxRef.current)) audioRef.current?.pause();
    persist();
  }, [hasReal, stopSim, persist]);

  const loadTrack = useCallback((i, autoplay) => {
    if (!list.length) return;
    const n = ((i % list.length) + list.length) % list.length;
    setIdx(n); idxRef.current = n;
    simRef.current = 0; setCurTime(0);
    stopSim();
    const a = audioRef.current;
    if (hasReal(n) && a) { a.src = list[n].audio; a.load(); }
    setDur(list[n]?.duration || 0);
    if (autoplay) startPlayback();
    else { setPlaying(false); playingRef.current = false; }
    persist();
  }, [list, hasReal, startPlayback, stopSim, persist]);

  const startRoadHome = useCallback(() => {
    const roadHomeIdx = list.findIndex((item) => item.id === 'road-home');
    const a = audioRef.current;
    if (roadHomeIdx < 0 || !a || !hasReal(roadHomeIdx)) return;

    setIdx(roadHomeIdx); idxRef.current = roadHomeIdx;
    simRef.current = 0; setCurTime(0);
    stopSim();
    a.pause();
    if (!(a.src || '').endsWith(list[roadHomeIdx].audio)) {
      a.src = list[roadHomeIdx].audio;
      a.load();
    }
    a.currentTime = 0;
    a.volume = 0;
    setDur(list[roadHomeIdx].duration || 0);
    setPlaying(true); playingRef.current = true;
    logEvent('play', { t: list[roadHomeIdx].id, title: list[roadHomeIdx].title });
    a.play().then(() => {
      const targetVolume = vol;
      const startedAt = performance.now();
      const fadeIn = (now) => {
        const progress = Math.min(1, (now - startedAt) / 1100);
        a.volume = targetVolume * progress;
        if (progress < 1) requestAnimationFrame(fadeIn);
      };
      requestAnimationFrame(fadeIn);
      persist();
    }).catch(() => {
      setPlaying(false); playingRef.current = false;
      a.volume = vol;
    });
  }, [hasReal, list, persist, stopSim, vol]);

  // Request a crossfade only after both the Nav and the radio provider have
  // mounted. The global score decides whether it is active, then calls the
  // supplied handoff function synchronously.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('hyperion:radio-arrival', { detail: { startRoadHome } }));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [startRoadHome]);

  const toggle = useCallback(() => { (playingRef.current ? pause : startPlayback)(); }, [pause, startPlayback]);
  const next = useCallback(() => { logEvent('skip', telOf(idxRef.current)); loadTrack(shuffleRef.current ? Math.floor(Math.random() * list.length) : idxRef.current + 1, true); }, [loadTrack, list.length, telOf]);
  const prev = useCallback(() => {
    if (simRef.current > 3 || (hasReal(idxRef.current) && (audioRef.current?.currentTime || 0) > 3)) {
      simRef.current = 0; setCurTime(0);
      if (hasReal(idxRef.current) && audioRef.current) audioRef.current.currentTime = 0;
      return;
    }
    loadTrack(idxRef.current - 1, playingRef.current);
  }, [hasReal, loadTrack]);
  const select = useCallback((i) => loadTrack(i, true), [loadTrack]);

  const seekTo = useCallback((frac) => {
    logEvent('seek', telOf(idxRef.current));
    ensureSrc();
    const f = Math.min(1, Math.max(0, frac));
    const d = (hasReal(idxRef.current) ? (audioRef.current?.duration || list[idxRef.current]?.duration) : list[idxRef.current]?.duration) || 0;
    const t = f * d;
    simRef.current = t; setCurTime(t);
    if (hasReal(idxRef.current) && audioRef.current) audioRef.current.currentTime = t;
    persist();
  }, [hasReal, ensureSrc, list, persist, telOf]);

  const setVolume = useCallback((v) => { setVol(v); if (audioRef.current) audioRef.current.volume = v; persist(); }, [persist]);
  const toggleShuffle = useCallback(() => setShuffle((s) => !s), []);
  const toggleRepeat = useCallback(() => setRepeat((r) => !r), []);

  // wire real-audio events
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => { if (hasReal(idxRef.current)) { simRef.current = a.currentTime || 0; setCurTime(simRef.current); } };
    const onMeta = () => {
      if (!hasReal(idxRef.current)) return;
      setDur(a.duration || list[idxRef.current]?.duration || 0);
      // restore a persisted position once real metadata is in (first bind)
      if (simRef.current > 1 && Math.abs((a.currentTime || 0) - simRef.current) > 1 && simRef.current < (a.duration || Infinity)) {
        try { a.currentTime = simRef.current; } catch { /* ignore */ }
      }
    };
    const onEnd = () => onEnded();
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('ended', onEnd);
    a.volume = vol;
    return () => {
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('ended', onEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasReal, list, onEnded]);

  // While a track is playing, quietly pre-buffer the NEXT one in playlist
  // order so next/auto-advance starts without a network gap. (One hidden
  // element; the main player then hits the warm HTTP cache.)
  const prefetchRef = useRef(null);
  useEffect(() => {
    if (!playing || list.length < 2) return;
    const nxt = list[(idx + 1) % list.length];
    if (!nxt?.audio) return;
    let p = prefetchRef.current;
    if (!p && typeof Audio !== 'undefined') {
      p = new Audio(); p.preload = 'auto'; p.muted = true;
      prefetchRef.current = p;
    }
    if (p && !(p.src || '').endsWith(nxt.audio)) { p.src = nxt.audio; p.load(); }
  }, [playing, idx, list]);

  // cleanup on unmount
  useEffect(() => () => {
    stopSim();
    try { audioRef.current?.pause(); } catch { /* noop */ }
    try { prefetchRef.current?.removeAttribute('src'); prefetchRef.current = null; } catch { /* noop */ }
    try { intentWarmRef.current?.removeAttribute('src'); intentWarmRef.current = null; } catch { /* noop */ }
  }, [stopSim]);

  const track = list[idx] || null;
  const progress = dur > 0 ? Math.min(1, curTime / dur) : 0;

  const value = useMemo(() => ({
    tracks: list, idx, track, playing, shuffle, repeat, vol, curTime, dur, progress,
    isReal: hasReal(idx),
    toggle, play: startPlayback, pause, next, prev, select, seekTo, setVolume, toggleShuffle, toggleRepeat, warmTrack,
  }), [list, idx, track, playing, shuffle, repeat, vol, curTime, dur, progress, hasReal, toggle, startPlayback, pause, next, prev, select, seekTo, setVolume, toggleShuffle, toggleRepeat, warmTrack]);

  return <RadioContext.Provider value={value}>{children}</RadioContext.Provider>;
}

export function fmtTime(s) {
  s = Math.max(0, Math.floor(s || 0));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}
