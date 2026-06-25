// =========================================================
// Features page — interactive breakdown. A few marquee features
// as alternating rows with live demo art, then the rest in a grid.
// =========================================================

const { useState: useStateFeat, useEffect: useEffectFeat } = React;

/* ---- demo art ---- */
function ArtTap() {
  return (
    <div className="demo-tap">
      <span className="ring" /><span className="ring" /><span className="ring" />
      <span className="core"><IconNfc size={22} /></span>
    </div>
  );
}
function ArtSave() {
  return (
    <div className="demo-phone-mini">
      <div className="scr">
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--accent-soft)", border: "1px solid var(--accent-line)" }} />
          <div style={{ display: "grid", gap: 5, flex: 1 }}>
            <div className="demo-line" style={{ width: "70%" }} />
            <div className="demo-line accent" style={{ width: "45%", height: 7 }} />
          </div>
        </div>
        <div className="demo-line" style={{ width: "100%" }} />
        <div className="demo-line" style={{ width: "85%" }} />
        <div style={{ marginTop: 4, height: 26, borderRadius: 8, background: "var(--accent)", display: "grid", placeItems: "center", color: "var(--accent-ink)", fontSize: 9, fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}>+ ADD CONTACT</div>
      </div>
    </div>
  );
}
function ArtUpdate() {
  const [on, setOn] = useStateFeat(false);
  useEffectFeat(() => { const id = setInterval(() => setOn((o) => !o), 1600); return () => clearInterval(id); }, []);
  return (
    <div style={{ display: "grid", gap: 10, width: 220 }}>
      {["Title", "Phone", "Portfolio link"].map((k, i) => (
        <div key={k} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", border: "1px solid var(--hair)", borderRadius: 10, background: "var(--surface-2)" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-mute)", width: 70 }}>{k}</span>
          <span style={{ flex: 1, height: 8, borderRadius: 5, background: on ? "var(--accent)" : "var(--surface-3)", transition: "background .5s", transitionDelay: i * 100 + "ms", opacity: on ? 0.85 : 1 }} />
          <span style={{ color: "var(--accent)", opacity: on ? 1 : 0, transition: "opacity .4s", transitionDelay: i * 100 + "ms" }}><IconCheck size={14} /></span>
        </div>
      ))}
    </div>
  );
}
function ArtAnalytics() {
  return <div className="demo-bars" style={{ width: 220 }}>{[34, 52, 41, 68, 58, 82, 74, 90].map((h, i) => <i key={i} style={{ height: h + "%" }} />)}</div>;
}
function ArtLink() {
  return (
    <div className="demo-chips">
      {["hyperion.card/you", "you.com", "@you", "linktr.ee/you"].map((c, i) => (
        <span className="c" key={c} style={{ borderColor: i === 0 ? "var(--accent-line)" : "var(--hair)", color: i === 0 ? "var(--accent)" : "var(--ink-dim)" }}>{c}</span>
      ))}
    </div>
  );
}
function ArtQr() {
  const cells = window.qrCells ? window.qrCells("features-demo") : [];
  return (
    <div style={{ width: 120, height: 120, padding: 10, border: "1px solid var(--hair)", borderRadius: 12, background: "var(--surface)", display: "grid", gridTemplateColumns: "repeat(7,1fr)", gridTemplateRows: "repeat(7,1fr)", gap: 3 }}>
      {cells.map((on, i) => <span key={i} style={{ background: on ? "var(--ink)" : "transparent", borderRadius: 2 }} />)}
    </div>
  );
}

const MARQUEE = [
  { key: "tap",    art: ArtTap },
  { key: "qr",     art: ArtQr },
  { key: "save",   art: ArtSave },
  { key: "update", art: ArtUpdate },
  { key: "chart",  art: ArtAnalytics },
  { key: "link",   art: ArtLink },
];
const MARQUEE_NAMES = { tap: "Tap to share", qr: "QR backup", save: "Save to contacts", update: "Always up to date", chart: "Tap & scan analytics", link: "Custom link & domain" };

function FeatureRow({ feat, ArtComp }) {
  const Icon = window[feat.icon] || IconBolt;
  return (
    <div className="fbreak-row reveal">
      <div className="fbreak-copy">
        <div className="feat-ico"><Icon size={20} /></div>
        <div className="one">{feat.one}</div>
        <h3>{feat.name}</h3>
        <p>{feat.blurb}</p>
      </div>
      <div className="fbreak-art"><ArtComp /></div>
    </div>
  );
}

function FeaturesPage() {
  useReveal();
  const byName = Object.fromEntries(CATALOG.features.map((f) => [f.name, f]));
  const marquee = MARQUEE.map((m) => ({ ...m, feat: byName[MARQUEE_NAMES[m.key]] })).filter((m) => m.feat);
  const marqueeNames = new Set(marquee.map((m) => m.feat.name));
  const rest = CATALOG.features.filter((f) => !marqueeNames.has(f.name));

  return (
    <>
      <SiteNav active="features" />
      <main>
        <PageHero
          crumb="Features"
          title={<>Everything a card does <span className="accent">after the tap</span></>}
          lede="The handshake is the easy part. These are the things that make a Hyperion card worth keeping — and worth carrying."
        />

        <section className="section">
          <div className="wrap">
            <div className="fbreak">
              {marquee.map((m) => <FeatureRow key={m.key} feat={m.feat} ArtComp={m.art} />)}
            </div>
          </div>
        </section>

        <section className="section alt">
          <div className="wrap">
            <div className="sec-head reveal">
              <div className="eyebrow">And more</div>
              <h2 className="h-sec">Built in, not bolted on</h2>
            </div>
            <div className="uses">
              {rest.map((f) => {
                const Icon = window[f.icon] || IconBolt;
                return (
                  <div className="use reveal" key={f.name}>
                    <div className="use-ico"><Icon size={19} /></div>
                    <div><h4>{f.name}</h4><p>{f.one}</p></div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <CtaBand title="See it on your own card" sub="Build a card in minutes and watch every feature come to life." cta="Build your card" />
      </main>
      <SiteFooter />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<FeaturesPage />);
