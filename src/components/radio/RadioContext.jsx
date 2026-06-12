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

export function RadioProvider({ tracks, children }) {
  const list = tracks && tracks.length ? tracks : [];

  const audioRef = useRef(null);
  if (audioRef.current === null && typeof Audio !== 'undefined') {
    const a = new Audio();
    a.preload = 'metadata';
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

  const telOf = (i) => { const t = list[i]; return t ? { t: t.id, title: t.title } : {}; };

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
  }, [list.length, stopSim]);

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

  const startPlayback = useCallback(() => {
    setPlaying(true); playingRef.current = true;
    logEvent('play', telOf(idxRef.current));
    if (hasReal(idxRef.current)) { audioRef.current?.play().catch(() => {}); }
    else { startSim(); }
    persist();
  }, [hasReal, startSim, persist]);

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

  const toggle = useCallback(() => { (playingRef.current ? pause : startPlayback)(); }, [pause, startPlayback]);
  const next = useCallback(() => { logEvent('skip', telOf(idxRef.current)); loadTrack(shuffleRef.current ? Math.floor(Math.random() * list.length) : idxRef.current + 1, true); }, [loadTrack, list.length]);
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
    const f = Math.min(1, Math.max(0, frac));
    const d = (hasReal(idxRef.current) ? (audioRef.current?.duration || list[idxRef.current]?.duration) : list[idxRef.current]?.duration) || 0;
    const t = f * d;
    simRef.current = t; setCurTime(t);
    if (hasReal(idxRef.current) && audioRef.current) audioRef.current.currentTime = t;
    persist();
  }, [hasReal, list, persist]);

  const setVolume = useCallback((v) => { setVol(v); if (audioRef.current) audioRef.current.volume = v; persist(); }, [persist]);
  const toggleShuffle = useCallback(() => setShuffle((s) => !s), []);
  const toggleRepeat = useCallback(() => setRepeat((r) => !r), []);

  // wire real-audio events
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => { if (hasReal(idxRef.current)) { simRef.current = a.currentTime || 0; setCurTime(simRef.current); } };
    const onMeta = () => { if (hasReal(idxRef.current)) setDur(a.duration || list[idxRef.current]?.duration || 0); };
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

  // cleanup on unmount
  useEffect(() => () => { stopSim(); try { audioRef.current?.pause(); } catch { /* noop */ } }, [stopSim]);

  const track = list[idx] || null;
  const progress = dur > 0 ? Math.min(1, curTime / dur) : 0;

  const value = useMemo(() => ({
    tracks: list, idx, track, playing, shuffle, repeat, vol, curTime, dur, progress,
    isReal: hasReal(idx),
    toggle, play: startPlayback, pause, next, prev, select, seekTo, setVolume, toggleShuffle, toggleRepeat,
  }), [list, idx, track, playing, shuffle, repeat, vol, curTime, dur, progress, hasReal, toggle, startPlayback, pause, next, prev, select, seekTo, setVolume, toggleShuffle, toggleRepeat]);

  return <RadioContext.Provider value={value}>{children}</RadioContext.Provider>;
}

export function fmtTime(s) {
  s = Math.max(0, Math.floor(s || 0));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}
