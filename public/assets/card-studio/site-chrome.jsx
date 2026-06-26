// =========================================================
// Shared site chrome for sub-pages — nav, footer, page hero,
// FAQ accordion, CTA band, and the reveal-on-scroll hook.
// Reuses .nav / .footer styles from studio.css.
// =========================================================

const { useState: useStateChrome, useEffect: useEffectChrome } = React;

const NAV_LINKS = [
  { key: "templates", label: "Templates", href: "Templates.html" },
  { key: "cards",     label: "Cards",     href: "Cards.html" },
  { key: "features",  label: "Features",  href: "Features.html" },
  { key: "pricing",   label: "Pricing",   href: "Pricing.html" },
];
const HOME_HREF = "Hyperion Card Studio.html";
const ORDER_HREF = "Order.html";

function SiteBrand({ href = HOME_HREF }) {
  return (
    <a className="brand" href={href} aria-label="Hyperion Card Studio">
      <span className="brand-mark"><BrandMark size={24} /></span>
      <span className="brand-name"><b>Hyperion</b> <span className="sub">Card Studio</span></span>
    </a>
  );
}

function SiteNav({ active }) {
  const [scrolled, setScrolled] = useStateChrome(false);
  useEffectChrome(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on(); window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className={"nav" + (scrolled ? " scrolled" : "")}>
      <div className="nav-in">
        <SiteBrand />
        <nav className="nav-links">
          {NAV_LINKS.map((l) => (
            <a key={l.key} href={l.href} className={l.key === active ? "active" : ""}>{l.label}</a>
          ))}
        </nav>
        <div className="nav-cta">
          <a className="btn btn-ghost btn-sm" href="#">Sign in</a>
          <a className="btn btn-primary btn-sm" href={ORDER_HREF}>Get your card</a>
        </div>
      </div>
    </header>
  );
}

function PageHero({ crumb, title, lede }) {
  return (
    <section className="page-hero">
      <div className="page-hero-bg" />
      <div className="wrap">
        <div className="breadcrumb">
          <a href={HOME_HREF}>Home</a>
          <span className="sep">/</span>
          <span>{crumb}</span>
        </div>
        <h1 className="page-title">{title}</h1>
        {lede && <p className="page-lede">{lede}</p>}
      </div>
    </section>
  );
}

function FaqList({ items, start = 0 }) {
  const [open, setOpen] = useStateChrome(start);
  return (
    <div className="faq-list">
      {items.map((f, i) => {
        const isOpen = open === i;
        return (
          <div className="faq-item" key={i} data-open={isOpen ? "1" : "0"}>
            <button className="faq-q" onClick={() => setOpen(isOpen ? -1 : i)} aria-expanded={isOpen}>
              {f.q}<span className="faq-icon"><IconPlus size={18} /></span>
            </button>
            <div className="faq-a" style={{ maxHeight: isOpen ? "260px" : "0" }}>
              <div className="faq-a-in">{f.a}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CtaBand({ title = "Ready when you are", sub = "Design your card in minutes. Hand it over for years.", cta = "Get your card", href = ORDER_HREF }) {
  return (
    <section className="section cta-band">
      <div className="wrap">
        <div className="cta reveal">
          <div className="eyebrow center">Get started</div>
          <h2>{title}</h2>
          <p className="lede">{sub}</p>
          <div className="cta-actions">
            <a className="btn btn-primary btn-lg" href={href}>{cta} <IconArrowRight size={17} /></a>
            <a className="btn btn-ghost btn-lg" href="Templates.html">Browse templates</a>
          </div>
          <div className="cta-note">Free to start · NFC card from $39 · No app required</div>
        </div>
      </div>
    </section>
  );
}

const FOOTER_COLS = [
  { h: "Product", links: [["Templates", "Templates.html"], ["Cards", "Cards.html"], ["Features", "Features.html"], ["Pricing", "Pricing.html"]] },
  { h: "Company", links: [["About", "#"], ["Careers", "#"], ["Contact", "#"], ["Press", "#"]] },
  { h: "Resources", links: [["Help center", "#"], ["Setup guide", "#"], ["Privacy", "#"], ["Terms", "#"]] },
];
function SiteFooter() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div className="footer-brand">
            <SiteBrand />
            <p style={{ marginTop: 16 }}>Smart cards by Hyperion. Designed to be handed over — and kept.</p>
          </div>
          {FOOTER_COLS.map((c) => (
            <div className="footer-col" key={c.h}>
              <h5>{c.h}</h5>
              {c.links.map(([l, href]) => <a href={href} key={l}>{l}</a>)}
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

// reveal-on-scroll — call once at the top of a page component
function useReveal() {
  useEffectChrome(() => {
    const els = Array.from(document.querySelectorAll(".reveal"));
    if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach((e) => e.classList.add("in")); return;
    }
    const io = new IntersectionObserver((ents) => {
      ents.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
}

Object.assign(window, { SiteNav, SiteFooter, SiteBrand, PageHero, FaqList, CtaBand, useReveal, HOME_HREF, ORDER_HREF });
