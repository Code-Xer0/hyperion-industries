import { Link } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import RoomShell from '../components/portal/RoomShell';
import content from '../data/content.json';
import './SubPage.css';

export default function StorePage() {
  const panels = {
    status: <StorePanel title={content.store.title} text={content.store.desc} label="No public checkout" />,
    forge: <StorePanel title="Machines begin with the workload." text="Custom workstations, local-AI systems, and focused upgrades remain scoped by inquiry." action={<Link to="/forge" className="btn btn-gold">Enter the Forge</Link>} />,
    identity: <StorePanel title="Operator Identity is shipping." text="NFC cards and public operator surfaces remain available through the finished Card Studio lane." action={<Link to="/card-studio" className="btn btn-gold">Open Card Studio</Link>} />,
    contact: <StorePanel title="Route a serious request." text="Use the Contact Signal for build, identity, support, or alignment inquiries." action={<Link to="/contact" className="btn btn-gold">Contact Hyperion</Link>} />,
  };
  return <PageShell><RoomShell eyebrow="Public Utility / Store" title="Store" summary="Available lanes without invented inventory, payment capture, or checkout posture." status="STAGED · NO CHECKOUT" tone="concept" stations={[{ id: 'status', label: 'Status' }, { id: 'forge', label: 'Forge' }, { id: 'identity', label: 'Identity' }, { id: 'contact', label: 'Contact' }]} panels={panels} defaultStation="status" /></PageShell>;
}

function StorePanel({ title, text, label = 'By inquiry', action }) {
  return <div className="room-panel-grid"><div className="room-panel-copy"><span className="sp-label">{label}</span><h2>{title}</h2><p>{text}</p>{action && <div className="room-action-row">{action}</div>}</div></div>;
}
