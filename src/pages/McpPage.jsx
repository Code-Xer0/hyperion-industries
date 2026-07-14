import { ArrowUpRight, Braces, LockKeyhole, Radar, Route, Send } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import './McpPage.css';

const endpoint = 'https://mcp.hyperion-industries.dev/mcp';

const resources = [
  'hyperion://company',
  'hyperion://routes',
  'hyperion://route/{routeId}',
  'hyperion://offerings',
  'hyperion://offering/{offeringId}',
  'hyperion://identities',
  'hyperion://intake-contract',
  'hyperion://corpus/{entryId}',
];

const tools = [
  ['search_hyperion', 'Search the approved public corpus and canonical routes.'],
  ['get_public_route', 'Resolve one canonical public route and its maturity.'],
  ['list_offerings', 'List truthful offerings and current availability.'],
  ['resolve_public_identity', 'Resolve approved public identity relationships.'],
  ['evaluate_intake', 'Evaluate a proposed intake payload without submitting it.'],
  ['prepare_intake_submission', 'Validate and return a redacted review plus a ten-minute confirmation token.'],
  ['submit_intake', 'Submit only after exact-payload confirmation and explicit client review.'],
  ['request_intake_resume', 'Request the existing magic-link continuation flow; drafts are never returned through MCP.'],
];

export default function McpPage() {
  return (
    <PageShell>
      <main className="mcp-page">
        <header className="mcp-hero">
          <div className="mcp-kicker"><Radar size={15} /> PUBLIC RETRIEVAL / MCP 0.1.0</div>
          <h1>Hyperion, resolved<br /><em>without the private substrate.</em></h1>
          <p>Connect an MCP client to Hyperion's approved public corpus, canonical route graph, offerings, identity spine, and governed intake boundary.</p>
          <div className="mcp-endpoint"><code>{endpoint}</code><a href="https://mcp.hyperion-industries.dev/server.json" target="_blank" rel="noreferrer">server.json <ArrowUpRight size={14} /></a></div>
          <div className="mcp-status"><span>SOFT LAUNCH</span><span>UNLISTED</span><span>ANONYMOUS DISCOVERY</span><span>OPERATOR-REVIEWED INTAKE</span></div>
        </header>

        <section className="mcp-section mcp-grid">
          <article className="mcp-card"><LockKeyhole /><h2>Custody boundary</h2><p>The server cannot browse the web, call a language model, sample private systems, read source, inspect telemetry, or retrieve saved drafts. Search is deterministic and bound to the versioned public projection.</p></article>
          <article className="mcp-card"><Route /><h2>One public topology</h2><p>The site manifest, <code>llms.txt</code>, MCP resources, and search index are generated from the same allow-listed projection. Internal source paths and implementation metadata never enter the public artifact.</p></article>
          <article className="mcp-card"><Send /><h2>Two-step intake</h2><p>Preparation validates the payload and returns a redacted review. Submission requires explicit consent, <code>client_reviewed</code>, the exact payload hash, and a short-lived confirmation token.</p></article>
        </section>

        <section className="mcp-section">
          <div className="mcp-section-head"><span>01</span><div><h2>Connect manually</h2><p>Use the single Streamable HTTP endpoint in clients that accept remote MCP servers.</p></div></div>
          <div className="mcp-code-grid">
            <pre><code>{`# Codex / compatible client\nname: hyperion-public\nurl: ${endpoint}`}</code></pre>
            <pre><code>{`# Claude / compatible client\nTransport: Streamable HTTP\nEndpoint: ${endpoint}`}</code></pre>
          </div>
          <p className="mcp-note">Client configuration syntax varies by release. No API key is required for public discovery. Intake remains rate-limited and operator-reviewed.</p>
        </section>

        <section className="mcp-section mcp-catalog">
          <div><div className="mcp-section-head"><span>02</span><div><h2>Resources</h2><p>Canonical public objects with stable Hyperion URIs.</p></div></div><ul>{resources.map((resource) => <li key={resource}><Braces size={14} /><code>{resource}</code></li>)}</ul></div>
          <div><div className="mcp-section-head"><span>03</span><div><h2>Tools</h2><p>Four retrieval tools and four governed intake tools.</p></div></div><ul>{tools.map(([name, description]) => <li key={name}><strong><code>{name}</code></strong><span>{description}</span></li>)}</ul></div>
        </section>

        <section className="mcp-section mcp-final">
          <p>Connection to the public MCP does not create a contract, guarantee acceptance, or imply a response time.</p>
          <div><a className="btn btn-gold" href="/intake">Open governed intake</a><a className="btn btn-ghost" href="/contact">Discuss scope</a></div>
        </section>
      </main>
    </PageShell>
  );
}
