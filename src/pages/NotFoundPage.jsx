import { Link } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';

export default function NotFoundPage() {
  return (
    <PageShell>
      <main className="shell" style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <section>
          <p className="eyebrow">PUBLIC ROUTE / 404</p>
          <h1>That route is not in the public city.</h1>
          <p>The address may be stale, private, or outside the approved public topology.</p>
          <div className="room-action-row" style={{ justifyContent: 'center' }}>
            <Link className="btn btn-gold" to="/">Return to City Gate</Link>
            <Link className="btn btn-ghost" to="/intake">Open Intake</Link>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
