import { useEffect, useRef } from 'react';
import { useRadio, fmtTime } from './RadioContext';
import HoverEditor from '../ui/HoverEditor';
import { track as logEvent } from '../../utils/telemetry';

const VIDEO_RE = /\.(mp4|webm|ogg|mov)$/i;
const GLYPH = '/assets/founder/hyperion-mark.svg';
const MEMBERS = [
  ['The Operator', 'operator'],
  ['Lilith', 'lilith'],
  ['Eva', 'eva'],
  ['Kairo', 'kairo'],
];

function CoverArt({ track }) {
  // Large player shows MOVING art when artAnimated is set (video or gif/webp),
  // else falls back to the static cover. (The mini player always uses static.)
  // Animated sources aren't guaranteed square: render them object-fit:contain
  // over a blurred static-art fill so off-aspect art letterboxes gracefully
  // instead of getting center-cropped.
  const anim = track?.artAnimated;
  if (anim) {
    const media = VIDEO_RE.test(anim)
      ? <video className="cover-fit" src={anim} autoPlay loop muted playsInline poster={track.artStatic || undefined} />
      : <img className="cover-fit" src={anim} alt={`${track.title} cover`} />;
    return (
      <>
        {track.artStatic && <img className="cover-blur" src={track.artStatic} alt="" aria-hidden="true" />}
        {media}
      </>
    );
  }
  return <img src={track?.artStatic} alt={track ? `${track.title} cover` : 'cover art'} />;
}

export default function RadioConsole() {
  const {
    tracks, idx, track, playing, shuffle, repeat, vol, curTime, dur, progress, isReal,
    toggle, next, prev, select, seekTo, setVolume, toggleShuffle, toggleRepeat, warmTrack,
  } = useRadio();

  // drive the tracklist EQ animation state on the page root
  useEffect(() => {
    const el = document.querySelector('.founder-page');
    if (el) el.classList.toggle('is-playing', playing);
  }, [playing]);

  // fire a one-shot "radio_open" when the console first scrolls into view
  const shellRef = useRef(null);
  useEffect(() => {
    const el = shellRef.current;
    if (!el || !('IntersectionObserver' in window)) return;
    let fired = false;
    const io = new IntersectionObserver((es) => {
      if (es[0].isIntersecting && !fired) { fired = true; logEvent('radio_open', {}); io.disconnect(); }
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (!track) return null;
  const pct = `${progress * 100}%`;
  const statusText = !playing ? 'Signal standby' : (isReal ? 'On air' : 'Preview signal');

  const onSeek = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    seekTo((e.clientX - r.left) / r.width);
  };

  return (
    <div className="radio-shell hud reveal" ref={shellRef}>
      <div className="radio-top">
        <div className="radio-brand">
          <img src={GLYPH} alt="Hyperion glyph" />
          <span className="rb-name">//H¥PE<span className="accent"> · RADIO</span></span>
        </div>
        <div className="radio-status">
          <span className={`led${playing ? '' : ' offline'}`} />
          <span>{statusText}</span>
        </div>
      </div>

      <div className="radio-body">
        {/* NOW PLAYING */}
        <div className="radio-now">
          <div className="cover-stage">
            <span className="cover-glow" />
            <CoverArt track={track} />
          </div>
          <div className="np-meta">
            <div className="np-eyebrow">Now playing · {String(idx + 1).padStart(2, '0')}</div>
            <div className="np-title">{track.title}</div>
            <div className="np-artist" data-persona={track.persona}>{track.artist}</div>
            <div className="np-credit">Produced by <b>{track.producer || 'Kairo'}</b> · Composed by {track.composer || 'Xero'}</div>
          </div>

          <div className="seek">
            <div className="seek-bar" onClick={onSeek} role="slider" aria-label="Seek"
              aria-valuemin={0} aria-valuemax={Math.round(dur)} aria-valuenow={Math.round(curTime)} tabIndex={0}>
              <div className="seek-fill" style={{ width: pct }} />
              <div className="seek-knob" style={{ left: pct }} />
            </div>
            <div className="seek-times"><span>{fmtTime(curTime)}</span><span>{fmtTime(dur)}</span></div>
          </div>

          <div className="transport">
            <button className={`tbtn${shuffle ? ' active' : ''}`} onClick={toggleShuffle} aria-label="Shuffle" title="Shuffle">
              <svg viewBox="0 0 24 24"><path d="M18 4l3 3-3 3V8h-2.5l-2.3 2.7-1.3-1.5L13.9 6H18V4zM3 6h4.2l8.6 10.3H21v-2l3 3-3 3v-2h-5.9L6.5 8H3V6zm15 8v-2l3 3-3 3v-2h-2.2l-1.6-1.9 1.3-1.5L17 14h1z" /></svg>
            </button>
            <button className="tbtn" onClick={prev} aria-label="Previous" title="Previous">
              <svg viewBox="0 0 24 24"><path d="M6 5h2v14H6zM20 5v14L9 12z" /></svg>
            </button>
            <button className="tbtn play" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
              <svg viewBox="0 0 24 24"><path d={playing ? 'M6 5h4v14H6zM14 5h4v14h-4z' : 'M8 5v14l11-7z'} /></svg>
            </button>
            <button className="tbtn" onClick={next} aria-label="Next" title="Next">
              <svg viewBox="0 0 24 24"><path d="M16 5h2v14h-2zM4 5l11 7L4 19z" /></svg>
            </button>
            <button className={`tbtn${repeat ? ' active' : ''}`} onClick={toggleRepeat} aria-label="Repeat" title="Repeat">
              <svg viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" /></svg>
            </button>
          </div>

          <div className="transport-sub">
            <div className="vol">
              <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z" /></svg>
              <input type="range" min="0" max="100" value={Math.round(vol * 100)}
                onChange={(e) => setVolume(e.target.value / 100)} aria-label="Volume" />
            </div>
            {!isReal && <span className="demo-flag">Demo · no source bound</span>}
          </div>
        </div>

        {/* TRACKLIST */}
        <div className="radio-list-wrap">
          <div className="radio-list-head">
            <span className="rl-t">Transmission log</span>
            <span className="rl-t">{tracks.length} tracks</span>
          </div>
          <div className="radio-list">
            {tracks.map((t, i) => (
              <HoverEditor key={t.id || i} model="radio" index={i}>
                <div className={`trk${i === idx ? ' on' : ''}`} data-persona={t.persona} role="button" tabIndex={0}
                  onClick={() => select(i)}
                  onPointerEnter={() => warmTrack(i)}
                  onPointerDown={() => warmTrack(i)}
                  onFocus={() => warmTrack(i)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(i); } }}>
                  <span className="trk-n">{String(i + 1).padStart(2, '0')}</span>
                  <span className="trk-art">
                    <img src={t.artStatic} alt={`${t.title} cover`} />
                    <span className="eq"><i /><i /><i /><i /></span>
                  </span>
                  <span className="trk-meta">
                    <span className="trk-title">{t.title}</span>
                    <span className="trk-sub">{t.artist}</span>
                  </span>
                  <span className="trk-end">
                    <span className="trk-dur">{fmtTime(t.duration)}</span>
                    <a className="trk-dl" href={t.audio || undefined} download
                      onClick={(e) => { e.stopPropagation(); if (!t.audio) { e.preventDefault(); return; } logEvent('download', { t: t.id, title: t.title }); }}
                      aria-label={`Download ${t.title}`} title="Download">
                      <svg viewBox="0 0 24 24"><path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" /></svg>
                    </a>
                  </span>
                </div>
              </HoverEditor>
            ))}
          </div>
        </div>
      </div>

      <div className="radio-foot">
        <span className="rf-brand">//H¥PE</span>
        <span className="rf-roster">
          {MEMBERS.map(([name, p]) => (
            <span className="rf-m" data-persona={p} key={p}><i aria-hidden="true" />{name}</span>
          ))}
        </span>
      </div>
    </div>
  );
}
