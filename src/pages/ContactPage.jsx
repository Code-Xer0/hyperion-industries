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
  { id: 'pandora', label: 'Pandora' },
  { id: 'identity', label: 'Identity' },
  { id: 'alignment', label: 'Alignment' },
  { id: 'support', label: 'Support' },
  { id: 'general', label: 'General' },
];

function MailAction({ href, children, secondary = false }) {
  return <a href={href} className={`btn btn-${secondary ? 'ghost' : 'gold'}`}><Mail size={15} aria-hidden="true" />{children}</a>;
}

export default function ContactPage() {
  const panels = {
    route: (
      <div className="room-panel-grid">
        <div className="room-panel-copy"><h2>Start with the failure, not the stack.</h2><p>Hyperion is accepting a limited number of assessment, build, identity, support, and scoped systems requests. A submitted signal begins review; it does not create a quote, contract, deployment, or access grant.</p><p>{content.contact.instructions.desc}</p><div className="room-action-row"><Link to="/intake?source=contact_route" className="btn btn-gold">Choose an Intake Lane</Link><MailAction href="mailto:hello@hyperion-industries.dev" secondary>Email Hyperion</MailAction></div></div>
        <div className="signal-route-list">
          <button type="button" onClick={() => { window.location.hash = 'continuity'; }}><strong>State or handoff keeps breaking</strong><span>Continuity assessment</span></button>
          <button type="button" onClick={() => { window.location.hash = 'forge'; }}><strong>Build or workstation</strong><span>Forge inquiry</span></button>
          <button type="button" onClick={() => { window.location.hash = 'pandora'; }}><strong>Rack, site, or infrastructure readiness</strong><span>Pandora review</span></button>
          <button type="button" onClick={() => { window.location.hash = 'identity'; }}><strong>Identity or trust surface</strong><span>Operator Identity</span></button>
          <button type="button" onClick={() => { window.location.hash = 'alignment'; }}><strong>Partnership or program</strong><span>Alignment hall</span></button>
          <button type="button" onClick={() => { window.location.hash = 'support'; }}><strong>Existing work needs attention</strong><span>Support triage</span></button>
          <button type="button" onClick={() => { window.location.hash = 'general'; }}><strong>None of these fit yet</strong><span>Manual routing</span></button>
        </div>
      </div>
    ),
    continuity: <SignalPanel title="Capture the continuity failure." text="Map what is being lost, where handoffs break, which evidence exists, and what must remain under your control. The first output is a reviewable brief, not an automation promise." to="/intake/continuity?source=contact_continuity" action="Start Continuity Assessment" />,
    forge: <SignalPanel title="Scope a Forge build." text="Share the workload, room, timeline, budget range, and what the machine must remain serviceable for." to="/forge/configurator?source=contact_forge" action="Open Forge Configurator" />,
    pandora: <SignalPanel title="Check infrastructure readiness." text="Document site control, power, network, workload, sponsor, and regulated-environment constraints before hardware or deployment scope is proposed." to="/intake/pandora?source=contact_pandora" action="Start Pandora Review" />,
    identity: <SignalPanel title="Define the trust surface." text="Describe who or what the card represents, the approved contact posture, the physical environment, and whether publication, NFC production, or both should be reviewed." to="/intake/operator-identity?source=contact_identity" action="Start Identity Intake" />,
    alignment: <SignalPanel title="Start with fit and evidence." text="Aligned funders, grant programs, strategic partners, and early customers can begin with a narrow problem, their available role, and a useful first step." to="/intake/relationships?source=contact_relationships" action="Open Alignment Intake" />,
    support: <SignalPanel title="Route an active issue safely." text="Name the affected Hyperion surface and the current impact without sending credentials, private logs, personal data, or exploit details." to="/intake/support?source=contact_support" action="Open Support Intake" />,
    general: <SignalPanel title="Preserve the signal." text="If no specialist lane fits yet, describe the outcome and a useful next step. The operator will route the original signal without inventing certainty." to="/intake/general?source=contact_general" action="Open General Intake" />,
  };

  return <PageShell><RoomShell eyebrow="Assessment / Contact" title="Start Here" summary={`${content.contact.hero.lead} Limited requests are reviewed only after scope and fit are understood.`} status="PUBLIC INTAKE · OPERATOR REVIEW" tone="inquiry" stations={stations} panels={panels} defaultStation="route" /></PageShell>;
}

function SignalPanel({ title, text, href, to, action }) {
  return <div className="room-panel-grid"><div className="room-panel-copy"><h2>{title}</h2><p>{text}</p><div className="room-action-row">{to ? <Link to={to} className="btn btn-gold">{action}</Link> : <MailAction href={href}>{action}</MailAction>}</div></div><div className="sp-panel"><span className="sp-label">Useful first signal</span><p>Problem · environment · timeline · budget posture · what must remain under your control.</p></div></div>;
}
