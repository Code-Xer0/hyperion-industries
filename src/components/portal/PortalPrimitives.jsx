import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { cityRoutes, getDistrict } from '../../data/publicCity';
import RoomShell from './RoomShell';
import StatusChip from './StatusChip';
import { PUBLIC_DOCTRINE } from '../../data/publicDoctrine';
import './PortalPrimitives.css';

function PortalLink({ action, className }) {
  if (!action) return null;
  if (action.href) {
    return <a className={className} href={action.href} target="_blank" rel="noopener noreferrer">{action.label}</a>;
  }
  return <Link className={className} to={action.path}>{action.label}</Link>;
}

export { default as StatusChip } from './StatusChip';

export function StatusRail({ districts, compact = false }) {
  return (
    <div className={`city-status-rail${compact ? ' is-compact' : ''}`} aria-label="Current public maturity labels">
      {districts.map((district) => (
        <Link key={district.id} to={district.path} className="city-status-stop">
          <strong>{district.navLabel}</strong>
          <StatusChip label={district.status} tone={district.tone} compact />
        </Link>
      ))}
    </div>
  );
}

export function DistrictCard({ district, featured = false }) {
  return (
    <Link to={district.path} className={`city-district-card city-accent-${district.accent}${featured ? ' is-featured' : ''}`}>
      <div className="city-card-topline">
        <span>{district.navLabel}</span>
        <span aria-hidden="true">↗</span>
      </div>
      <h3>{district.title}</h3>
      <p>{district.summary}</p>
      <div className="city-card-outcome"><StatusChip label={district.status} tone={district.tone} compact /><span>{district.primaryCta?.label || 'Open district'} →</span></div>
    </Link>
  );
}

export function CityMap({ districts = cityRoutes }) {
  return (
    <div className="city-map-grid">
      {districts.map((district) => <DistrictCard key={district.id} district={district} />)}
    </div>
  );
}

export function ProofLane({ districts }) {
  const withMedia = districts.filter((district) => district.media);
  return (
    <div className="city-proof-lane">
      {withMedia.map((district) => (
        <Link to={district.path} className={`city-proof city-accent-${district.accent}`} key={district.id}>
          <figure>
            <img src={district.media.src} alt={district.media.alt} loading="lazy" />
            <figcaption>
              <span>{district.media.label}</span>
              <strong>{district.navLabel}</strong>
              <small>{district.media.source}</small>
            </figcaption>
          </figure>
        </Link>
      ))}
    </div>
  );
}

export function MaturityLegend() {
  const items = [
    ['live', 'Live / stable beta'],
    ['shipping', 'Shipping'],
    ['inquiry', 'By inquiry'],
    ['development', 'In development'],
    ['concept', 'Concept / research'],
  ];

  return (
    <div className="city-legend" aria-label="Maturity legend">
      {items.map(([tone, label]) => <StatusChip key={tone} tone={tone} label={label} compact />)}
    </div>
  );
}

function DistrictDiagram({ district }) {
  return (
    <div className={`district-diagram city-accent-${district.accent}`} aria-label={`${district.title} public architecture diagram`}>
      {district.diagram.map((node, index) => (
        <div className="district-diagram-node" key={node}>
          <span>{String(index + 1).padStart(2, '0')}</span>
          <strong>{node}</strong>
        </div>
      ))}
    </div>
  );
}

function RelatedDistricts({ ids }) {
  return (
    <div className="related-districts">
      {ids.map(getDistrict).filter(Boolean).map((district) => (
        <DistrictCard key={district.id} district={district} />
      ))}
    </div>
  );
}

function AuthorityContract({ district }) {
  const rows = [
    ['SOURCE', 'Facts stay source-bound', district.authority.source],
    ['CONTEXT', 'Meaning stays context-bound', district.authority.context],
    ['AUTHORITY', 'Actions stay authority-bound', district.authority.action],
  ];

  return (
    <section className="district-authority-contract" aria-labelledby={`${district.id}-authority-title`}>
      <header>
        <span className="portal-label">Public authority contract</span>
        <h2 id={`${district.id}-authority-title`}>{PUBLIC_DOCTRINE.principle}</h2>
      </header>
      <div>
        {rows.map(([status, title, text]) => (
          <article key={status}>
            <span>{status}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ForgeMotionShelf({ items }) {
  if (!items?.length) return null;

  return (
    <section className="forge-motion-shelf" aria-label="Kuda lineage build media">
      <div className="forge-motion-shelf-head">
        <div>
          <span className="portal-label">Build media archive</span>
          <h3>Kuda lineage, in motion.</h3>
        </div>
        <p>Public build proof from the Forge archive. Select a card to play its clip.</p>
      </div>
      <div className="forge-motion-grid">
        {items.map((item) => (
          <article className="forge-motion-card" key={item.id}>
            <video
              src={item.src}
              poster={item.poster}
              controls
              muted
              loop
              playsInline
              preload="metadata"
              aria-label={`${item.title}: ${item.description}`}
            />
            <div>
              <span>{item.title}</span>
              <p>{item.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ForgeNavigationVideoCard({ item, activeId, onActivate }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const active = activeId === item.id;
  const toggle = async (event) => {
    event.preventDefault();
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || navigator.connection?.saveData) return;
    if (!active) onActivate(item.id);
    requestAnimationFrame(async () => {
      const video = videoRef.current;
      if (!video) return;
      if (!video.paused) { video.pause(); setPlaying(false); return; }
      try { await video.play(); } catch { /* Poster remains the truthful fallback. */ }
    });
  };

  return (
    <article className="forge-city-media-card">
      <img src={item.poster} alt="" loading="lazy" decoding="async" />
      {active && <video ref={videoRef} src={item.src} poster={item.poster} muted loop playsInline preload="metadata" aria-hidden="true" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />}
      <div>
        <Link to="/forge" aria-label={`Open Forge: ${item.title}`}><span>{item.title}</span></Link>
        <p>{item.description}</p>
        <button type="button" onClick={toggle}>{active && playing ? 'Pause film' : 'Play build film'}</button>
      </div>
    </article>
  );
}

export function ForgeBuildNavigation({ motion }) {
  const [activeId, setActiveId] = useState(null);
  if (!motion?.cards?.length) return null;

  return (
    <section className="forge-city-navigation" aria-label="Forge build navigation">
      <header className="forge-city-navigation-head">
        <div>
          <span className="city-label">Forge build navigation</span>
          <h3>Choose a build signal.</h3>
          <p>Each route carries its own moving build proof.</p>
        </div>
        {motion.stills?.length ? (
          <div className="forge-city-stills" aria-label="Kuda field stills">
            {motion.stills.map((still) => (
              <figure key={still.src}>
                <img src={still.src} alt={still.alt} loading="lazy" decoding="async" />
                <figcaption>{still.label}</figcaption>
              </figure>
            ))}
          </div>
        ) : null}
      </header>
      <div className="forge-city-media-grid">
        {motion.cards.map((item) => <ForgeNavigationVideoCard key={item.id} item={item} activeId={activeId} onActivate={setActiveId} />)}
      </div>
    </section>
  );
}

export function DistrictLayout({ district }) {
  const stations = [
    { id: 'overview', label: 'Overview' },
    { id: 'proof', label: 'Proof' },
    { id: 'boundary', label: 'Boundary' },
    { id: 'next', label: 'Next' },
  ];

  const panels = {
    overview: (
      <div className="room-panel-grid district-room-overview">
        <div className="room-panel-copy">
          <h2>{district.title}</h2>
          <p>{district.summary}</p>
          <blockquote>{district.doctrine}</blockquote>
          <div className="room-action-row">
            <PortalLink action={district.primaryCta} className="btn btn-gold" />
            <PortalLink action={district.secondaryCta} className="btn btn-ghost" />
          </div>
        </div>
        <DistrictDiagram district={district} />
      </div>
    ),
    proof: district.motion ? (
      <div className="district-motion-room">
        <div className="district-proof-room has-media">
          <figure className={`district-media city-accent-${district.accent}`}>
            <video
              src={district.motion.hero.src}
              poster={district.motion.hero.poster}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label={district.motion.hero.alt}
            />
            <figcaption>
              <span>{district.motion.hero.label}</span>
              <strong>{district.motion.hero.source}</strong>
              <small>Capture demonstrates the labeled posture only.</small>
            </figcaption>
          </figure>
          <div className="district-boundary">
            <span className="portal-label">Public proof</span>
            <h2>Evidence within the stated boundary.</h2>
            <ul>{district.proof.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
        </div>
        <ForgeMotionShelf items={district.motion.cards} />
      </div>
    ) : (
      <div className={`district-proof-room${district.media ? ' has-media' : ''}`}>
        {district.media ? (
          <figure className={`district-media city-accent-${district.accent}`}>
            <img src={district.media.src} alt={district.media.alt} />
            <figcaption>
              <span>{district.media.label}</span>
              <strong>{district.media.source}</strong>
              <small>Capture demonstrates the labeled posture only.</small>
            </figcaption>
          </figure>
        ) : <DistrictDiagram district={district} />}
        <div className="district-boundary">
          <span className="portal-label">Public proof</span>
          <h2>Evidence within the stated boundary.</h2>
          <ul>{district.proof.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      </div>
    ),
    boundary: (
      <div className="district-boundary-room">
        <AuthorityContract district={district} />
        <div className="room-note-grid">
          {district.sections.map(([title, text], index) => (
            <article className="room-note" key={title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </div>
    ),
    next: (
      <div className="district-next-room">
        <div className="district-related-head">
          <div>
            <span className="portal-label">Transit</span>
            <h2>Continue through the city.</h2>
          </div>
          <MaturityLegend />
        </div>
        <RelatedDistricts ids={district.related} />
        <div className="room-action-row">
          <PortalLink action={district.primaryCta} className="btn btn-gold" />
          <Link to="/intake" className="btn btn-ghost">Start an Assessment</Link>
        </div>
      </div>
    ),
  };

  return (
    <RoomShell
      eyebrow={`Gate / ${district.navLabel}`}
      title={district.navLabel}
      summary={district.summary}
      status={district.status}
      tone={district.tone}
      stations={stations}
      panels={panels}
      defaultStation="overview"
      className={`district-room-shell city-accent-${district.accent}`}
    />
  );
}
