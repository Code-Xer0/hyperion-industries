import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import operators from '../../site-content/collections/operators.json';
import radioTracks from '../../site-content/collections/radio.json';
import GravityLattice from '../components/ui/GravityLattice';
import SingularityBackground from '../components/ui/SingularityBackground';
import { RadioProvider } from '../components/radio/RadioContext';
import RadioConsole from '../components/radio/RadioConsole';
import MiniPlayer from '../components/radio/MiniPlayer';
import TweaksPanel from '../components/radio/TweaksPanel';
import { track as logEvent } from '../utils/telemetry';
import { initPointerFx } from '../utils/pointerFx';
import './FounderPage.css';

/* Ambient background = the SAME particle lattice as the main site, recolored
   to the operator accent (red by default; follows the Tweaks accent). Mounted
   inside .founder-page above its opaque base, screen-blended. */
const hexToRgbStr = (hex) => {
  const h = (hex || '#FF2E2E').replace('#', '');
  return `${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)}`;
};
const PARTICLE_STYLE = { zIndex: 56, mixBlendMode: 'screen' };

const A = (f) => `/assets/founder/${f}`;
const MARK = '/assets/founder/hyperion-mark.svg';
const SUBSTACK = 'https://victoramani.substack.com/';

const TW_KEY = 'hyperion_founder_tweaks';
// "lattice" now renders gravity WELLS only (the wire-grid is gone for good —
// operator directive); wells default on. Card float + grain stay on.
const DEFAULT_TWEAKS = { accent: 'red', amb: 100, cards: 'float', grain: true, lattice: true, portrait: true };
const ACCENTS = {
  red:     { a: '#E10000', b: '#FF2E2E', dim: 'rgba(225,0,0,0.14)',   muted: 'rgba(225,0,0,0.06)',   glow: 'rgba(225,0,0,0.28)',   bd: 'rgba(225,0,0,0.30)', bd2: 'rgba(225,0,0,0.55)' },
  gold:    { a: '#D4AF37', b: '#F0C94A', dim: 'rgba(212,175,55,0.16)', muted: 'rgba(212,175,55,0.07)', glow: 'rgba(212,175,55,0.28)', bd: 'rgba(212,175,55,0.32)', bd2: 'rgba(212,175,55,0.6)' },
  crimson: { a: '#c8232a', b: '#e83a42', dim: 'rgba(200,35,42,0.15)', muted: 'rgba(200,35,42,0.06)', glow: 'rgba(200,35,42,0.28)', bd: 'rgba(200,35,42,0.32)', bd2: 'rgba(200,35,42,0.6)' },
  ember:   { a: '#ff5a2c', b: '#ff7a44', dim: 'rgba(255,90,44,0.15)', muted: 'rgba(255,90,44,0.07)', glow: 'rgba(255,90,44,0.30)', bd: 'rgba(255,90,44,0.34)', bd2: 'rgba(255,90,44,0.62)' },
};
function accentVars(key) {
  const c = ACCENTS[key] || ACCENTS.red;
  return { '--accent': c.a, '--accent-bright': c.b, '--accent-dim': c.dim, '--accent-muted': c.muted, '--accent-glow': c.glow, '--accent-border': c.bd, '--accent-border2': c.bd2 };
}

/* What-I-build dossier cards (preview in grid → full card on the stage) */
const BUILD_CARDS = [
  { title: 'Operator Systems', sub: '01 · Operator', body: 'Human-centered public surfaces for people carrying active state across fragmented tools.', more: 'Surfaces: identity cards · intake views · continuity handoffs.', icon: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></> },
  { title: 'Operational Systems', sub: '02 · Operational', body: 'Machine, agent, archive, and process layers that govern behavior, preserve state, and expose authority.', more: 'Surfaces: TAL.OS substrate · Hyperion Connect mesh · agent runtimes.', icon: <><rect x="3" y="4" width="18" height="6" rx="1.5" /><rect x="3" y="14" width="18" height="6" rx="1.5" /><path d="M7 7h.01M7 17h.01" /></> },
  { title: 'Governed Memory', sub: '03 · Memory', body: 'Memory is not context bloat. It is source-anchored recall, provenance, and controlled retrieval.', more: 'Surfaces: MNEM.OS continuity engine · CHRON.OS archive intelligence.', icon: <><ellipse cx="12" cy="5.5" rx="8" ry="3" /><path d="M4 5.5v13c0 1.7 3.6 3 8 3s8-1.3 8-3v-13M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></> },
  { title: 'Local-First Custody', sub: '04 · Custody', body: 'The operator should know what is local, what is remote, what is remembered, what is approved, and what is allowed to leave.', more: 'Doctrine: the classification ladder below — Sovereign through Public.', icon: <><path d="M12 2 4 6v6c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V6l-8-4z" /><path d="M9.5 12l1.8 1.8L15 10" /></> },
  { title: 'Agentic Governance', sub: '05 · Governance', body: 'AI can assist, propose, route, and accelerate. High-consequence mutation belongs behind gates.', more: 'Doctrine: read ≠ write · write ≠ run · run ≠ publish.', icon: <><circle cx="6" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="12" r="2.5" /><path d="M8.5 6H13a3 3 0 0 1 3 3v0M8.5 18H13a3 3 0 0 0 3-3v0" /></> },
  { title: 'Continuity Infrastructure', sub: '06 · Continuity', body: 'Systems for preserving the thread across devices, documents, agents, people, and time.', more: 'Surfaces: archive recovery · governed memory · the thread across devices.', icon: <><path d="M7 9a3 3 0 1 0 0 6h2.5M17 9a3 3 0 1 1 0 6h-2.5M9.5 12h5" /></> },
];
const STAGE_SPRING = { type: 'spring', stiffness: 230, damping: 27, mass: 0.9 };

/* ── navy stub for founders without a full profile yet (e.g. Keshawn) ── */
function StubFounder({ operator, theme }) {
  return (
    <main className="founder-page founder-stub" data-theme={theme} data-grain="on">
      <SingularityBackground
        id="fp-particles"
        color={theme === 'operator-navy' ? '90, 160, 255' : '255, 46, 46'}
        secondaryColor={theme === 'operator-navy' ? '214, 70, 255' : '255, 199, 44'}
        intensity={1.08}
        density={1.08}
        speed={0.82}
        style={PARTICLE_STYLE}
      />
      <div className="fp-grain" aria-hidden="true" />
      <Helmet>
        <title>{operator.name} — Founder, Hyperion Industries</title>
        <meta name="description" content={operator.description} />
        <link rel="canonical" href={`https://hyperion-industries.dev/founders/${operator.slug}`} />
        <meta property="og:title" content={`${operator.name} — Founder, Hyperion Industries`} />
        <meta property="og:description" content={operator.description} />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={`https://hyperion-industries.dev/founders/${operator.slug}`} />
        <meta property="og:image" content={`https://hyperion-industries.dev${operator.image}`} />
        <meta property="og:image:alt" content={operator.imageAlt || operator.name} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      <section className="fp-hero founder-stub-hero">
        <div className="founder-stub-bg" aria-hidden="true">
          <img src={operator.image} alt="" />
        </div>
        <div className="founder-stub-grid" aria-hidden="true" />
        <div className="hero-inner founder-stub-inner">
          <div className="founder-stub-status"><i /> Profile in progress</div>
          {operator.mark && (
            <img
              src={operator.mark}
              alt={operator.markAlt || `${operator.name} operator mark`}
              className="founder-stub-mark"
            />
          )}
          <div className="founder-stub-record">{operator.serial}</div>
          <h1 className="hero-name">{operator.name}</h1>
          <div className="hero-akas">{operator.typeLine}</div>
          <p className="hero-statement">{operator.description}</p>
          <div className="founder-stub-focuses" aria-label="Public focus areas">
            {operator.focuses?.map((focus) => <span key={focus}>{focus}</span>)}
          </div>
          <p className="founder-stub-note">The public dossier is still being assembled. This route remains deliberately limited until the written profile is approved.</p>
          <div className="hero-ctas">
            <Link to="/founders" className="btn btn-ghost btn-lg">← Back to founders</Link>
            <Link to="/intake/relationships?source=founder_profile" className="btn btn-primary btn-lg">Start an inquiry</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function FounderPage() {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const operator = operators.find((o) => o.slug === slug);
  const founderStations = [
    { id: 'profile', label: 'Profile' },
    { id: 'systems', label: 'Systems' },
    { id: 'work', label: 'Work' },
    { id: 'writing', label: 'Writing' },
    { id: 'contact', label: 'Contact' },
  ];
  const requestedStation = location.hash.replace(/^#/, '');
  const activeStation = founderStations.some((station) => station.id === requestedStation) ? requestedStation : 'profile';
  const founderRootRef = useRef(null);

  const [tweaks, setTweaks] = useState(() => {
    try { return { ...DEFAULT_TWEAKS, ...JSON.parse(localStorage.getItem(TW_KEY) || '{}') }; }
    catch { return DEFAULT_TWEAKS; }
  });
  useEffect(() => { try { localStorage.setItem(TW_KEY, JSON.stringify(tweaks)); } catch { /* ignore */ } }, [tweaks]);
  const setTweak = (k, v) => setTweaks((t) => ({ ...t, [k]: v }));

  // What-I-build cards: preview cards in the grid; the selected card lifts out
  // into a centered lightbox over a dimmed page (operator-chosen pattern).
  const [stage, setStage] = useState(null);
  const stageReturnRef = useRef(null);
  const openStage = (i, evt) => { stageReturnRef.current = evt?.currentTarget || null; setStage(i); };
  const closeStage = () => {
    setStage(null);
    requestAnimationFrame(() => stageReturnRef.current?.focus?.({ preventScroll: true }));
  };

  // scroll lock + Escape while the stage is open
  useEffect(() => {
    if (stage == null) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') closeStage(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prevOverflow; window.removeEventListener('keydown', onKey); };
  }, [stage]);

  useEffect(() => { window.scrollTo(0, 0); }, [slug]);
  useEffect(() => { founderRootRef.current?.scrollTo({ top: 0, behavior: 'auto' }); }, [activeStation]);
  useEffect(() => { if (slug === 'victor-amani') logEvent('visit', { page: 'founder/victor-amani', ref: document.referrer || '' }); }, [slug]);

  // pointer-aware card lighting + tilt (desktop fine-pointer only)
  useEffect(() => {
    const rootEl = document.querySelector('.founder-page');
    return initPointerFx(rootEl);
  }, [slug]);

  if (!operator) {
    return (
      <main className="founder-page" style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', textAlign: 'center', padding: '120px 24px' }}>
        <div>
          <h1 className="hero-name" style={{ fontSize: 'clamp(28px,5vw,48px)' }}>Operator not found</h1>
          <p className="section-lead" style={{ margin: '16px auto 28px' }}>That founder profile doesn't exist.</p>
          <Link to="/founders" className="btn btn-primary btn-lg">← Meet the founders</Link>
        </div>
      </main>
    );
  }

  const theme = operator.theme || 'operator-red';
  if (slug !== 'victor-amani') return <StubFounder operator={operator} theme={theme} />;

  return (
    <RadioProvider tracks={radioTracks}>
      <main
        ref={founderRootRef}
        className="founder-page"
        data-room-station={activeStation}
        data-theme={theme}
        data-cards={tweaks.cards}
        data-grain={tweaks.grain ? 'on' : 'off'}
        data-portrait={tweaks.portrait ? 'on' : 'off'}
        style={{
          ...accentVars(tweaks.accent),
          '--amb': (tweaks.amb / 100).toFixed(2),
          '--fp-lattice-op': (0.55 * tweaks.amb / 100).toFixed(3),
        }}
      >
        <SingularityBackground id="fp-particles" color={hexToRgbStr(ACCENTS[tweaks.accent]?.b)} style={PARTICLE_STYLE} />
        {tweaks.lattice && <GravityLattice intensity={Math.min(1.4, tweaks.amb / 100)} />}
        {tweaks.grain && <div className="fp-grain" aria-hidden="true" />}
        <Helmet>
          <title>Victor Amani (Kushinda Furaha Zeleke) — Founder, Hyperion Industries</title>
          <meta name="description" content="Victor Amani (Kushinda Furaha Zeleke) — founder of Hyperion Industries. Systems architect and infrastructure operator building local-first systems for memory, governance, continuity, and human-controlled AI." />
          <link rel="canonical" href="https://hyperion-industries.dev/founders/victor-amani" />
          <meta property="og:title" content="Victor Amani — Founder, Hyperion Industries" />
          <meta property="og:description" content="Systems architect and infrastructure operator building local-first systems for memory, governance, continuity, and human-controlled AI." />
          <meta property="og:type" content="profile" />
          <meta property="og:url" content="https://hyperion-industries.dev/founders/victor-amani" />
          <meta property="og:image" content={`https://hyperion-industries.dev${operator.heroImage}`} />
          <meta property="og:image:alt" content={operator.heroImageAlt} />
          <meta name="twitter:card" content="summary_large_image" />
        </Helmet>

        <nav className="fp-room-nav" aria-label="Founder profile stations">
          <div className="fp-room-location"><span>Operator profile</span><strong>Victor Amani</strong></div>
          <div className="fp-room-tabs" role="tablist">
            {founderStations.map((station, index) => (
              <button key={station.id} type="button" role="tab" aria-selected={activeStation === station.id} className={activeStation === station.id ? 'is-active' : ''} onClick={() => navigate({ pathname: location.pathname, hash: station.id })}>
                <span>{String(index + 1).padStart(2, '0')}</span>{station.label}
              </button>
            ))}
          </div>
        </nav>

        {/* ════════ HERO ════════ */}
        <section className="fp-hero fp-room-section" data-fp-room="profile">
          <div className="hero-bg" aria-hidden="true">
            <video
              src="/assets/founder/victor-operator-ambient.mp4"
              poster={operator.heroImage || A('17.jpg')}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            />
          </div>
          <div className="hero-inner">
            <div className="hero-grid">
              <div className="hero-text">
                <div className="hero-glyph-wrap">
                  <img src={MARK} alt="Hyperion sigil" className="hero-glyph" />
                  <div className="hero-id">HYPERION INDUSTRIES<br /><b>Operator Profile · Founder</b></div>
                </div>
                <h1 className="hero-name">Kushinda Furaha&nbsp;Zeleke</h1>
                <div className="hero-akas">Known publicly as <span className="accent">Victor Amani</span> <span className="sep">/</span> systems architect <span className="sep">/</span> infrastructure operator</div>
                <p className="hero-statement">Founder of <b>Hyperion Industries</b> — building local-first systems for memory, governance, continuity, and human-controlled AI.</p>
                <div className="hero-ctas">
                  <a href="#systems" className="btn btn-primary btn-lg">Explore the systems <span className="ar">→</span></a>
                  <a href={SUBSTACK} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-lg">Read The Human Runtime</a>
                  <a href="#contact" className="btn btn-ghost btn-lg">Start an inquiry</a>
                </div>
                <div className="hero-meta">
                  <span>Local-first</span><span>Operator-governed</span><span>BIPOC-founded</span><span>Non-dilutive</span>
                </div>
              </div>
              <aside className="hero-aside">
                <div className="hero-creed">
                  <span className="portrait-corner tl" /><span className="portrait-corner tr" />
                  <span className="portrait-corner bl" /><span className="portrait-corner br" />
                  <img className="creed-mark" src={MARK} alt="" aria-hidden="true" />
                  <div className="ch"><span>Operator Creed</span><span className="creed-id">OP-00</span></div>
                  <ul>
                    <li><i>01</i><span>I write state with <b>intent</b>.</span></li>
                    <li><i>02</i><span>I execute action with <b>authority</b>.</span></li>
                    <li><i>03</i><span>I protect privacy by <b>design</b>.</span></li>
                    <li><i>04</i><span>I control what remains <b>me</b>.</span></li>
                    <li><i>05</i><span>I engineer the <b>future</b>.</span></li>
                  </ul>
                  <div className="creed-foot">I operate.</div>
                </div>
              </aside>
            </div>
          </div>
          <div className="scroll-cue"><div className="ln" />scroll</div>
        </section>

        {/* ════════ STATEMENT ════════ */}
        <section className="section statement-band bg2 fp-room-section" data-fp-room="profile">
          <div className="wrap">
            <div className="eyebrow" style={{ marginBottom: 28 }}>Founder statement</div>
            <p className="big-quote">I build systems for people who cannot afford to <span className="accent">lose the thread.</span></p>
            <div className="sx-cardgrid statement-body">
              {[
                ['01', 'The burden', <>Hyperion Industries exists because modern tools keep accelerating output while leaving humans to carry <b>broken state, scattered memory, unclear authority, and invisible operational burden.</b></>],
                ['02', 'The missing layer', <>My work is focused on the missing layer: <b>local-first infrastructure</b> that keeps operators, machines, agents, archives, and workflows in coherent state.</>],
                ['03', 'The build', <>It combines software architecture, local-first AI workflows, deployment systems, identity tooling, and automation into <b>practical systems people can actually use.</b></>],
              ].map(([n, k, body]) => (
                <article className="sx-card" key={n}>
                  <div className="sx-card-head"><span className="sx-num">{n}</span><span className="sx-k">{k}</span></div>
                  <div className="sx-card-body"><p>{body}</p></div>
                </article>
              ))}
            </div>
            <div className="sx-topo" style={{ marginTop: 26 }}>
              <span className="sx-chip"><span className="led" /><span className="ck">Runtime</span><span className="cv accent">Local-first</span></span>
              <span className="sx-chip"><span className="led" /><span className="ck">Authority</span><span className="cv">Operator-governed</span></span>
              <span className="sx-chip"><span className="led gold" /><span className="ck">Founder</span><span className="cv">BIPOC-founded</span></span>
              <span className="sx-chip"><span className="led gold" /><span className="ck">Capital</span><span className="cv">Non-dilutive</span></span>
            </div>
          </div>
        </section>

        <hr className="divider" />

        {/* ════════ WHAT I BUILD ════════ */}
        <section className="section fp-room-section" data-fp-room="work">
          <div className="wrap">
            <div className="head-block">
              <div className="eyebrow">What I build</div>
              <h2 className="section-title">Six layers of one<br />continuous runtime.</h2>
            </div>
            <div className="sx-cardgrid">
              {BUILD_CARDS.map((c, i) => (
                <motion.article
                  layoutId={`fp-build-${i}`}
                  className="sx-card hoverable fp-xcard"
                  key={c.sub}
                  style={{ visibility: stage === i ? 'hidden' : 'visible' }}
                >
                  <span className="sx-card-trace" />
                  <button
                    type="button"
                    className="fp-xhead"
                    aria-haspopup="dialog"
                    aria-expanded={stage === i}
                    onClick={(e) => openStage(i, e)}
                  >
                    <div className="sx-glyph"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">{c.icon}</svg></div>
                    <div className="sx-card-id"><div className="sx-card-title">{c.title}</div><div className="sx-card-sub">{c.sub}</div></div>
                    <span className="fp-xopen" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 5v14M5 12h14" /></svg>
                    </span>
                  </button>
                  <div className="fp-xpeek" aria-hidden="true">{c.body}</div>
                </motion.article>
              ))}
            </div>

            {/* ── STAGE: selected dossier lifts out over the dimmed page ── */}
            <AnimatePresence>
              {stage != null && (
                <>
                  <motion.div
                    className="fp-stage-scrim"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.32, ease: [0.2, 0, 0, 1] }}
                    onClick={closeStage}
                  />
                  <motion.div
                    className="fp-stage-wrap"
                    role="dialog" aria-modal="true" aria-labelledby="fp-stage-title"
                    initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 1, transition: { duration: 0.45 } }}
                    onClick={(e) => { if (e.target === e.currentTarget) closeStage(); }}
                  >
                    <motion.article
                      layoutId={`fp-build-${stage}`}
                      className="sx-card fp-stage-card"
                      transition={{ layout: STAGE_SPRING, duration: 0.28 }}
                    >
                      <header className="fp-stage-head">
                        <div className="sx-glyph"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">{BUILD_CARDS[stage].icon}</svg></div>
                        <div className="sx-card-id">
                          <div className="sx-card-title" id="fp-stage-title">{BUILD_CARDS[stage].title}</div>
                          <div className="sx-card-sub">{BUILD_CARDS[stage].sub} · layer dossier</div>
                        </div>
                        <button type="button" className="fp-stage-close" onClick={closeStage} aria-label="Close dossier" autoFocus>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 6l12 12M18 6L6 18" /></svg>
                        </button>
                      </header>
                      <motion.div
                        className="fp-stage-body"
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.34, delay: 0.16, ease: [0.2, 0, 0, 1] }}
                      >
                        <img className="fp-stage-mark" src={MARK} alt="" aria-hidden="true" />
                        <p className="fp-stage-lead">{BUILD_CARDS[stage].body}</p>
                        <p className="fp-xmore">{BUILD_CARDS[stage].more}</p>
                        <div className="fp-stage-foot">
                          <span className="sx-num">{BUILD_CARDS[stage].sub.split(' ')[0]}</span>
                          <span className="fp-stage-hint">ESC or tap outside to close</span>
                        </div>
                      </motion.div>
                    </motion.article>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </section>

        <hr className="divider" />

        {/* ════════ DOCTRINE — .OS ════════ */}
        <section id="fp-doctrine" className="section bg2 fp-room-section" data-fp-room="work">
          <div className="wrap">
            <div className="split">
              <div className="doctrine-copy">
                <div className="head-block" style={{ marginBottom: 24 }}>
                  <div className="eyebrow">The .OS doctrine</div>
                  <h2 className="section-title">The next OS is not just an operating system.</h2>
                </div>
                <p className="section-lead" style={{ marginBottom: 6 }}>In Hyperion, <span className="accent mono">.OS</span> is a contextual suffix. What it means depends on what the runtime is centered around.</p>
                <div className="sx-brief" style={{ margin: '24px 0' }}>
                  <div className="sx-row">
                    <div className="sx-rk"><span className="n">01</span><span className="t">Operator System</span></div>
                    <p>When the runtime is centered on a <b>human being</b>. It supports the person carrying state.</p>
                  </div>
                  <div className="sx-row">
                    <div className="sx-rk"><span className="n">02</span><span className="t">Operational System</span></div>
                    <p>When the runtime is centered on <b>infrastructure</b> — machines, agents, archives, processes, device layers. It governs the process carrying state.</p>
                  </div>
                </div>
                <p className="pull">The future belongs to systems that can coordinate both.</p>
              </div>
              <div className="doctrine-media">
                <div className="fp-frame hud">
                  <img src={A('09.jpg')} alt="Old OS versus new .OS — the Operator routing chaotic state into a governed, organized runtime" />
                  <div className="cap">Old OS → New .OS · control the past, engineer the future</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <hr className="divider" />

        {/* ════════ SYSTEM FAMILY ════════ */}
        <section id="fp-systems" className="section fp-room-section" data-fp-room="systems">
          <div className="wrap">
            <div className="head-block">
              <div className="eyebrow">System family</div>
              <h2 className="section-title">One system family.<br />Many modes.</h2>
              <p className="section-lead">An evolving family of layers — not a pile of apps. Some public, some protected-source, some still experimental.</p>
              <div className="legend">
                <span className="tag public dot">Public</span>
                <span className="tag protected dot">Protected</span>
                <span className="tag experimental dot">Experimental</span>
              </div>
            </div>

            <div className="sys-grid">
              {[
                ['FIELD', 'OPS', 'Technician coordination and service continuity layer.', 'layer · operator', 'protected', 'Protected'],
                ['MNEM', '.OS', 'Governed memory and continuity engine.', 'layer · memory', 'protected', 'Protected'],
                ['CHRON', '.OS', 'Archive intelligence — provenance, lineage, and temporal state.', 'layer · archive', 'public', 'Public · Beta'],
                ['SCEN', '.OS', 'Scene and context runtime — what matters now.', 'layer · context', 'experimental', 'Experimental'],
                ['TAL', '.OS', 'Compute substrate, local model runtime, machine layer.', 'layer · compute', 'protected', 'Protected'],
                ['SYNTH', '.OS', 'Synthesis — turning fragments into usable structure.', 'layer · synthesis', 'experimental', 'Experimental'],
                ['MYTH', '.OS', 'Symbolic and narrative compression layer.', 'layer · symbol', 'experimental', 'Experimental'],
                ['KOSM', '.OS', 'Topology of relationships between systems, people, agents, documents, and histories.', 'layer · topology', 'experimental', 'Experimental'],
                ['HYPERION ', 'Connect', 'Mesh and router for trusted systems, local endpoints, approvals, and cross-app communication.', 'layer · mesh', 'protected', 'Protected'],
              ].map(([name, os, role, id, tagClass, tagLabel]) => (
                <article className="syscard" key={id}>
                  <div className="sysname">{name}<span className="os">{os}</span></div>
                  <div className="sysrole">{role}</div>
                  <div className="sysfoot"><span className="sysid">{id}</span><span className={`tag ${tagClass}`}>{tagLabel}</span></div>
                </article>
              ))}
            </div>

            <div className="head-block" style={{ marginTop: 72, marginBottom: 8 }}>
              <div className="eyebrow gold">Companion entities</div>
              <h3 className="section-title" style={{ fontSize: 'clamp(24px,2.6vw,34px)' }}>Agents that observe, enforce, and synthesize.</h3>
            </div>
            <div className="agent-grid">
              {[
                ['HORUS', 'Ascendant observer — insight, foresight, strategic guidance.', A('agent-horus.png')],
                ['FENRIR', 'Executor — threat evaluation and boundary enforcement.', A('agent-fenrir.png')],
                ['NYTHRA', 'Synthesis intelligence — recombination and meaning.', A('agent-nythra.png')],
              ].map(([name, role, img]) => (
                <div className="agent hud" key={name}>
                  <div className="ph"><img src={img} alt={`${name} — agent action shot`} loading="lazy" /></div>
                  <div className="meta"><div className="an">{name}</div><div className="ar2">{role}</div></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <hr className="divider" />

        {/* ════════ WHY THIS MATTERS NOW ════════ */}
        <section className="section bg2 fp-room-section" data-fp-room="work">
          <div className="wrap">
            <div className="split rev">
              <div className="why-media">
                <div className="fp-frame hud">
                  <img src={A('04.jpg')} alt="Capability versus authority — the Operator standing between raw capability and governed authority" />
                  <div className="cap">Capability asks: can it? · Authority asks: should it?</div>
                </div>
              </div>
              <div className="why-copy">
                <div className="head-block" style={{ marginBottom: 24 }}>
                  <div className="eyebrow">Why this matters now</div>
                  <h2 className="section-title">Output is cheap.<br />Governance is not.</h2>
                </div>
                <p className="section-lead" style={{ marginBottom: 20 }}>A model can write code, summarize documents, classify files, draft plans, and propose actions. That does not mean it should silently mutate the environment.</p>
                <p className="section-lead" style={{ marginBottom: 28 }}>The next frontier is not more autonomy by default. It is <span className="accent">governed autonomy</span> — visible state, source provenance, approval gates, recoverable actions, and human authority that remains intact.</p>
                <div className="ladder" aria-label="Data classification levels">
                  {[
                    ['Sovereign', 'gold', 'Never leaves the operator — identity, keys, root state.', 'protected', 'var(--gold)'],
                    ['Private', 'accent', 'Local by default. Released only on explicit action.', '78%', 'var(--red)'],
                    ['Sensitive', '', 'Gated. Requires approval before it moves.', '56%', '#e0863a'],
                    ['Shared', '', 'Released to trusted endpoints under policy.', '34%', 'var(--silver)'],
                    ['Public', '', 'Cleared for the open record.', '16%', '#7fd4a8'],
                  ].map(([lvl, cls, desc, w, bar]) => (
                    <div className="rung" key={lvl}>
                      <span className={`lvl ${cls}`} style={cls ? undefined : { color: bar }}>{lvl}</span>
                      <span className="desc">{desc}</span>
                      <span className="bar"><i style={{ width: w, background: bar }} /></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <hr className="divider" />

        {/* ════════ ORIGIN ════════ */}
        <section className="imgband section fp-room-section" data-fp-room="profile">
          <img src={A('wall.jpg')} alt="" className="bandimg" aria-hidden="true" />
          <div className="scrim" />
          <div className="wrap" style={{ position: 'relative', zIndex: 2 }}>
            <div className="sx-panel" style={{ maxWidth: 820 }}>
              <div className="sx-panel-head">
                <div className="sx-glyph"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2v20M4 7l8-5 8 5M4 7v10l8 5 8-5V7" /></svg></div>
                <div className="sx-card-id"><h2 className="sx-card-title" style={{ fontWeight: 600 }}>Built from contact with broken systems</h2><div className="sx-card-sub">Origin · doctrine</div></div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <p className="section-lead" style={{ maxWidth: 'none' }}>My work comes from years inside systems that looked legitimate on paper and failed operationally in practice — education, employment, housing, civic systems, nonprofit infrastructure, technical operations, and AI.</p>
                <p className="section-lead" style={{ maxWidth: 'none' }}><b style={{ color: 'var(--text)', fontWeight: 500 }}>Different domains. Same failure geometry.</b> The paper layer said one thing. The operative layer did another. The human inside the gap absorbed the cost.</p>
                <div className="sx-topo" style={{ marginTop: 4 }}>
                  {['Expose state', 'Preserve memory', 'Gate authority'].map((t) => (
                    <span className="sx-chip" key={t}><span className="led" /><span className="cv">{t}</span></span>
                  ))}
                  {['Respect the operator', 'Turn failure into policy'].map((t) => (
                    <span className="sx-chip" key={t}><span className="led gold" /><span className="cv">{t}</span></span>
                  ))}
                </div>
                <p className="section-lead" style={{ maxWidth: 'none', color: 'var(--silver)' }}>Hyperion is the counter-system.</p>
              </div>
            </div>
          </div>
        </section>

        <hr className="divider" />

        {/* ════════ NAMESPACES ════════ */}
        <section className="section fp-room-section" data-fp-room="profile">
          <div className="wrap">
            <div className="head-block">
              <div className="eyebrow">Identity</div>
              <h2 className="section-title" style={{ fontSize: 'clamp(26px,3vw,40px)' }}>One operator, a few namespaces.</h2>
              <p className="section-lead">Different access layers around one operating architecture — not separate masks.</p>
            </div>
            <div className="ns-list">
              {[
                ['Victor Amani', 'Public', 'Founder, systems architect, writer, and operator — the public bridge identity.'],
                ['Kushinda Furaha Zeleke', 'Legal', 'The formal, civic, and institutional record.'],
                ['Code_Xero', 'Sandbox', 'Creative and technical experimentation — hardware, music, public builds.'],
                ['Hyperion', 'Synthesis', 'Where the namespaces resolve into one system.'],
              ].map(([name, tag, d]) => (
                <div className="ns-item" key={name}>
                  <span className="ns-name">{name}</span><span className="ns-tag">{tag}</span>
                  <span className="ns-d">{d}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <hr className="divider" />

        {/* ════════ OPERATOR — PORTRAIT + CREED + TIMELINE ════════ */}
        <section className="section bg2 fp-room-section" data-fp-room="profile">
          <div className="wrap">
            <div className="head-block">
              <div className="eyebrow">The operator</div>
              <h2 className="section-title">Not a user. Not a consumer.<br />An operator.</h2>
            </div>

            <div className="portrait-land hud">
              <span className="portrait-corner tl" /><span className="portrait-corner tr" />
              <span className="portrait-corner bl" /><span className="portrait-corner br" />
              <video
                className="fp-portrait"
                src="/assets/founder/victor-skyline.mp4"
                poster={A('17.jpg')}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-hidden="true"
              />
              <div className="portrait-land-overlay">
                <div className="pl-meta">
                  <span className="pl-name">Victor Amani</span>
                  <span className="pl-sub">KUSHINDA FURAHA ZELEKE · FOUNDER</span>
                </div>
                <span className="tag protected">Operator · OP-00</span>
              </div>
            </div>

            <p className="op-lead">The operator is not the bottleneck to remove. The operator is the <span className="accent">authority layer to protect.</span></p>

            <div className="op-grid">
              <div className="op-col">
                <div className="eyebrow" style={{ marginBottom: 20 }}>Operator creed</div>
                <ul className="creed-list">
                  <li>I write state with <b>intent</b>.</li>
                  <li>I execute action with <b>authority</b>.</li>
                  <li>I protect privacy by <b>design</b>.</li>
                  <li>I control what remains <b>me</b>.</li>
                  <li>I engineer the <b>future</b>. <b style={{ color: 'var(--accent-bright)' }}>I operate.</b></li>
                </ul>
              </div>
              <div className="op-col">
                <div className="eyebrow gold" style={{ marginBottom: 20 }}>Background</div>
                <div className="timeline">
                  {[
                    ['NOW', 'Founder · Hyperion Industries LLC', 'Building continuity infrastructure that preserves state, provenance, context, and human authority across fragmented operations.'],
                    ['BUILDING', 'The .OS system family', 'CHR0N.OS, Mnem.OS, and the operator runtime — local-first workflows, continuity tooling, and identity-linked products.'],
                    ['FOCUS', 'Alignment · product · partner network', 'Non-dilutive funding, grant programs, strategic partners, early customers, and sovereignty-aligned technical growth.'],
                    ['PRACTICE', 'Architecture & deployment', 'Software architecture, local-first AI, deployment systems, NFC identity tools, and automation frameworks — practical systems people can actually use.'],
                    ['RESEARCH', 'Independent AI safety & evaluation', '2.5+ years of research-grade engagement across frontier model families — evaluation methodology, capability-emergence diagnostics, behavioral drift analysis, and the MYTH.OS architecture specification feeding the .OS family.'],
                    ['RECORD', 'A decade inside live infrastructure', 'Ten+ years of enterprise and nonprofit IT — IBM deployment operations, nonprofit IT directorship, hybrid Azure identity migrations, endpoint security, and the service desks where systems meet people.'],
                  ].map(([when, h, p]) => (
                    <div className="tl-row" key={when}>
                      <div className="tl-when">{when}</div>
                      <div className="tl-what"><h4>{h}</h4><p>{p}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <hr className="divider" />

        {/* ════════ HUMAN RUNTIME (writing) ════════ */}
        <section className="section fp-room-section" data-fp-room="writing">
          <div className="wrap">
            <div className="writing-head">
              <div className="head-block" style={{ marginBottom: 0 }}>
                <div className="eyebrow">The Human Runtime</div>
                <h2 className="section-title">Public field notes.</h2>
                <p className="section-lead" style={{ marginTop: 18 }}>AI, infrastructure, memory, civic systems, institutions, local-first software — and the human operators modern systems keep treating as invisible infrastructure.</p>
              </div>
              <a href={SUBSTACK} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-lg">Open the Substack <span className="ar">→</span></a>
            </div>
            <div className="post-grid">
              {[
                ['02.jpg', 'Continuity', 'The missing layer is continuity', 'The Hyperion glyph amid a field of scattered application icons'],
                ['03.jpg', 'Doctrine', 'The next OS is not just an operating system', 'The Next .OS doctrine illustration'],
                ['08.jpg', 'Governance', 'AI does not need more autonomy. It needs better operators.', 'The Operator weighing capability against authority'],
                ['23.jpg', 'Custody', 'Local-first is not nostalgia. It is custody.', 'The Operator before a golden vault marked with the Hyperion glyph'],
              ].map(([img, pk, h, alt]) => (
                <a href={SUBSTACK} target="_blank" rel="noopener noreferrer" className="post" key={h}>
                  <div className="thumb"><img src={A(img)} alt={alt} /></div>
                  <div className="pbody"><div className="pk">{pk}</div><h3>{h}</h3><span className="more">Read on Substack <span className="ar">→</span></span></div>
                </a>
              ))}
            </div>
          </div>
        </section>

        <hr className="divider" />

        {/* ════════ HYPERION RADIO ════════ */}
        <section id="fp-radio" className="section bg2 fp-room-section" data-fp-room="writing">
          <div className="wrap">
            <div className="head-block">
              <div className="eyebrow">//H¥PE · Hyperion Radio</div>
              <h2 className="section-title">Not a band.<br />A transmission.</h2>
              <p className="section-lead">Operator. Lilith. Eva. Kairo. — cyberpunk rap, glitch rock, future bass, and cinematic system anthems. Stream the signal while you read.</p>
              <div className="sx-topo" style={{ marginTop: 18 }}>
                <span className="sx-chip"><span className="led" /><span className="cv">Operator holds the gate</span></span>
                <span className="sx-chip"><span className="led" style={{ background: '#b06cff', boxShadow: '0 0 8px #b06cff' }} /><span className="cv">Lilith breaks the lie</span></span>
                <span className="sx-chip"><span className="led" style={{ background: '#e6ecff', boxShadow: '0 0 8px #e6ecff' }} /><span className="cv">Eva keeps the tether</span></span>
                <span className="sx-chip"><span className="led gold" /><span className="cv">Kairo builds the world</span></span>
              </div>
              <div className="hype-squad hud">
                <video
                  src="/assets/radio/hype-squad-loop.mp4"
                  poster="/assets/radio/hype-squad.png"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-hidden="true"
                />
                <div className="hype-squad-copy">
                  <div className="eyebrow">H¥PE Squad</div>
                  <p>Four signals. One transmission.</p>
                  <div className="hype-squad-roster" aria-label="HYPE Squad roster">
                    <span data-persona="operator">Operator · voice</span>
                    <span data-persona="lilith">Lilith · disruption</span>
                    <span data-persona="eva">Eva · tether</span>
                    <span data-persona="kairo">Kairo · score</span>
                  </div>
                </div>
              </div>
            </div>
            <RadioConsole />
          </div>
        </section>

        <hr className="divider" />

        {/* ════════ LETTER ════════ */}
        <section className="section bg3 fp-room-section" data-fp-room="writing">
          <div className="wrap">
            <div className="head-block"><div className="eyebrow">A note to operators</div></div>
            <div className="letter">
              <div className="letter-head">
                <img src={MARK} alt="" className="letter-mark" aria-hidden="true" />
                <div>
                  <div className="letter-eyebrow">From the operator's desk</div>
                  <div className="letter-serial">Transmission · OP-00 · Hyperion Industries · 2026</div>
                </div>
              </div>
              <p className="open">From the operator —</p>
              <p className="lead-p">If you are reading this, you are probably carrying more state than your tools admit: scattered memory, unclear authority, broken context — absorbed quietly, by you. I have spent years on the wrong side of systems that looked legitimate on paper and failed in practice. <b>Hyperion is the counter-system.</b></p>
              <p>Modern software produces more output than ever. The problem is that it keeps losing continuity. AI can assist. The operator decides. Consequence is owned. I am not building tools that quietly mutate your environment — I am building the missing layer that keeps you, your machines, and your archive in coherent state.</p>
              <p>Local-first is not isolation. It is <b>consent with state visibility.</b> Memory is not context bloat. It is governed continuity. The operator is not the bottleneck to remove — the operator is the authority layer to protect.</p>
              <p>That is the whole of it. Build with me, or watch what gets built. Either way — <b>keep the thread.</b></p>
              <div className="sig">
                <div className="sig-typed">— Victor Amani<span className="sub">FOUNDER · HYPERION INDUSTRIES · KUSHINDA FURAHA ZELEKE</span></div>
              </div>
              <img className="sig-stamp" src={MARK} alt="" aria-hidden="true" />
            </div>
          </div>
        </section>

        <hr className="divider" />

        {/* ════════ INQUIRIES ════════ */}
        <section id="fp-contact" className="section fp-room-section" data-fp-room="contact">
          <div className="wrap">
            <div className="inq-layout">
              <div className="inq-copy">
                <div className="head-block" style={{ marginBottom: 24 }}>
                  <div className="eyebrow">Collaboration &amp; inquiries</div>
                  <h2 className="section-title">Start an inquiry.</h2>
                </div>
                <p className="section-lead">Hyperion is currently focused on early infrastructure, protected-source maturation, public doctrine, and selected consulting or collaboration lanes.</p>
                <div style={{ marginTop: 26 }}>
                  <div className="eyebrow" style={{ marginBottom: 0 }}>Good-fit inquiries</div>
                  <div className="fit-list">
                    {['Local-first AI infrastructure', 'Custom systems & hardware', 'Agentic workflow governance', 'Archive & memory systems', 'Operator dashboards', 'Technical strategy', 'AI infrastructure consulting', 'Founder / operator collaboration', 'Writing / interview / media'].map((p) => (
                      <span className="pill" key={p}>{p}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="contact-card hud">
                <div className="cc-head"><span className="ok" />Channels open · select inquiry</div>
                {[
                  ['Email', 'va@hyperion-industries.dev', 'mailto:va@hyperion-industries.dev', '→'],
                  ['GitHub', 'github.com/Code-Xer0', 'https://github.com/Code-Xer0', '→'],
                  ['LinkedIn', 'in/victor-a-1231a975', 'https://www.linkedin.com/in/victor-a-1231a975/', '→'],
                  ['Substack', 'victoramani.substack.com', SUBSTACK, '→'],
                ].map(([k, v, href, ar]) => (
                  <a className="clink" href={href} key={k} {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                    <span className="cl-l"><span className="cl-k">{k}</span><span className="cl-v">{v}</span></span><span className="ar">{ar}</span>
                  </a>
                ))}
                <Link className="clink" to="/intake/relationships?source=founder_profile" style={{ background: 'var(--accent-muted)' }}>
                  <span className="cl-l"><span className="cl-k accent">Start</span><span className="cl-v">Open an inquiry →</span></span><span className="ar">✦</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <MiniPlayer />
        <TweaksPanel tweaks={tweaks} onChange={setTweak} />
      </main>
    </RadioProvider>
  );
}
