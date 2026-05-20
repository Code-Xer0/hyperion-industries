import { Link } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import './SubPage.css';

export default function StorePage() {
  return (
    <PageShell>
      <div className="sp-placeholder">
        <div className="sp-badge">Module Planned</div>
        <h2>Store</h2>
        <p>Future merch, prints, build deposits, and hardware/service products. This lane is being designed with the same care as the machines — not bolted on early.</p>
        <div className="sp-actions">
          <Link to="/forge" className="btn btn-gold">Enter the Forge</Link>
          <Link to="/contact" className="btn btn-ghost">Contact Hyperion</Link>
        </div>
      </div>
    </PageShell>
  );
}
