// =========================================================
// Pricing page — tier cards, full comparison matrix, card
// add-on prices, and pricing FAQ. Numbers live in catalog.jsx.
// =========================================================

const TIER_FEATS = {
  starter: ["1 digital card", "NFC tap + QR sharing", "Save-to-contacts", "Apple & Google Wallet", "Core templates"],
  pro:     ["Everything in Starter", "1 PVC card included", "All 8 templates + custom color", "Custom link & domain", "Tap & scan analytics", "Lead capture form"],
  team:    ["Everything in Pro", "Bulk PVC & metal pricing", "Shared brand kit", "Admin dashboard", "Priority support"],
};

function Cell({ v }) {
  if (v === true) return <span className="yes"><IconCheck size={15} /></span>;
  if (v === false) return <span className="no">—</span>;
  return <span>{v}</span>;
}

function PricingPage() {
  useReveal();
  const tiers = CATALOG.tiers;
  return (
    <>
      <SiteNav active="pricing" />
      <main>
        <PageHero
          crumb="Pricing"
          title={<>Start free. Upgrade <span className="accent">when you're ready.</span></>}
          lede="The digital card is free forever. Add a physical card or the Pro tools whenever you want more — no contracts, no surprises."
        />

        {/* tier cards */}
        <section className="section tight">
          <div className="wrap">
            <div className="tiers">
              {tiers.map((tr) => (
                <div className={"tier reveal" + (tr.featured ? " featured" : "")} key={tr.key}>
                  {tr.featured && <div className="tier-flag">Most popular</div>}
                  <div className="tier-name">{tr.name}</div>
                  <div className="tier-price">
                    <span className="amt">{tr.price}</span><span className="per">{tr.per}</span>
                  </div>
                  {tr.note && <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-mute)", marginTop: -2, marginBottom: 4 }}>{tr.note}</div>}
                  <div className="tier-desc">{tr.desc}</div>
                  <ul>
                    {TIER_FEATS[tr.key].map((f) => <li key={f}><IconCheck size={16} />{f}</li>)}
                  </ul>
                  <a className={"btn " + (tr.featured ? "btn-primary" : "btn-soft")}
                     href={tr.key === "team" ? "#" : "Order.html"}>{tr.cta}</a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* comparison matrix */}
        <section className="section">
          <div className="wrap">
            <div className="sec-head reveal">
              <div className="eyebrow">Compare plans</div>
              <h2 className="h-sec">Every detail, side by side</h2>
            </div>
            <div className="cmp-wrap reveal">
              <table className="cmp">
                <thead>
                  <tr>
                    <th className="col-feat">Feature</th>
                    <th><div className="plan">Starter<span className="p">Free</span></div></th>
                    <th className="featured-col"><div className="plan">Pro<span className="p">$9/mo</span></div></th>
                    <th><div className="plan">Team<span className="p">Custom</span></div></th>
                  </tr>
                </thead>
                <tbody>
                  {CATALOG.planMatrix.map((row) => (
                    <tr key={row.label}>
                      <td className="feat">{row.label}</td>
                      <td className="val"><Cell v={row.starter} /></td>
                      <td className="val featured-col"><Cell v={row.pro} /></td>
                      <td className="val"><Cell v={row.team} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* card add-ons */}
        <section className="section alt">
          <div className="wrap">
            <div className="sec-head reveal">
              <div className="eyebrow">Physical cards</div>
              <h2 className="h-sec">Add a card to any plan</h2>
              <p className="lede">Physical cards are a one-time purchase — reorders are free when your details change.</p>
            </div>
            <div className="mat-grid">
              {CATALOG.materials.filter((m) => m.priceFrom > 0).map((m) => {
                const Icon = window[m.icon] || IconLayers;
                return (
                  <div className="mat-card reveal" key={m.key}>
                    {m.tag && <div className="mat-flag">{m.tag}</div>}
                    <div className="mat-ico"><Icon size={22} /></div>
                    <h3>{m.name}</h3>
                    <div className="mat-meta" style={{ marginTop: 12 }}>
                      <span className="from">from</span><span className="amt">${m.priceFrom}</span>
                      <span className="wt">{m.weight}</span>
                    </div>
                    <p className="mat-blurb">{m.lead} {m.bullets[0]}.</p>
                    <a className="btn btn-soft" href={"Order.html?card=" + m.key}>Order {m.name.split(" ")[0]} <IconArrowRight size={15} /></a>
                  </div>
                );
              })}
              <div className="mat-card reveal" style={{ justifyContent: "center", alignItems: "flex-start" }}>
                <div className="mat-ico"><IconUsers size={22} /></div>
                <h3>Team orders</h3>
                <p className="mat-blurb">Outfitting a whole team? Bulk pricing on PVC and metal, one brand kit, one invoice.</p>
                <a className="btn btn-soft" href="#">Talk to sales <IconArrowRight size={15} /></a>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="section">
          <div className="wrap">
            <div className="sec-head reveal">
              <div className="eyebrow">Questions</div>
              <h2 className="h-sec">Pricing, explained</h2>
            </div>
            <div className="reveal"><FaqList items={CATALOG.faqs.pricing} /></div>
          </div>
        </section>

        <CtaBand title="Your first card is free" sub="Claim your digital card now — add a physical one whenever you're ready." cta="Start free" />
      </main>
      <SiteFooter />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<PricingPage />);
