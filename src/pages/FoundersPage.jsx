import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import PageShell from '../components/layout/PageShell';
import RoomShell from '../components/portal/RoomShell';
import OperatorCard from '../components/cards/OperatorCard';
import HoverEditor from '../components/ui/HoverEditor';
import operators from '../../site-content/collections/operators.json';
import './FoundersPage.css';

export default function FoundersPage() {
  const panels = {
    roster: (
      <div className="founders-room-roster">
        <img
          className="founders-cross-signal"
          src="/assets/operators/founders-cross-signal.jpeg"
          alt=""
          aria-hidden="true"
        />
        <div className="ops-intro">
          <span className="label">Founding Operators</span>
          <h2 className="h2">Meet the <em>founders.</em></h2>
          <p className="body-lead">A small, focused team building the software, hardware, and deployment lanes behind Hyperion.</p>
        </div>
        <div className="ops-grid">
          {operators.map((op, i) => (
            <HoverEditor key={op.id} model="operators" index={i}>
              <Link to={`/founders/${op.slug}`} className="founder-link" aria-label={`Open ${op.name}'s operator profile`}>
                <span className="dossier-chip">
                  {op.slug === 'victor-amani' ? 'Full public profile' : 'Profile in progress'}
                </span>
                <OperatorCard operator={op} />
              </Link>
            </HoverEditor>
          ))}
        </div>
      </div>
    ),
    doctrine: (
      <div className="room-note-grid">
        <article className="room-note"><span>01</span><h3>Custody</h3><p>Public profiles describe responsibility without exposing private records or operator controls.</p></article>
        <article className="room-note"><span>02</span><h3>Continuity</h3><p>The company is being built around durable handoff, records, and systems that survive interruption.</p></article>
        <article className="room-note"><span>03</span><h3>Authority</h3><p>Intelligence may support the work. People remain accountable for decisions and outcomes.</p></article>
      </div>
    ),
    contact: (
      <div className="room-panel-grid"><div className="room-panel-copy"><h2>Route the conversation through the work.</h2><p>Use the public Contact Signal for product, build, partnership, grant-program, or early-customer conversations.</p><div className="room-action-row"><Link to="/contact" className="btn btn-gold">Send a Signal</Link></div></div></div>
    ),
  };

  return (
    <PageShell>
      <Helmet>
        <title>Meet the Founders — Hyperion Industries</title>
        <meta name="description" content="The founding operators behind Hyperion Industries — the people running the forge." />
        <link rel="canonical" href="https://hyperion-industries.dev/founders" />
        <meta property="og:title" content="Meet the Founders — Hyperion Industries" />
        <meta property="og:description" content="The founding operators behind Hyperion Industries." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://hyperion-industries.dev/founders" />
      </Helmet>

      <RoomShell
        eyebrow="Operators District / Public Roster"
        title="Founding Operators"
        summary="The people accountable for Hyperion's public systems, fabrication, and operating posture."
        status="PUBLIC PROFILES"
        tone="map"
        stations={[{ id: 'roster', label: 'Roster' }, { id: 'doctrine', label: 'Doctrine' }, { id: 'contact', label: 'Contact' }]}
        panels={panels}
        defaultStation="roster"
        className="founders-room-shell"
      />
    </PageShell>
  );
}
