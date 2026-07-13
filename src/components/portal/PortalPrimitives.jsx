import { Link } from 'react-router-dom';
import { cityRoutes, getDistrict } from '../../data/publicCity';
import RoomShell from './RoomShell';
import StatusChip from './StatusChip';
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
      <StatusChip label={district.status} tone={district.tone} compact />
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
    proof: (
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
      <div className="room-note-grid">
        {district.sections.map(([title, text], index) => (
          <article className="room-note" key={title}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
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
          <Link to="/contact" className="btn btn-ghost">Send a Signal</Link>
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
