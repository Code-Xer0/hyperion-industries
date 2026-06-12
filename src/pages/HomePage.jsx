import { Link } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import DestinationCard from '../components/cards/DestinationCard';
import SystemCard from '../components/cards/SystemCard';
import destinations from '../data/destinations.json';
import systems from '../data/systems.json';
import './HomePage.css';
import HeroCanvas from '../components/ui/HeroCanvas';
import ScrollReveal from '../components/ui/ScrollReveal';
import OperatorCard from '../components/cards/OperatorCard';
import operators from '../data/operators.json';
import content from '../data/content.json';
import { Helmet } from 'react-helmet-async';
import HoverEditor from '../components/ui/HoverEditor';
import { useTheme } from '../context/ThemeContext';
import './FoundersPage.css';

export default function HomePage() {
  const { brandMark } = useTheme();

  return (
    <PageShell className="home">
      <Helmet>
        <title>Hyperion Industries | Local-first intelligence infrastructure</title>
        <meta name="description" content="Hyperion Industries builds local-first tools and custom systems for people who need custody, continuity, and control." />
      </Helmet>

      {/* ── HERO ── */}
      <section className="home-hero">
        <HeroCanvas />
        <div className="shell">
          <HoverEditor model="content">
            <div className="hero-grid">
              <div className="hero-copy">
                <div className="hero-eyebrow">{content.home.hero.eyebrow}</div>
                <h1 className="hero-h1">
                  <span className="l1">{content.home.hero.l1}</span>
                  <span className="l2">{content.home.hero.l2}</span>
                  <span className="l3">{content.home.hero.l3}</span>
                </h1>
                <p className="hero-sub">{content.home.hero.sub}</p>
                <div className="hero-ctas">
                  <a href="https://chr0nos.app" className="btn btn-gold" target="_blank" rel="noopener noreferrer">Explore CHR0N.OS →</a>
                  <Link to="/systems" className="btn btn-ghost">View all systems</Link>
                </div>
                <div className="hero-chips">
                  <div className="chip"><span className="chip-name c">Kosm.OS</span><span className="chip-status">Architecture</span></div>
                  <div className="chip"><span className="chip-name r">Chron.OS</span><span className="chip-status">Stable beta</span></div>
                  <div className="chip"><span className="chip-name p">Log.OS</span><span className="chip-status">Concept</span></div>
                  <div className="chip"><span className="chip-name g">Mnem.OS</span><span className="chip-status">Building</span></div>
                </div>
              </div>
              <div className="hero-visual">
                <img src={brandMark} alt="Hyperion Industries" className="hero-lockup" />
              </div>
            </div>
          </HoverEditor>
        </div>
      </section>

      {/* ── ENTRY DECK ── */}
      <ScrollReveal className="entry-deck section">
        <div className="shell">
          <div className="entry-head">
            <div>
              <div className="label">Ecosystem routing</div>
              <h2 className="h2">Choose your entry point.</h2>
            </div>
            <p className="body-lead">Hyperion is more than one product. Enter through software, hardware, research, builds, or the forge.</p>
          </div>
          <div className="entry-grid">
            {destinations.map((d, i) => (
              <DestinationCard key={d.id} {...d} index={i} />
            ))}
          </div>
        </div>
      </ScrollReveal>

      <hr className="divider" />

      {/* ── WHAT WE BUILD ── */}
      <ScrollReveal className="section section-alt">
        <div className="shell">
          <HoverEditor model="content">
            <div className="label">What Hyperion Builds</div>
            <div className="wtb-grid">
              <div>
                <h2 className="h2">{content.home.wtb.titlePart1} <em>{content.home.wtb.titlePart2}</em></h2>
                <div className="wtb-copy">
                  <p>{content.home.wtb.p1}</p>
                  <p>{content.home.wtb.p2}</p>
                </div>
              </div>
              <div className="wtb-pillars">
                {[
                  { n: '01', title: 'Local-first, always', desc: 'Your data never leaves your machine unless you choose. No accounts required. No passive collection. No egress.' },
                  { n: '02', title: 'Full user custody', desc: 'You hold the originals, the index, and the provenance chain — on hardware you own and control.' },
                  { n: '03', title: 'Human-governed AI', desc: 'AI that surfaces and suggests. Never acts without your approval. Governance is built in, not bolted on.' },
                  { n: '04', title: 'Public demos. Protected source.', desc: 'Public previews and downloads are visible while source remains protected as the systems mature.' },
                ].map(p => (
                  <div key={p.n} className="pillar">
                    <span className="pillar-icon">{p.n}</span>
                    <div className="pillar-content"><strong>{p.title}</strong><span>{p.desc}</span></div>
                  </div>
                ))}
              </div>
            </div>
          </HoverEditor>
        </div>
      </ScrollReveal>

      <hr className="divider" />

      {/* ── SYSTEMS ── */}
      <ScrollReveal className="section">
        <div className="shell">
          <div className="label">Current Systems</div>
          <div className="systems-intro">
            <h2 className="h2">The Hyperion stack.</h2>
            <p className="body-lead">Live product, staged engines, and hardware lanes. The stack is built to keep useful intelligence close to the people who own the work.</p>
          </div>
          <div className="systems-stack">
            {systems.slice(0, 3).map((sys, i) => (
              <HoverEditor key={sys.id} model="systems" index={i}>
                <SystemCard system={sys} />
              </HoverEditor>
            ))}
          </div>
          <div className="systems-more">
            <Link to="/systems" className="btn btn-ghost">View All Systems →</Link>
          </div>
        </div>
      </ScrollReveal>

      <hr className="divider" />

      {/* ── FORGE PREVIEW ── */}
      <ScrollReveal className="section section-alt">
        <div className="shell">
          <HoverEditor model="content">
            <div className="label">Hyperion Systems · Custom Builds</div>
            <div className="forge-preview-grid">
              <div>
                <h2 className="h2">{content.home.forgePreview.titlePart1}<br /><em>{content.home.forgePreview.titlePart2}</em></h2>
                <p className="forge-desc">{content.home.forgePreview.desc}</p>
                <div className="forge-ctas">
                  <Link to="/forge" className="btn btn-gold">Enter the Forge →</Link>
                  <Link to="/build-archive" className="btn btn-ghost">View Build Archive</Link>
                </div>
              </div>
              <div className="forge-stats">
                <div className="bstat"><span className="bstat-n">3+</span><span className="bstat-l">Years building</span></div>
                <div className="bstat"><span className="bstat-n">100%</span><span className="bstat-l">Built by hand</span></div>
                <div className="bstat"><span className="bstat-n">∞</span><span className="bstat-l">Configurations</span></div>
              </div>
            </div>
          </HoverEditor>
        </div>
      </ScrollReveal>

      <hr className="divider" />

      {/* ── DOCTRINE ── */}
      <ScrollReveal className="section" id="doctrine">
        <div className="shell">
          <HoverEditor model="content">
            <div className="label">Operating Principles</div>
            <div className="doctrine-wrap">
              <div>
                <h2 className="h2">{content.home.doctrine.titlePart1}<br />{content.home.doctrine.titlePart2}</h2>
                <div className="doctrine-copy">
                  <p>{content.home.doctrine.p1}</p>
                  <p>{content.home.doctrine.p2}</p>
                </div>
                <div className="doctrine-quote">
                  <blockquote>{content.home.doctrine.quote}</blockquote>
                  <cite>{content.home.doctrine.cite}</cite>
                </div>
              </div>
              <div className="doctrine-tenets">
                <div className="dt"><span className="dt-arrow">→</span><span className="dt-text"><strong>Custody first.</strong> Originals, indexes, and working context stay under user control.</span></div>
                <div className="dt"><span className="dt-arrow">→</span><span className="dt-text"><strong>Provenance stays visible.</strong> The system should remember where things came from.</span></div>
                <div className="dt"><span className="dt-arrow">→</span><span className="dt-text"><strong>Human-directed AI.</strong> AI surfaces and suggests. You approve the moves.</span></div>
                <div className="dt"><span className="dt-arrow">→</span><span className="dt-text"><strong>Built for real work.</strong> Legal files, research, client records, media, builds, and long-running projects.</span></div>
                <div className="dt"><span className="dt-arrow">→</span><span className="dt-text"><strong>Public previews. Protected source.</strong> Downloads and demos can be visible without exposing internal code too early.</span></div>
                <div className="dt"><span className="dt-arrow">→</span><span className="dt-text"><strong>Clear exits.</strong> Useful systems should respect the files, hardware, and workflows people already own.</span></div>
              </div>
            </div>
          </HoverEditor>
        </div>
      </ScrollReveal>

      <hr className="divider" />

      {/* ── FOUNDING OPERATORS ── */}
      <ScrollReveal className="section" id="operators" style={{ background: 'var(--bg-soft)' }}>
        <div className="shell">
          <div className="label">Founding Operators</div>
          <div className="ops-intro" style={{ textAlign: 'center', maxWidth: '560px', margin: '0 auto' }}>
            <h2 className="h2">The people running<br />the <em>forge.</em></h2>
            <p className="body-lead">A small, focused team building the software, hardware, and deployment lanes behind Hyperion.</p>
          </div>

          <div className="ops-grid">
            {operators.map((op, i) => (
              <HoverEditor key={op.id} model="operators" index={i}>
                <Link
                  to={`/founders/${op.slug}`}
                  className="founder-link"
                  aria-label={`Open ${op.name}'s operator dossier — full founder page`}
                >
                  <span className="dossier-chip" aria-hidden="true">Open dossier <span className="ar">→</span></span>
                  <OperatorCard operator={op} />
                  <div className="dossier-cta">
                    <span>⌖</span> Open operator dossier <span className="ar">→</span>
                  </div>
                </Link>
              </HoverEditor>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '36px' }}>
            <Link to="/founders" className="btn btn-ghost">Meet the Founders →</Link>
          </div>
        </div>
      </ScrollReveal>
    </PageShell>
  );
}
