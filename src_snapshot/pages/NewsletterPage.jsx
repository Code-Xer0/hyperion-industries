import { Link } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import './SubPage.css';

export default function NewsletterPage() {
  return (
    <PageShell>
      <div className="sp-placeholder">
        <div className="sp-badge">Signal Pending</div>
        <h2>Newsletter</h2>
        <p>Release notes, build drops, and product updates when the signal goes live. The broadcast system is being staged — not rushed.</p>
        <div className="sp-actions">
          <Link to="/dev-diary" className="btn btn-gold">Read Dev Diary</Link>
          <Link to="/contact" className="btn btn-ghost">Contact Hyperion</Link>
        </div>
      </div>
    </PageShell>
  );
}
