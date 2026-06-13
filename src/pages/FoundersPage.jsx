import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import PageShell from '../components/layout/PageShell';
import ScrollReveal from '../components/ui/ScrollReveal';
import OperatorCard from '../components/cards/OperatorCard';
import HoverEditor from '../components/ui/HoverEditor';
import operators from '../data/operators.json';
import './FoundersPage.css';

export default function FoundersPage() {
  return (
    <PageShell>
      <Helmet>
        <title>Meet the Founders — Hyperion Industries</title>
        <meta name="description" content="The founding operators behind Hyperion Industries — the people running the forge." />
      </Helmet>

      <ScrollReveal className="section" id="founders" style={{ paddingTop: '120px' }}>
        <div className="shell">
          <div className="label">Founding Operators</div>
          <div className="ops-intro" style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
            <h2 className="h2">Meet the <em>founders.</em></h2>
            <p className="body-lead">
              A small, focused team building the software, hardware, and deployment lanes behind Hyperion.
              Open a profile to go deeper.
            </p>
          </div>

          <div className="ops-grid">
            {operators.map((op, i) => (
              <HoverEditor key={op.id} model="operators" index={i}>
                <Link
                  to={`/founders/${op.slug}`}
                  className="founder-link"
                  aria-label={`Open ${op.name}'s operator dossier — full founder page`}
                >
                  <OperatorCard operator={op} />
                </Link>
              </HoverEditor>
            ))}
          </div>
        </div>
      </ScrollReveal>
    </PageShell>
  );
}
