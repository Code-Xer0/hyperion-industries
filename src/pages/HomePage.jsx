import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import CinematicBackdrop from '../components/ui/CinematicBackdrop';
import HeroCanvas from '../components/ui/HeroCanvas';
import RoomShell from '../components/portal/RoomShell';
import { CityMap, ForgeBuildNavigation, MaturityLegend, ProofLane, StatusRail } from '../components/portal/PortalPrimitives';
import { cityRoutes, getDistrict, getFeaturedDistricts, getStatusRailDistricts } from '../data/publicCity';
import { PUBLIC_DOCTRINE } from '../data/publicDoctrine';
import { HYPERION_MEDIA_MANIFEST } from '../data/mediaManifest';
import './HomePage.css';

const stations = [
  { id: 'signal', label: 'Signal' },
  { id: 'method', label: 'Method' },
  { id: 'city', label: 'City' },
  { id: 'proof', label: 'Proof' },
  { id: 'inquiry', label: 'Inquiry' },
];

const intakeLanes = [
  { index: '01', name: 'Forge', detail: 'Custom PCs, workstations, local AI, upgrades, sim rigs, and deployment briefs.', to: '/forge/configurator?source=home_inquiry' },
  { index: '02', name: 'Pandora', detail: 'Infrastructure, rack, power, network, site-control, and readiness review.', to: '/intake/pandora?source=home_inquiry' },
  { index: '03', name: 'Continuity', detail: 'Protect records, operating context, handoffs, and recovery posture.', to: '/intake/continuity?source=home_inquiry' },
  { index: '04', name: 'Operator Identity', detail: 'Define a physical or digital trust surface and issuance posture.', to: '/intake/operator-identity?source=home_inquiry' },
  { index: '05', name: 'Support', detail: 'Route an active Hyperion product or service issue without exposing secrets.', to: '/intake/support?source=home_inquiry' },
  { index: '06', name: 'Relationships', detail: 'Open a partnership, supplier, research, civic, or media conversation.', to: '/intake/relationships?source=home_inquiry' },
  { index: '07', name: 'General', detail: 'Preserve a signal that does not yet fit a specialist lane.', to: '/intake/general?source=home_inquiry' },
];

export default function HomePage() {
  const featured = getFeaturedDistricts();
  const statusRail = getStatusRailDistricts();
  const mapDistricts = cityRoutes.filter((district) => district.id !== 'alignment');
  const forge = getDistrict('forge');

  const panels = {
    signal: (
      <div className="gate-signal-room gate-flagship-room">
        <div className="gate-copy">
          <p className="gate-kicker">Hyperion Industries · {PUBLIC_DOCTRINE.category}</p>
          <h2>STRATIFIED SYSTEMS.<br /><em>BUILT TO SURVIVE CONTACT WITH REALITY.</em></h2>
          <p className="gate-lead">Hyperion integrates people, AI, software, data, infrastructure, hardware, workflow, and governance into coherent operational systems.</p>
          <p className="gate-promise">We don’t sell seats or hours. We build the system that turns capability into useful output.</p>
          <div className="gate-doors-grid" aria-label="Two ways to work with Hyperion">
            <Link to="/store#products" className="gate-door-card is-product">
              <span className="door-tag">PERSONALIZED PRODUCT PREVIEWS · CHECKOUT PREPARING</span>
              <strong className="door-title">Buy something useful now</strong>
              <p className="door-desc">Agent Policy · Flight Pack · Local + Frontier Routing</p>
              <span className="door-cta">Three compiled products · $19–49 <ArrowUpRight size={13} aria-hidden="true" /></span>
            </Link>
            <Link to="/intake" className="gate-door-card is-custom">
              <span className="door-tag">SCOPED · OPERATOR-REVIEWED</span>
              <strong className="door-title">Build something serious with Hyperion</strong>
              <p className="door-desc">Connect the layers that need to work together, from one small automation to a complete deployment.</p>
              <span className="door-cta">Start an assessment <ArrowUpRight size={13} aria-hidden="true" /></span>
            </Link>
          </div>
          <nav className="gate-quick-links" aria-label="Quick access">
            <Link to="/intake">Start</Link><Link to="/intake/resume">Resume</Link>
            <Link to="/account">My Projects</Link><Link to="/forge/configurator">Forge</Link>
            <Link to="/card-studio">Card Studio</Link>
          </nav>
          <StatusRail districts={statusRail} compact />
        </div>
          <div className="gate-company-proof" aria-label="Hyperion continuity property">
          <span>ENGINEERING PROPERTY · CONTINUITY</span>
          <strong>Built to keep working through change.</strong>
          <p>{PUBLIC_DOCTRINE.continuity}</p>
        </div>
      </div>
    ),
    method: (
      <div className="gate-method-room">
        <div className="gate-room-heading">
          <div>
            <span className="city-label">Stratified Systems · Method</span>
            <h2>Connect the layers that matter.</h2>
          </div>
          <p>{PUBLIC_DOCTRINE.method}</p>
        </div>
        <div className="gate-method-grid">
          {PUBLIC_DOCTRINE.invariant.map((step, index) => (
            <article key={step.id}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{step.label}</h3>
              <p>{step.detail}</p>
            </article>
          ))}
        </div>
        <blockquote>{PUBLIC_DOCTRINE.principle}</blockquote>
        <div className="gate-configurations" aria-label="Illustrative operating configurations">
          {PUBLIC_DOCTRINE.configurations.map((configuration) => (
            <article key={configuration.id}><span>ILLUSTRATIVE CONFIGURATION</span><h3>{configuration.title}</h3><p>{configuration.detail}</p></article>
          ))}
        </div>
        <p className="gate-operating-range">{PUBLIC_DOCTRINE.operatingRange}</p>
      </div>
    ),
    city: (
      <div className="gate-directory-room">
        <div className="gate-room-heading">
          <div>
            <span className="city-label">City Directory</span>
            <h2>Choose a district.</h2>
          </div>
          <MaturityLegend />
        </div>
        <CityMap districts={mapDistricts} />
        <ForgeBuildNavigation motion={forge?.motion} />
      </div>
    ),
    proof: (
      <div className="gate-proof-room">
        <div className="gate-room-heading">
          <div>
            <span className="city-label">Live Proof Rail</span>
            <h2>See the work, not a promise.</h2>
          </div>
          <p>Public-safe product captures carry the same maturity boundary as the system they represent.</p>
        </div>
        <ProofLane districts={featured} />
      </div>
    ),
    inquiry: (
      <div className="gate-inquiry-room">
        <div className="gate-room-heading">
          <div>
            <span className="city-label">Assessment-first entry</span>
            <h2>Start with one continuity failure.</h2>
          </div>
          <p>{PUBLIC_DOCTRINE.assessment}</p>
        </div>
        <div className="gate-intake-grid">
          {intakeLanes.map((lane) => (
            <article className="gate-intake-card" key={lane.name}>
              <span>{lane.index} · INTAKE</span><h3>{lane.name}</h3><p>{lane.detail}</p><Link to={lane.to}>Open {lane.name} lane</Link>
            </article>
          ))}
        </div>
        <div className="room-action-row">
          <Link to="/intake?source=home_inquiry" className="btn btn-gold">Choose an Intake Lane</Link>
          <Link to="/contact" className="btn btn-ghost">Contact Hyperion</Link>
          <a href="https://chr0nos.app" className="btn btn-ghost" target="_blank" rel="noopener noreferrer">CHR0N.OS <ArrowUpRight size={14} aria-hidden="true" /></a>
        </div>
      </div>
    ),
  };

  return (
    <PageShell className="home city-gate-page">
      <Helmet>
        <title>Hyperion Industries | Stratified Systems</title>
        <meta name="description" content="Hyperion integrates people, AI, software, data, infrastructure, hardware, workflow, and governance into coherent operational systems built to survive contact with reality." />
        <link rel="canonical" href="https://hyperion-industries.dev/" />
        <meta property="og:title" content="Hyperion Industries | Stratified Systems" />
        <meta property="og:description" content="Hyperion integrates the layers that turn capability into useful output, with continuity across tools, people, and change." />
        <meta property="og:type" content="website" />
      </Helmet>

      <RoomShell
        eyebrow="Hyperion City / Gate"
        title="City Gate"
        summary="People, AI, software, data, infrastructure, hardware, workflow, and governance, composed into useful operational systems."
        status="PUBLIC EDGE · SOFT LAUNCH"
        tone="live"
        stations={stations}
        panels={panels}
        defaultStation="signal"
        className="gate-city-room"
        actions={<div className="gate-cinematic-actions"><div id="gate-film-controls" className="gate-film-controls" /><small>Hyperion City concept film</small></div>}
        backdrop={(
          <>
            <CinematicBackdrop asset={HYPERION_MEDIA_MANIFEST.assets.city_gate} className="gate-film" label="Play Hyperion City cinematic" controlTarget="gate-film-controls" autoplay />
            <div className="gate-film-shade" />
            <HeroCanvas />
          </>
        )}
      />
    </PageShell>
  );
}
