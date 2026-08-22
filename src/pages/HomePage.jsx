import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import HeroCanvas from '../components/ui/HeroCanvas';
import OperatorMascot from '../components/portal/OperatorMascot';
import RoomShell from '../components/portal/RoomShell';
import { CityMap, ForgeBuildNavigation, MaturityLegend, ProofLane, StatusRail } from '../components/portal/PortalPrimitives';
import { cityRoutes, getDistrict, getFeaturedDistricts, getStatusRailDistricts } from '../data/publicCity';
import { PUBLIC_DOCTRINE } from '../data/publicDoctrine';
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
      <div className="gate-signal-room">
        <div className="gate-copy">
          <p className="gate-kicker">Hyperion Industries · Public Edge · Soft Launch</p>
          <h2>{PUBLIC_DOCTRINE.headline}</h2>
          <p className="gate-lead">{PUBLIC_DOCTRINE.summary}</p>
          <p>When work crosses people, machines, records, and tools, state gets lost and authority gets blurry. Hyperion captures that break, preserves the evidence, and routes a bounded next action.</p>
          <p className="gate-principle">{PUBLIC_DOCTRINE.principle}</p>
          <div className="room-action-row">
            <Link to="/intake?source=home_signal" className="btn btn-gold">Start an Inquiry</Link>
            <Link to="/forge/configurator?source=home_signal" className="btn btn-ghost">Start a Forge Build</Link>
            <Link to="/#proof" className="btn btn-ghost">View Public Proof</Link>
          </div>
          <StatusRail districts={statusRail} compact />
        </div>
        <div className="gate-operator" aria-label="Hyperion City guide">
          <OperatorMascot />
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
          <Link to="/contact" className="btn btn-ghost">Contact Hyperion</Link>
          <a href="https://chr0nos.app" className="btn btn-ghost" target="_blank" rel="noopener noreferrer">CHR0N.OS <ArrowUpRight size={14} aria-hidden="true" /></a>
        </div>
      </div>
    ),
  };

  return (
    <PageShell className="home city-gate-page">
      <Helmet>
        <title>Hyperion Industries | Continuity Infrastructure</title>
        <meta name="description" content="Hyperion builds continuity infrastructure that preserves state, provenance, context, and human authority across fragmented operations." />
        <link rel="canonical" href="https://hyperion-industries.dev/" />
        <meta property="og:title" content="Hyperion Industries | Continuity Infrastructure" />
        <meta property="og:description" content="Governed, local-first systems that preserve state and route action without borrowing operator authority." />
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
            <video className="gate-film" src="/assets/city/hyperion-city-mark.mp4" autoPlay muted loop playsInline preload="metadata" />
            <video className="gate-brand-film" src="/assets/city/hyperion-logo-sequence.mp4" autoPlay muted loop playsInline preload="metadata" />
            <div className="gate-film-shade" />
            <HeroCanvas />
          </>
        )}
      />
    </PageShell>
  );
}
