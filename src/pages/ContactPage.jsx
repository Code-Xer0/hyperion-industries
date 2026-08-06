import { Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import RoomShell from '../components/portal/RoomShell';
import content from '../../site-content/collections/content.json';
import './SubPage.css';

const stations = [
  { id: 'route', label: 'Route' },
  { id: 'continuity', label: 'Continuity' },
  { id: 'forge', label: 'Forge' },
  { id: 'identity', label: 'Identity' },
  { id: 'alignment', label: 'Alignment' },
];

function MailAction({ href, children, secondary = false }) {
  return <a href={href} className={`btn btn-${secondary ? 'ghost' : 'gold'}`}><Mail size={15} aria-hidden="true" />{children}</a>;
}

export default function ContactPage() {
  const panels = {
    route: (
      <div className="room-panel-grid">
        <div className="room-panel-copy"><h2>Start with the failure, not the stack.</h2><p>Hyperion is accepting a limited number of assessment, build, identity, support, and scoped systems requests. A submitted signal begins review; it does not create a quote, contract, deployment, or access grant.</p><p>{content.contact.instructions.desc}</p><div className="room-action-row"><Link to="/intake" className="btn btn-gold">Choose an Intake Lane</Link><MailAction href="mailto:hello@hyperion-industries.dev" secondary>Email Hyperion</MailAction></div></div>
        <div className="signal-route-list">
          <button type="button" onClick={() => { window.location.hash = 'continuity'; }}><strong>State or handoff keeps breaking</strong><span>Continuity assessment</span></button>
          <button type="button" onClick={() => { window.location.hash = 'forge'; }}><strong>Build or workstation</strong><span>Forge inquiry</span></button>
          <button type="button" onClick={() => { window.location.hash = 'identity'; }}><strong>Identity or trust surface</strong><span>Operator Identity</span></button>
          <button type="button" onClick={() => { window.location.hash = 'alignment'; }}><strong>Partnership or program</strong><span>Alignment hall</span></button>
        </div>
      </div>
    ),
    continuity: <SignalPanel title="Capture the continuity failure." text="Map what is being lost, where handoffs break, which evidence exists, and what must remain under your control. The first output is a reviewable brief, not an automation promise." to="/intake/continuity" action="Start Continuity Assessment" />,
    forge: <SignalPanel title="Scope a Forge build." text="Share the workload, room, timeline, budget range, and what the machine must remain serviceable for." to="/forge/configurator" action="Open Forge Configurator" />,
    identity: <SignalPanel title="Define the trust surface." text="Describe who or what the card represents, the approved contact posture, the physical environment, and whether publication, NFC production, or both should be reviewed." to="/intake/operator-identity" action="Start Identity Intake" />,
    alignment: <SignalPanel title="Start with fit and evidence." text="Aligned funders, grant programs, strategic partners, and early customers can begin with a narrow problem, their available role, and a useful first step." to="/intake/relationships" action="Open Alignment Intake" />,
  };

  return <PageShell><RoomShell eyebrow="Assessment / Contact" title="Start Here" summary={`${content.contact.hero.lead} Limited requests are reviewed only after scope and fit are understood.`} status="PUBLIC INTAKE · OPERATOR REVIEW" tone="inquiry" stations={stations} panels={panels} defaultStation="route" /></PageShell>;
}

function SignalPanel({ title, text, href, to, action }) {
  return <div className="room-panel-grid"><div className="room-panel-copy"><h2>{title}</h2><p>{text}</p><div className="room-action-row">{to ? <Link to={to} className="btn btn-gold">{action}</Link> : <MailAction href={href}>{action}</MailAction>}</div></div><div className="sp-panel"><span className="sp-label">Useful first signal</span><p>Problem · environment · timeline · budget posture · what must remain under your control.</p></div></div>;
}
