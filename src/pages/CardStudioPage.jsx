import { Helmet } from 'react-helmet-async';
import './CardStudioPage.css';

export default function CardStudioPage() {
  return (
    <main className="page-active card-studio-page">
      <Helmet>
        <title>Hyperion Card Studio | Hyperion Industries</title>
        <meta
          name="description"
          content="Hyperion Card Studio for composing and refining operator card layouts."
        />
      </Helmet>

      <section className="card-studio-shell shell">
        <div className="card-studio-head glass-panel">
          <div>
            <p className="card-studio-kicker">Hyperion Industries</p>
            <h1>Card Studio</h1>
          </div>
          <a
            className="btn btn-ghost card-studio-open"
            href="/card-studio/studio.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Studio ↗
          </a>
        </div>

        <div className="card-studio-frame glass-panel">
          <iframe
            title="Hyperion Card Studio"
            src="/card-studio/studio.html"
            loading="eager"
            referrerPolicy="same-origin"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads allow-modals"
          />
        </div>
      </section>
    </main>
  );
}
