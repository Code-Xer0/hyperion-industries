import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Radio } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import HeroCanvas from '../components/ui/HeroCanvas';
import OperatorMascot from '../components/portal/OperatorMascot';
import OperatorCard from '../components/cards/OperatorCard';
import RoomShell from '../components/portal/RoomShell';
import { CityMap, ForgeBuildNavigation, MaturityLegend, ProofLane, StatusRail } from '../components/portal/PortalPrimitives';
import { cityRoutes, getDistrict, getFeaturedDistricts, getStatusRailDistricts } from '../data/publicCity';
import operators from '../data/operators.json';
import './HomePage.css';

const doctrine = [
  ['Custody', 'Files, working context, and infrastructure remain under operator control.'],
  ['Continuity', 'The work should survive interruptions, handoffs, upgrades, and time.'],
  ['Authority', 'Intelligence can surface and recommend. The human operator decides.'],
];

const stations = [
  { id: 'signal', label: 'Signal' },
  { id: 'city', label: 'City' },
  { id: 'proof', label: 'Proof' },
  { id: 'operators', label: 'Operators' },
  { id: 'doctrine', label: 'Doctrine' },
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
          <p className="gate-kicker">Hyperion Industries · Soft Launch · Limited Requests</p>
          <h2>Infrastructure that remembers who holds authority.</h2>
          <p className="gate-lead">Local-first software, custom hardware, identity, and continuity systems for people who intend to keep control of the work.</p>
          <p>Victor Amani is the professional name of Kushinda Furaha Zeleke, founder and systems architect of Hyperion Industries in Minneapolis.</p>
          <p>Contracting time and project requests are currently limited. Every engagement begins with a scope and fit discussion.</p>
          <div className="room-action-row">
            <Link to="/intake" className="btn btn-gold"><Radio size={15} aria-hidden="true" />Start a signal</Link>
            <Link to="/#city" className="btn btn-ghost">Open City Map</Link>
            <a href="https://chr0nos.app" className="btn btn-ghost" target="_blank" rel="noopener noreferrer">CHR0N.OS <ArrowUpRight size={14} aria-hidden="true" /></a>
          </div>
          <StatusRail districts={statusRail} compact />
        </div>
        <div className="gate-operator" aria-label="Hyperion Operator greeting visitors">
          <OperatorMascot />
        </div>
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
    operators: (
      <div className="gate-operators-room">
        <div className="gate-room-heading">
          <div>
            <span className="city-label">Operators District</span>
            <h2>Meet the founders.</h2>
          </div>
          <div className="gate-operators-intro">
            <p>The public roster behind Hyperion's systems, operations, and deployment posture.</p>
            <Link to="/founders" className="btn btn-ghost">Open full roster</Link>
          </div>
        </div>
        <div className="gate-operators-grid">
          {operators.map((operator) => (
            <Link className="founder-link gate-operator-link" to={`/founders/${operator.slug}`} key={operator.id}>
              <span className="gate-operator-status">
                {operator.slug === 'victor-amani' ? 'FULL PUBLIC PROFILE' : 'PROFILE IN PROGRESS'}
              </span>
              <OperatorCard operator={operator} />
            </Link>
          ))}
        </div>
      </div>
    ),
    doctrine: (
      <div className="gate-doctrine-room">
        <div className="gate-room-heading">
          <div>
            <span className="city-label">Operating Doctrine</span>
            <h2>A city with rules.</h2>
          </div>
          <p>The public edge shows posture and entry points without borrowing authority from private systems.</p>
        </div>
        <div className="room-note-grid">
          {doctrine.map(([title, text], index) => (
            <article className="room-note" key={title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
        <div className="room-action-row">
          <Link to="/alignment" className="btn btn-ghost">Alignment Posture</Link>
          <Link to="/intake" className="btn btn-gold">Start a signal</Link>
        </div>
      </div>
    ),
  };

  return (
    <PageShell className="home city-gate-page">
      <Helmet>
        <title>Hyperion Industries | Local-First Intelligent Infrastructure</title>
        <meta name="description" content="Enter Hyperion City: the public map for local-first software, hardware, identity, continuity, and commercial lanes." />
        <link rel="canonical" href="https://hyperion-industries.dev/" />
        <meta property="og:title" content="Hyperion Industries | City Gate" />
        <meta property="og:description" content="Local-first intelligent infrastructure organized as a public city with clear maturity labels." />
        <meta property="og:type" content="website" />
      </Helmet>

      <RoomShell
        eyebrow="Hyperion City / Gate"
        title="City Gate"
        summary="A public edge for systems, infrastructure, identity, proof, and limited scoped inquiry."
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
