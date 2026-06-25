// =========================================================
// Templates page — all eight profession templates, filterable,
// each links into the order wizard with the template preselected.
// =========================================================

const { useState: useStateTpl } = React;

const TPL_CATEGORY = {
  slate: "Business", ivory: "Business",
  counsel: "Legal & Finance", sterling: "Legal & Finance",
  atelier: "Creative", meridian: "Creative",
  verdant: "Health", operator: "Tech",
};
const TPL_FILTERS = ["All", "Business", "Legal & Finance", "Creative", "Health", "Tech"];

function TemplateCard({ tpl }) {
  const data = personaFor(tpl.key, DEFAULT_PERSON);
  return (
    <div className="tpl-card reveal">
      <div className="tpl-card-stage">
        <div style={{ width: "100%", maxWidth: 212 }}>
          <CardPreview tpl={tpl.key} data={data} interactive />
        </div>
      </div>
      <div className="tpl-card-meta">
        <div>
          <h4>{tpl.name}</h4>
          <div className="tpl-tag">{tpl.profession}</div>
        </div>
        <span className="tpl-dot"><i style={{ background: tpl.swatch }} /></span>
      </div>
      <div style={{ padding: "0 20px 18px", display: "grid", gap: 12 }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-mute)" }}>
          {data.capability}
        </div>
        <a className="btn btn-soft btn-sm" href={"Order.html?tpl=" + tpl.key} style={{ width: "100%", justifyContent: "center" }}>
          Use this template <IconArrowRight size={15} />
        </a>
      </div>
    </div>
  );
}

function TemplatesPage() {
  useReveal();
  const [filter, setFilter] = useStateTpl("All");
  const shown = TEMPLATES.filter((t) => filter === "All" || TPL_CATEGORY[t.key] === filter);

  return (
    <>
      <SiteNav active="templates" />
      <main>
        <PageHero
          crumb="Templates"
          title={<>A card for your trade — <span className="accent">not a costume</span></>}
          lede="Eight starting points, each finished for a different profession: distinct typography, material, and detail — all running on the same smart card."
        />

        <section className="section">
          <div className="wrap">
            <div className="op-swatches" style={{ marginBottom: 8 }}>
              {TPL_FILTERS.map((f) => (
                <button key={f} className="op-swatch" data-on={f === filter ? "1" : "0"} onClick={() => setFilter(f)}>
                  {f}
                </button>
              ))}
            </div>

            <div className="gallery-grid" style={{ marginTop: 34 }}>
              {shown.map((t) => <TemplateCard key={t.key} tpl={t} />)}
            </div>

            <div className="reveal" style={{ marginTop: 40, padding: "26px 28px", border: "1px solid var(--hair)", borderRadius: "var(--radius-lg)", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
              <div>
                <h3 style={{ fontSize: 19, letterSpacing: "-0.02em", marginBottom: 6 }}>Don't see your fit?</h3>
                <p style={{ fontSize: 14, color: "var(--ink-dim)", margin: 0 }}>Start from any template and recolor, restyle, and rewrite it until it's unmistakably yours.</p>
              </div>
              <a className="btn btn-primary" href="Order.html">Start from blank <IconArrowRight size={16} /></a>
            </div>
          </div>
        </section>

        <CtaBand title="Pick a template, make it yours" sub="Your card is live in minutes — switch the look anytime without reprinting." />
      </main>
      <SiteFooter />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<TemplatesPage />);
