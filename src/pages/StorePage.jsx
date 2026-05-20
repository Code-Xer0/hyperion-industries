import { Link } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import HoverEditor from '../components/ui/HoverEditor';
import content from '../data/content.json';
import './SubPage.css';

export default function StorePage() {
  return (
    <PageShell>
      <HoverEditor model="content">
        <div className="sp-placeholder">
          <div className="sp-badge">{content.store.badge}</div>
          <h2>{content.store.title}</h2>
          <p>{content.store.desc}</p>
          <div className="sp-actions">
            <Link to="/forge" className="btn btn-gold">Enter the Forge</Link>
            <Link to="/contact" className="btn btn-ghost">Contact Hyperion</Link>
          </div>
        </div>
      </HoverEditor>
    </PageShell>
  );
}
