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
            <Link to="/intake" className="btn btn-gold">Start an Assessment</Link>
            <Link to="/forge/configurator" className="btn btn-ghost">Start a Forge Build</Link>
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
        <div className="room-note-grid">
          <article className="room-note"><span>01 · ASSESS</span><h3>Continuity assessment</h3><p>Map the state, handoff, records, and recurring friction that must survive interruption.</p><Link to="/intake/continuity">Open continuity intake</Link></article>
          <article className="room-note"><span>02 · BUILD</span><h3>Forge systems</h3><p>Turn a workload, room, budget posture, and service horizon into an operator-reviewed machine brief.</p><Link to="/forge/configurator">Meet the Forge Concierge</Link></article>
          <article className="room-note"><span>03 · IDENTITY</span><h3>Operator identity</h3><p>Design a bounded physical and digital trust surface without assuming publication or production.</p><Link to="/card-studio">Open Card Studio</Link></article>
        </div>
        <div className="room-action-row">
          <Link to="/intake" className="btn btn-gold">Choose an Intake Lane</Link>
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
