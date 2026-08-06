import { CARD_ARTIFACT_CATALOG, CARD_TEMPLATE_CATALOG } from '../../shared/card-studio/studio-catalog.js';
import { CARD_TEMPLATES } from '../features/card-studio/cardStudioModel.js';

export default function CardStudioSpecimensPage() {
  return (
    <main style={{ minHeight: '100vh', padding: '100px 24px', background: '#07090c', color: '#fff' }}>
      <header style={{ maxWidth: 1480, margin: '0 auto 30px' }}>
        <p style={{ color: '#ffc72c', fontFamily: 'var(--font-display)', fontSize: 9 }}>DEVELOPMENT ONLY · CLAUDE DESIGN REVIEW MATRIX</p>
        <h1 style={{ fontSize: 48, margin: '8px 0' }}>Card Studio specimens</h1>
        <p>{CARD_TEMPLATE_CATALOG.items.length} templates · {CARD_ARTIFACT_CATALOG.items.length} artifacts · excluded from production routing</p>
      </header>
      <section style={{ maxWidth: 1480, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 14 }}>
        {CARD_TEMPLATES.map((template) => (
          <article key={template.id} style={{ border: '1px solid rgba(255,255,255,.15)', padding: 12, background: '#0d1014' }}>
            <div style={{ aspectRatio: '1.586', padding: '10%', background: template.surface, color: template.ink, borderTop: `4px solid ${template.tone}` }}>
              <small style={{ color: template.tone }}>{template.lane.toUpperCase()}</small>
              <h2 style={{ margin: '14% 0 4px' }}>{template.name}</h2>
              <p style={{ fontSize: 10 }}>Front · Back · Digital proof target</p>
            </div>
            <pre style={{ overflow: 'auto', color: '#8f969d', fontSize: 9 }}>{JSON.stringify(template.starter_artifacts, null, 2)}</pre>
          </article>
        ))}
      </section>
    </main>
  );
}
