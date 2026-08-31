import { useRef, useState } from 'react';
import { Headphones, Pause, Play } from 'lucide-react';
import { CONCIERGE_MANIFEST } from '../../data/conciergeManifest';
import './ConciergeNarration.css';

export default function ConciergeNarration({ cue, compact = false }) {
  const item = CONCIERGE_MANIFEST.cues[cue];
  const audioRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  if (!item) return null;
  const toggle = async () => {
    if (!item.audio) { setOpen((value) => !value); return; }
    if (!audioRef.current) return;
    if (!audioRef.current.paused) { audioRef.current.pause(); return; }
    try { await audioRef.current.play(); } catch { setPlaying(false); }
  };
  return (
    <aside className={`concierge-narration${compact ? ' is-compact' : ''}`}>
      {item.audio && <audio ref={audioRef} src={item.audio} preload="none" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />}
      <button type="button" onClick={toggle} aria-expanded={open}>{item.audio ? (playing ? <Pause size={14} /> : <Play size={14} />) : <Headphones size={14} />}<span>{item.audio ? `${playing ? 'Pause' : 'Play'} concierge` : 'Read concierge note'}</span></button>
      {!item.audio && <small>GUIDED TRANSCRIPT</small>}
      {(open || playing) && <div><strong>{item.title}</strong><p>{item.transcript}</p></div>}
    </aside>
  );
}
