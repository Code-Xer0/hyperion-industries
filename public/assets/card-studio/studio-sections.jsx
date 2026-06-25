// =========================================================
// Hyperion Card Studio — page sections (presentational)
// =========================================================

const { useState: useStateSec, useEffect: useEffectSec, useRef: useRefSec } = React;

/* ---------- nav ---------- */
function Nav() {
  const [scrolled, setScrolled] = useStateSec(false);
  useEffectSec(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className={"nav" + (scrolled ? " scrolled" : "")}>
      <div className="nav-in">
        <a className="brand" href="#top" aria-label="Hyperion Card Studio">
          <span className="brand-mark"><BrandMark size={24} /></span>
          <span className="brand-name"><b>Hyperion</b> <span className="sub">Card Studio</span></span>
        </a>
        <nav className="nav-links">
          <a href="Templates.html">Templates</a>
          <a href="Cards.html">Cards</a>
          <a href="Features.html">Features</a>
          <a href="Pricing.html">Pricing</a>
        </nav>
        <div className="nav-cta">
          <a className="btn btn-ghost btn-sm" href="#">Sign in</a>
          <a className="btn btn-primary btn-sm" href="Order.html">Get your card</a>
        </div>
      </div>
    </header>
  );
}

/* ---------- hero ---------- */
function Hero({ person, heroTpl, setHeroTpl, copy }) {
  return (
    <section className="hero" id="top">
      <div className="hero-bg" />
      <div className="hero-grid-tex" />
      <div className="wrap hero-in">
        <div className="hero-copy">
          <div className="hero-badge">
            <span className="tag">NFC + QR</span>
            One card. Every introduction.
          </div>
          <h1 className="hero-title">{copy.heroTitle}</h1>
          <p className="hero-sub">{copy.heroSub}</p>
          <div className="hero-actions">
            <a className="btn btn-primary btn-lg" href="Order.html">Get your card <IconArrowRight size={17} /></a>
            <a className="btn btn-ghost btn-lg" href="Templates.html">Browse templates</a>
          </div>
          <div className="hero-meta">
            <span><i className="dot" />Works on any phone</span>
            <span><i className="dot" />No app to install</span>
            <span><i className="dot" />Updates anytime</span>
          </div>
        </div>

        <div className="hero-stage">
          <div className="hero-card-mount" style={{ width: "min(340px, 80vw)" }}>
            <CardPreview tpl={heroTpl} data={person} interactive enter portraitSlot
                         key={heroTpl} />
          </div>
          <div className="tpl-switch" role="tablist" aria-label="Card template">
            {TEMPLATES.map((t) => (
              <button key={t.key} data-on={t.key === heroTpl ? "1" : "0"}
                      onClick={() => setHeroTpl(t.key)} role="tab"
                      aria-selected={t.key === heroTpl}>
                <span className="swatch" style={{ background: t.swatch }} />{t.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- trust strip ---------- */
const TRUST = ["Northbound", "Atlas Group", "Field Notes", "Vantage", "Looma", "Cedar & Co"];
function Trust() {
  return (
    <div className="trust">
      <div className="wrap trust-in">
        <span className="trust-label">Carried by people who introduce themselves for a living</span>
        <div className="trust-logos">
          {TRUST.map((n) => <span key={n}>{n}</span>)}
        </div>
      </div>
    </div>
  );
}

/* ---------- how it works ---------- */
const STEPS = [
  { icon: IconPalette, t: "Design your card",
    p: "Start from a template, drop in your details, photo, and links. Restyle the look and color anytime — no reprint required." },
  { icon: IconNfc, t: "Tap or scan to share",
    p: "Hold your card to any phone, or let them scan the QR. Your card opens instantly in the browser — no app on either side." },
  { icon: IconDownload, t: "They save you instantly",
    p: "One tap adds you to their contacts with everything attached. You stay in their phone, not at the bottom of a drawer." },
];
function HowItWorks() {
  return (
    <section className="section" id="how">
      <div className="wrap">
        <div className="sec-head reveal">
          <div className="eyebrow">How it works</div>
          <h2 className="h-sec">From hello to saved, in a single tap</h2>
          <p className="lede">No printing runs. No re-orders when something changes. Just a card that
            does the introducing — and keeps itself current.</p>
        </div>
        <div className="steps">
          {STEPS.map((s, i) => (
            <div className="step reveal" key={s.t} style={{ transitionDelay: i * 70 + "ms" }}>
              <div className="step-n">STEP {String(i + 1).padStart(2, "0")}</div>
              <div className="step-ico"><s.icon size={21} /></div>
              <h3>{s.t}</h3>
              <p>{s.p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- template gallery ---------- */
function Gallery({ person }) {
  return (
    <section className="section alt" id="templates">
      <div className="wrap">
        <div className="gallery-head reveal">
          <div className="sec-head">
            <div className="eyebrow">Templates</div>
            <h2 className="h-sec">A card for your trade — not a costume</h2>
            <p className="lede">Every profession has a way it wants to be seen. Pick the one that fits how
              you work — each carries the same depth underneath, finished for the part.</p>
          </div>
          <a className="btn-link" href="Templates.html">Browse all templates <IconArrowRight size={15} /></a>
        </div>
        <div className="gallery-grid">
          {TEMPLATES.map((t, i) => (
            <div className="tpl-card reveal" key={t.key} style={{ transitionDelay: (i % 3) * 60 + "ms" }}>
              <div className="tpl-card-stage">
                <div style={{ width: "100%", maxWidth: 200 }}>
                  <CardPreview tpl={t.key} data={galleryPersonFor(t.key, person)} />
                </div>
              </div>
              <div className="tpl-card-meta">
                <div>
                  <h4>{t.name}</h4>
                  <div className="tpl-tag">{t.profession}</div>
                </div>
                <span className="tpl-dot"><i style={{ background: t.swatch }} /></span>
              </div>
            </div>
          ))}
          <div className="tpl-card reveal" style={{ display: "grid", placeItems: "center", minHeight: 280 }}>
            <a href="Order.html" style={{ textAlign: "center", padding: "30px", display: "grid", gap: 14, placeItems: "center" }}>
              <span className="step-ico" style={{ margin: 0 }}><IconPlus size={20} /></span>
              <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>Start from blank</span>
              <span style={{ fontSize: 13, color: "var(--ink-mute)" }}>Build your own from scratch</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
// personas now live in personas.jsx (window.personaFor / galleryPersonFor)

/* ---------- features ---------- */
function Features() {
  return (
    <section className="section" id="features">
      <div className="wrap">
        <div className="sec-head reveal">
          <div className="eyebrow">What's inside</div>
          <h2 className="h-sec">More than a name on a rectangle</h2>
          <p className="lede">The card you hand over is the easy part. What makes it worth keeping is
            everything it quietly does after the tap.</p>
        </div>

        <div className="bento">
          <div className="feat col-3 tall reveal">
            <div className="feat-ico"><IconRefresh size={20} /></div>
            <h3>Always up to date</h3>
            <p>Change roles, numbers, or links once. Every card you've ever shared updates itself —
              no reprint, no awkward “ignore the old number” text.</p>
            <div className="feat-fig">
              <div className="fig-stack">
                <div className="fig-row"><span className="ic"><IconCheck size={14} /></span>Title updated <span className="v">live</span></div>
                <div className="fig-row"><span className="ic"><IconCheck size={14} /></span>New portfolio link <span className="v">added</span></div>
              </div>
            </div>
          </div>

          <div className="feat col-3 tall reveal" style={{ transitionDelay: "70ms" }}>
            <div className="feat-ico"><IconNfc size={20} /></div>
            <h3>Tap or scan, anywhere</h3>
            <p>NFC for a quick tap, QR for everything else. Works on any modern phone, with nothing to
              download on your side or theirs.</p>
            <div className="feat-fig">
              <div className="fig-chips">
                {["NFC tap", "QR code", "vCard", "Apple & Google Wallet", "Share link"].map((c) =>
                  <span className="fig-chip" key={c}>{c}</span>)}
              </div>
            </div>
          </div>

          <div className="feat col-2 reveal">
            <div className="feat-ico"><IconDownload size={20} /></div>
            <h3>Save to contacts</h3>
            <p>One tap writes a full contact — name, photo, role, and every link — straight into their phone.</p>
          </div>

          <div className="feat col-2 reveal" style={{ transitionDelay: "70ms" }}>
            <div className="feat-ico"><IconChart size={20} /></div>
            <h3>Know what lands</h3>
            <p>See taps, saves, and link clicks over time, so you know which intros turn into conversations.</p>
            <div className="feat-fig">
              <div className="fig-bars">
                {[34, 52, 41, 68, 58, 82, 74].map((h, i) => <i key={i} style={{ height: h + "%" }} />)}
              </div>
            </div>
          </div>

          <div className="feat col-2 reveal" style={{ transitionDelay: "140ms" }}>
            <div className="feat-ico"><IconShield size={20} /></div>
            <h3>Yours, protected</h3>
            <p>You own what's on your card and can pause sharing any time. Lose the card? Disable it in seconds.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- use cases ---------- */
const USES = [
  { icon: IconBriefcase, t: "Founders & execs", p: "Lead with a card as considered as the company." },
  { icon: IconUsers,     t: "Sales & client teams", p: "Turn every handshake into a saved contact." },
  { icon: IconCamera,    t: "Designers & creatives", p: "Let the card show the work, not just the title." },
  { icon: IconSparkle,   t: "Consultants", p: "One link to everything you offer." },
  { icon: IconHome,      t: "Real estate", p: "Share listings and details on the spot." },
  { icon: IconMic,       t: "Speakers & recruiters", p: "Get saved by a room, not a paper stack." },
];
function UseCases() {
  return (
    <section className="section alt" id="uses">
      <div className="wrap">
        <div className="sec-head reveal">
          <div className="eyebrow">Who it's for</div>
          <h2 className="h-sec">Made for anyone who hands over a name</h2>
          <p className="lede">A business card is agnostic — so this one bends to your line of work, not
            the other way around.</p>
        </div>
        <div className="uses">
          {USES.map((u, i) => (
            <div className="use reveal" key={u.t} style={{ transitionDelay: (i % 3) * 60 + "ms" }}>
              <div className="use-ico"><u.icon size={19} /></div>
              <div>
                <h4>{u.t}</h4>
                <p>{u.p}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- pricing ---------- */
const TIERS = [
  { name: "Starter", price: "$0", per: "free forever", desc: "Your digital card and QR, ready to share today.",
    feats: ["1 digital card", "QR sharing", "Save-to-contacts", "Core templates"], cta: "Start free", cls: "btn-soft" },
  { name: "Pro", price: "$9", per: "/ month", desc: "A physical NFC card plus the tools to make it count.",
    feats: ["Everything in Starter", "NFC card included", "All templates + custom color", "Custom link & domain", "Tap & save analytics"],
    cta: "Get Pro", cls: "btn-primary", featured: true },
  { name: "Team", price: "Custom", per: "per seat", desc: "One brand, many cards, managed in one place.",
    feats: ["Everything in Pro", "Bulk NFC cards", "Shared brand kit", "Admin dashboard", "Priority support"], cta: "Talk to us", cls: "btn-soft" },
];
function Pricing() {
  return (
    <section className="section" id="pricing">
      <div className="wrap">
        <div className="sec-head center reveal">
          <div className="eyebrow center">Pricing</div>
          <h2 className="h-sec">Start free. Upgrade when you're ready.</h2>
          <p className="lede">Try the digital card on us. Add a physical NFC card whenever you want one
            in your pocket.</p>
        </div>
        <div className="tiers">
          {TIERS.map((tr, i) => (
            <div className={"tier reveal" + (tr.featured ? " featured" : "")} key={tr.name}
                 style={{ transitionDelay: i * 70 + "ms" }}>
              {tr.featured && <div className="tier-flag">Most popular</div>}
              <div className="tier-name">{tr.name}</div>
              <div className="tier-price"><span className="amt">{tr.price}</span><span className="per">{tr.per}</span></div>
              <div className="tier-desc">{tr.desc}</div>
              <ul>
                {tr.feats.map((f) => <li key={f}><IconCheck size={16} />{f}</li>)}
              </ul>
              <a className={"btn " + tr.cls} href={tr.name === "Team" ? "Pricing.html" : "Order.html"}>{tr.cta}</a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- faq ---------- */
const FAQS = [
  { q: "Do people need an app to receive my card?",
    a: "No. Tapping or scanning opens your card in any phone's browser, and saving you to contacts is a single tap. There's nothing to install on either side." },
  { q: "Which phones support tap-to-share?",
    a: "Virtually all modern iPhones and Android phones read NFC. For anything older or NFC-off, the printed QR code does exactly the same job." },
  { q: "Can I change my details after I order?",
    a: "Yes — that's the whole point. Edit your card anytime and every card you've already shared updates instantly. The physical card never goes out of date." },
  { q: "What if I lose my card?",
    a: "Disable it from your dashboard in seconds so it can't be tapped, then order a replacement linked to the very same profile." },
  { q: "Is my information private?",
    a: "You decide what appears on your card and can pause sharing whenever you like. We don't sell your data — ever." },
];
function Faq() {
  const [open, setOpen] = useStateSec(0);
  return (
    <section className="section alt" id="faq">
      <div className="wrap">
        <div className="sec-head reveal">
          <div className="eyebrow">Questions</div>
          <h2 className="h-sec">Good to know</h2>
        </div>
        <div className="faq-list reveal">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div className="faq-item" key={i} data-open={isOpen ? "1" : "0"}>
                <button className="faq-q" onClick={() => setOpen(isOpen ? -1 : i)} aria-expanded={isOpen}>
                  {f.q}
                  <span className="faq-icon"><IconPlus size={18} /></span>
                </button>
                <div className="faq-a" style={{ maxHeight: isOpen ? "240px" : "0" }}>
                  <div className="faq-a-in">{f.a}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- final cta ---------- */
function FinalCta({ copy }) {
  return (
    <section className="section" id="get">
      <div className="wrap">
        <div className="cta reveal">
          <div className="eyebrow center">Get your card</div>
          <h2>{copy.ctaTitle}</h2>
          <p className="lede">Design your card in minutes. Hand it over for years.</p>
          <div className="cta-actions">
            <a className="btn btn-primary btn-lg" href="Order.html">Get your card <IconArrowRight size={17} /></a>
            <a className="btn btn-ghost btn-lg" href="Templates.html">Browse templates</a>
          </div>
          <div className="cta-note">Free to start · NFC card from $39 · No app required</div>
        </div>
      </div>
    </section>
  );
}

/* ---------- footer ---------- */
const FOOTER_COLS = [
  { h: "Product", links: ["Templates", "Features", "Pricing", "NFC cards"] },
  { h: "Company", links: ["About", "Careers", "Contact", "Press"] },
  { h: "Resources", links: ["Help center", "Setup guide", "Privacy", "Terms"] },
];
function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div className="footer-brand">
            <a className="brand" href="#top">
              <span className="brand-mark"><BrandMark size={24} /></span>
              <span className="brand-name"><b>Hyperion</b> <span className="sub">Card Studio</span></span>
            </a>
            <p>Smart cards by Hyperion. Designed to be handed over — and kept.</p>
          </div>
          {FOOTER_COLS.map((c) => (
            <div className="footer-col" key={c.h}>
              <h5>{c.h}</h5>
              {c.links.map((l) => <a href="#" key={l}>{l}</a>)}
            </div>
          ))}
        </div>
        <div className="footer-bar">
          <span>© 2026 Hyperion Industries · Card Studio</span>
          <span><span className="gold-diamond" />Built to survive the next conversation</span>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, {
  Nav, Hero, Trust, HowItWorks, Gallery, Features, UseCases, Pricing, Faq, FinalCta, Footer,
});
