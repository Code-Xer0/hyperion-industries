import { Helmet } from 'react-helmet-async';
import CardStudioEditor from '../features/card-studio/CardStudioEditor.jsx';
import './CardStudioPage.css';

export default function CardStudioPage({ legacy = false }) {
  if (legacy) {
    return (
      <main className="page-active card-studio-page is-legacy">
        <Helmet>
          <title>Card Studio Legacy Preview | Hyperion Industries</title>
          <meta name="description" content="Legacy Card Studio parity preview. Ordering is not available from this surface." />
          <meta name="robots" content="noindex,nofollow" />
          <link rel="canonical" href="https://hyperion-industries.dev/card-studio" />
        </Helmet>
        <section className="card-studio-legacy-shell">
          <div className="card-studio-legacy-notice" role="note">
            <div>
              <p>LEGACY PARITY ROOM · NO CHECKOUT</p>
              <h1>Archived Card Studio preview</h1>
              <span>This surface is retained temporarily for visual comparison. It does not publish profiles, create orders, or confirm shipment.</span>
            </div>
            <a className="btn btn-gold" href="/card-studio">Open native studio</a>
          </div>
          <div className="card-studio-legacy-frame">
            <iframe
              title="Legacy Hyperion Card Studio preview"
              src="/assets/card-studio/runtime.html"
              loading="lazy"
              referrerPolicy="same-origin"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads allow-modals"
            />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-active card-studio-page">
      <Helmet>
        <title>Hyperion Card Studio Preview | Smart Operator Identity</title>
        <meta
          name="description"
          content="Compose a guarded operator-card design brief with live front, back, and digital proofs. All submissions remain operator reviewed and are not quotes."
        />
        <link rel="canonical" href="https://hyperion-industries.dev/card-studio" />
      </Helmet>
      <CardStudioEditor />
    </main>
  );
}
