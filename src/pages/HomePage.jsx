import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import HeroCanvas from '../components/ui/HeroCanvas';
import CinematicBackdrop from '../components/ui/CinematicBackdrop';
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
  { index: '08', name: 'Live Sites', detail: 'Launch an offer, proof surface, conversion path, and governed operating handoff.', to: '/intake/live-sites?source=home_inquiry' },
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
          <p className="gate-kicker">Hyperion Industries · Systems built for the work</p>
          <h2>Build the machine.<br /><em>Keep the advantage.</em></h2>
          <p className="gate-lead">Custom computers, durable identity, and continuity systems designed around the way people actually work—not a generic cart or a disposable stack.</p>
          <div className="gate-offer-strip" aria-label="Hyperion flagship offers">
            <span><strong>FORGE</strong> Custom systems</span>
            <span><strong>CARD STUDIO</strong> Physical + digital identity</span>
            <span><strong>CHR0N.OS</strong> Local-first continuity</span>
            <span><strong>LIVE SITES</strong> Conversion + governed intake</span>
          </div>
          <div className="room-action-row">
            <Link to="/store?source=home_signal" className="btn btn-gold">Start a Project</Link>
            <Link to="/forge/configurator?source=home_signal" className="btn btn-ghost">Configure a Forge Build</Link>
            <Link to="/#proof" className="btn btn-ghost">See the Work</Link>
          </div>
          <StatusRail districts={statusRail} compact />
        </div>
        <div className="gate-company-proof" aria-label="Hyperion commercial posture">
          <span>PUBLIC EDGE · SOFT LAUNCH</span>
          <strong>Assessment first.</strong>
          <p>Every build, card, and continuity engagement begins with a visible scope and ends with a reviewable handoff.</p>
          <Link to="/systems">Explore Hyperion systems <ArrowUpRight size={14} aria-hidden="true" /></Link>
        </div>
      </div>
    ),
    method: (
      <div className="gate-method-room">
        <div className="gate-room-heading">
          <div>
            <span className="city-label">Continuity method</span>
            <h2>One operating grammar.</h2>
          </div>
          <p>Specialized systems stay distinct. The same rules govern how they capture evidence, preserve meaning, and request action.</p>
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
          <Link to="/store?source=home_inquiry" className="btn btn-ghost">View Project Packages</Link>
          <Link to="/contact" className="btn btn-ghost">Contact Hyperion</Link>
        </div>
      </div>
    ),
  };

  return (
    <PageShell className="home city-gate-page">
      <Helmet>
        <title>Hyperion Industries | Custom Systems, Identity, and Live Sites</title>
        <meta name="description" content="Hyperion builds custom computers, operator identity, local-first continuity systems, and premium live sites with proposal-first delivery." />
        <link rel="canonical" href="https://hyperion-industries.dev/" />
        <meta property="og:title" content="Hyperion Industries | Systems Built for the Work" />
        <meta property="og:description" content="Custom systems, durable identity, continuity software, and premium live sites with visible scope and operator review." />
        <meta property="og:type" content="website" />
      </Helmet>

      <RoomShell
        eyebrow="Hyperion City / Gate"
        title="City Gate"
        summary="The public edge of a governed continuity company: evidence, maturity, operating domains, and assessment-first entry."
        status="PUBLIC EDGE · SOFT LAUNCH"
        tone="live"
        stations={stations}
        panels={panels}
        defaultStation="signal"
        className="gate-city-room"
        backdrop={(
          <>
            <CinematicBackdrop asset={HYPERION_MEDIA_MANIFEST.assets.city_gate} className="gate-film" label="Play Hyperion City cinematic" />
            <div className="gate-film-shade" />
            <HeroCanvas />
          </>
        )}
      />
    </PageShell>
  );
}
