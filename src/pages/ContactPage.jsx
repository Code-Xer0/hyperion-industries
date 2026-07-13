import { ArrowUpRight, Mail } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import RoomShell from '../components/portal/RoomShell';
import content from '../data/content.json';
import './SubPage.css';

const stations = [
  { id: 'route', label: 'Route' },
  { id: 'forge', label: 'Forge' },
  { id: 'chronos', label: 'CHR0N.OS' },
  { id: 'alignment', label: 'Alignment' },
];

function MailAction({ href, children, secondary = false }) {
  return <a href={href} className={`btn btn-${secondary ? 'ghost' : 'gold'}`}><Mail size={15} aria-hidden="true" />{children}</a>;
}

export default function ContactPage() {
  const panels = {
    route: (
      <div className="room-panel-grid">
        <div className="room-panel-copy"><h2>Bring the problem. We will route the lane.</h2><p>{content.contact.instructions.desc}</p><div className="room-action-row"><MailAction href="mailto:hello@hyperion-industries.dev">Email Hyperion</MailAction></div></div>
        <div className="signal-route-list">
          <button type="button" onClick={() => { window.location.hash = 'forge'; }}><strong>Build or workstation</strong><span>Forge inquiry</span></button>
          <button type="button" onClick={() => { window.location.hash = 'chronos'; }}><strong>Archive or recovery</strong><span>CHR0N.OS public lane</span></button>
          <button type="button" onClick={() => { window.location.hash = 'alignment'; }}><strong>Partnership or program</strong><span>Alignment hall</span></button>
        </div>
      </div>
    ),
    forge: <SignalPanel title="Scope a Forge build." text="Share the workload, room, timeline, budget range, and what the machine must remain serviceable for." href="mailto:forge@hyperion-industries.dev?subject=Hyperion%20Forge%20Build%20Inquiry" action="Start Build Inquiry" />,
    chronos: (
      <div className="room-panel-grid"><div className="room-panel-copy"><h2>Enter the public archive lane.</h2><p>Downloads and the stable beta preview live on the public CHR0N.OS surface. Private archives and support context stay outside this site.</p><div className="room-action-row"><a href="https://chr0nos.app" target="_blank" rel="noopener noreferrer" className="btn btn-gold">Open CHR0N.OS <ArrowUpRight size={15} /></a><MailAction href="mailto:hello@hyperion-industries.dev?subject=CHR0N.OS%20Inquiry" secondary>Contact Support</MailAction></div></div></div>
    ),
    alignment: <SignalPanel title="Start with fit and evidence." text="Aligned funders, grant programs, strategic partners, and early customers can begin with the problem, available role, and expected next step." href="mailto:hello@hyperion-industries.dev?subject=Hyperion%20Alignment%20Inquiry" action="Open Alignment Signal" />,
  };

  return <PageShell><RoomShell eyebrow="Alignment / Contact Signal" title="Contact Signal" summary={content.contact.hero.lead} status="PUBLIC SIGNAL" tone="inquiry" stations={stations} panels={panels} defaultStation="route" /></PageShell>;
}

function SignalPanel({ title, text, href, action }) {
  return <div className="room-panel-grid"><div className="room-panel-copy"><h2>{title}</h2><p>{text}</p><div className="room-action-row"><MailAction href={href}>{action}</MailAction></div></div><div className="sp-panel"><span className="sp-label">Useful first signal</span><p>Problem · environment · timeline · budget posture · what must remain under your control.</p></div></div>;
}
