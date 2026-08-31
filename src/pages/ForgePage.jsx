import { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Cpu, Gauge, Headphones, ShieldCheck, Sparkles, Wrench } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import ConciergeNarration from '../components/ui/ConciergeNarration';
import { HYPERION_MEDIA_MANIFEST } from '../data/mediaManifest';
import './ForgePage.css';

const lanes = [
  { id: 'gaming', label: 'Performance', title: 'Gaming systems', outcome: 'High-refresh performance shaped around the games, displays, thermals, and room you actually use.', icon: Gauge },
  { id: 'creator', label: 'Creator', title: 'Studio workstations', outcome: 'Editing, capture, rendering, storage, and quiet operation treated as one working environment.', icon: Sparkles },
  { id: 'local-ai', label: 'Private compute', title: 'Local AI systems', outcome: 'GPU memory, model posture, data custody, and serviceability captured before any parts proposal.', icon: Cpu },
  { id: 'sff', label: 'Small footprint', title: 'SFF systems', outcome: 'Compact machines designed around real heat, noise, travel, desk, and maintenance constraints.', icon: Wrench },
  { id: 'custom-loop', label: 'Showcase', title: 'Custom loop builds', outcome: 'Aesthetic and thermal ambition scoped with maintenance reality and a documented handoff.', icon: ShieldCheck },
];

function ForgeFilm({ media, activeFilmId, onActivate }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const active = activeFilmId === media.id;
  useEffect(() => {
    if (!active) {
      if (videoRef.current && !videoRef.current.paused) videoRef.current.pause();
      setPlaying(false);
    }
  }, [active]);
  const toggle = async () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || navigator.connection?.saveData) return;
    if (!active) onActivate(media.id);
    requestAnimationFrame(async () => {
      const video = videoRef.current;
      if (!video) return;
      if (!video.paused) { video.pause(); setPlaying(false); return; }
      try { await video.play(); setPlaying(true); } catch { setPlaying(false); }
    });
  };
  return (
    <div className="forge-film">
      <img src={media.poster} alt="" loading="lazy" decoding="async" />
      {active && <video ref={videoRef} src={media.video} muted loop playsInline preload="metadata" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />}
      <button type="button" onClick={toggle} aria-label={`${playing ? 'Pause' : 'Play'} ${media.label} cinematic`}><span>{playing ? 'PAUSE' : 'PLAY BUILD FILM'}</span></button>
    </div>
  );
}

export default function ForgePage() {
  const [activeFilmId, setActiveFilmId] = useState(null);
  return (
    <PageShell>
      <Helmet>
        <title>Hyperion Forge | Custom Computers Built Around the Work</title>
        <meta name="description" content="Explore custom gaming, creator, local-AI, compact, and showcase systems. Start with a guided build brief; final parts and price follow human review." />
        <link rel="canonical" href="https://hyperion-industries.dev/forge" />
      </Helmet>

      <main className="forge-flagship">
        <section className="forge-hero">
          <div className="forge-hero-film" aria-hidden="true"><img src="/assets/cinematic-v2/forge-lab-keyframe.webp" alt="" fetchPriority="high" /></div>
          <div className="forge-hero-shade" />
          <div className="forge-hero-copy">
            <p>HYPERION FORGE · CUSTOM SYSTEMS · ASSESSMENT FIRST</p>
            <h1>The machine should fit<br /><em>the life around it.</em></h1>
            <span>Workload, room, noise, custody, serviceability, and taste become one reviewable build profile. No generic cart. No invisible compatibility promise.</span>
            <div className="forge-hero-actions">
              <Link className="btn btn-gold" to="/forge/configurator?source=forge_district">Start a Forge Build <ArrowRight size={15} /></Link>
              <Link className="btn btn-ghost" to="/build-archive">See completed work</Link>
            </div>
          </div>
          <div className="forge-hero-posture">
            <strong>THE FORGE SEQUENCE</strong>
            {['Choose a lane', 'Describe the workload', 'Keep unknowns visible', 'Review with an operator', 'Receive a proposal'].map((item, index) => <span key={item}><b>0{index + 1}</b>{item}</span>)}
            <small>REVIEW REQUIRED · NOT A QUOTE</small>
          </div>
        </section>

        <section className="forge-lanes" aria-labelledby="forge-lanes-title">
          <div className="forge-section-heading">
            <div><span>01 · CHOOSE THE PRESSURE</span><h2 id="forge-lanes-title">Start with what the system must do.</h2></div>
            <p>Each lane opens the same editable Forge Concierge. Your selection is a starting point, not a locked bundle.</p>
          </div>
          <div className="forge-lane-grid">
            {lanes.map((lane, index) => {
              const media = HYPERION_MEDIA_MANIFEST.assets.forge[index];
              const Icon = lane.icon;
              return (
                <article className="forge-lane" key={lane.id}>
                  <ForgeFilm media={media} activeFilmId={activeFilmId} onActivate={setActiveFilmId} />
                  <div className="forge-lane-copy">
                    <span><Icon size={15} /> {lane.label}</span><h3>{lane.title}</h3><p>{lane.outcome}</p>
                    <Link to={`/forge/configurator?lane=${lane.id}&source=forge`}>Build this brief <ArrowRight size={14} /></Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="forge-proof-band" aria-labelledby="forge-proof-title">
          <div className="forge-section-heading">
            <div><span>02 · THE HANDOFF MATTERS</span><h2 id="forge-proof-title">Premium is more than a parts list.</h2></div>
            <ConciergeNarration cue="forge-lanes" compact />
          </div>
          <div className="forge-proof-grid">
            {[
              ['BUILD QUALITY', 'Layout, cooling, cable paths, update posture, and validation are part of the system—not cleanup after it.'],
              ['SERVICE HORIZON', 'Reusable parts, maintenance access, warranty posture, and the likely next upgrade remain visible.'],
              ['CUSTODY', 'Local-AI and creator briefs record where models, archives, and working media are expected to live.'],
              ['DELIVERY', 'Setup notes, observed configuration, known limits, and support posture travel with the machine.'],
            ].map(([title, copy]) => <article key={title}><CheckCircle2 size={18} /><h3>{title}</h3><p>{copy}</p></article>)}
          </div>
        </section>

        <section className="forge-next">
          <div><Headphones size={21} /><span>03 · FORGE CONCIERGE</span><h2>Tell us the pressure.<br />We’ll preserve the unknowns.</h2></div>
          <div>
            <p>The public brief becomes a held-for-review intake record. A human reviews fit before any proposal, invoice, purchase, or build commitment exists.</p>
            <Link className="btn btn-gold" to="/forge/configurator?source=forge_district">Create the build profile <ArrowRight size={15} /></Link>
            <Link className="btn btn-ghost" to="/forge/catalog">Compare system lanes</Link>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
