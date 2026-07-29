import { Link } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import RoomShell from '../components/portal/RoomShell';
import content from '../../site-content/collections/content.json';
import './SubPage.css';

export default function NewsletterPage() {
  const panels = {
    status: <PosturePanel title={content.newsletter.title} text={content.newsletter.desc} />,
    diary: <PosturePanel title="Read the public build record." text="Current shipping posture, next work, and known gaps remain visible in the Development Diary." action={<Link to="/dev-diary" className="btn btn-gold">Open Dev Diary</Link>} />,
    contact: <PosturePanel title="Need a direct signal?" text="The contact room routes product, build, and alignment inquiries without collecting credentials or private records." action={<Link to="/contact" className="btn btn-gold">Contact Hyperion</Link>} />,
  };
  return <PageShell><RoomShell eyebrow="Public Utility / Newsletter" title="Newsletter" summary="A staged communications lane, not a fake subscription surface." status="STAGED" tone="concept" stations={[{ id: 'status', label: 'Status' }, { id: 'diary', label: 'Diary' }, { id: 'contact', label: 'Contact' }]} panels={panels} defaultStation="status" /></PageShell>;
}

function PosturePanel({ title, text, action }) {
  return <div className="room-panel-grid"><div className="room-panel-copy"><span className="sp-label">Manual update required</span><h2>{title}</h2><p>{text}</p>{action && <div className="room-action-row">{action}</div>}</div></div>;
}
