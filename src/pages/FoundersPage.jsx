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
        <article className="room-note"><span>01 · SOURCE</span><h3>Facts stay attributable.</h3><p>Public profiles describe company responsibility without exposing private records, source, or operator controls.</p></article>
        <article className="room-note"><span>02 · CONTEXT</span><h3>Roles stay bounded.</h3><p>Each operator profile names a public responsibility without turning one person into the whole company.</p></article>
        <article className="room-note"><span>03 · AUTHORITY</span><h3>Accountability stays human.</h3><p>Intelligence may support the work. People remain accountable for decisions, approvals, and outcomes.</p></article>
      </div>
    ),
    contact: (
      <div className="room-panel-grid"><div className="room-panel-copy"><h2>Route the conversation through the work.</h2><p>Start with the continuity failure, workload, trust surface, support issue, or relationship question. The company intake will route it to the right operator.</p><div className="room-action-row"><Link to="/intake" className="btn btn-gold">Start an Assessment</Link></div></div></div>
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
