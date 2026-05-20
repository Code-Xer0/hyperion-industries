import { Link } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import HoverEditor from '../components/ui/HoverEditor';
import content from '../data/content.json';
import './SubPage.css';

export default function NewsletterPage() {
  return (
    <PageShell>
      <HoverEditor model="content">
        <div className="sp-placeholder">
          <div className="sp-badge">{content.newsletter.badge}</div>
          <h2>{content.newsletter.title}</h2>
          <p>{content.newsletter.desc}</p>
          <div className="sp-actions">
            <Link to="/dev-diary" className="btn btn-gold">Read Dev Diary</Link>
            <Link to="/contact" className="btn btn-ghost">Contact Hyperion</Link>
          </div>
        </div>
      </HoverEditor>
    </PageShell>
  );
}
