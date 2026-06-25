// =========================================================
// Cards page — digital / PVC / metal NFC. Material comparison,
// showcases with physical previews, chip + spec breakdown,
// finishes, and FAQ.
// =========================================================

function MaterialCard({ mat }) {
  const Icon = window[mat.icon] || IconLayers;
  const featured = mat.key === "pvc";
  return (
    <div className={"mat-card reveal" + (featured ? " featured" : "")}>
      {mat.tag && <div className="mat-flag">{mat.tag}</div>}
      <div className="mat-ico"><Icon size={22} /></div>
      <h3>{mat.name}</h3>
      <div className="mat-lead">{mat.lead}</div>
      <p className="mat-blurb">{mat.blurb}</p>
      <div className="mat-meta">
        {mat.priceFrom > 0
          ? <><span className="from">from</span><span className="amt">${mat.priceFrom}</span></>
          : <span className="amt">Free</span>}
        <span className="wt">{mat.weight}</span>
      </div>
      <ul className="mat-bullets">
        {mat.bullets.map((b) => <li key={b}><IconCheck size={15} />{b}</li>)}
      </ul>
      <a className={"btn " + (featured ? "btn-primary" : "btn-soft")}
         href={mat.key === "digital" ? "Order.html" : "Order.html?card=" + mat.key}>
        {mat.key === "digital" ? "Start free" : "Order " + mat.name.split(" ")[0]} <IconArrowRight size={15} />
      </a>
    </div>
  );
}

function Showcase({ tpl, side, cap, title, body, flip, extra }) {
  const data = personaFor(tpl, DEFAULT_PERSON);
  return (
    <div className={"cardshow reveal" + (flip ? " flip" : "")}>
      <div className="cardshow-art">
        <div className="pc-slot"><PhysicalCard tpl={tpl} data={data} side="front" /></div>
        <div className="cardshow-cap">{cap}</div>
      </div>
      <div className="cardshow-copy">
        <h2>{title}</h2>
        <p>{body}</p>
        {extra}
      </div>
    </div>
  );
}

function FinishRow({ kind }) {
  const finishes = CATALOG.finishes[kind];
  return (
    <div className="spec-chips">
      {finishes.map((f) => (
        <span className="sc" key={f.key}>
          <IconSparkle size={13} />{f.name}{f.delta ? " · +$" + f.delta : ""}
        </span>
      ))}
    </div>
  );
}

function CardsPage() {
  useReveal();
  return (
    <>
      <SiteNav active="cards" />
      <main>
        <PageHero
          crumb="Cards"
          title={<>One profile. Three ways to <span className="accent">hand it over.</span></>}
          lede="Every card points at the same live profile — start free with digital, add a full-color PVC card, or step up to laser-engraved metal with real weight."
        />

        <section className="section">
          <div className="wrap">
            <div className="mat-grid">
              {CATALOG.materials.map((m) => <MaterialCard key={m.key} mat={m} />)}
            </div>
          </div>
        </section>

        {/* PVC showcase */}
        <section className="section alt">
          <div className="wrap">
            <Showcase
              tpl="ivory" side="front"
              cap="PVC · Soft-touch finish"
              title="PVC — the everyday card"
              body="Full-color edge-to-edge print on both faces with the NFC chip sealed invisibly inside. Light enough to forget in your wallet, tough enough to live there. Choose matte, gloss, or a velvet soft-touch."
              extra={<><div className="wiz-group-label" style={{ marginTop: 22 }}>Finishes</div><FinishRow kind="pvc" /><a className="btn btn-soft" style={{ marginTop: 24 }} href="Order.html?card=pvc">Order a PVC card <IconArrowRight size={15} /></a></>}
            />
          </div>
        </section>

        {/* Metal showcase */}
        <section className="section">
          <div className="wrap">
            <Showcase
              tpl="operator" side="front" flip
              cap="Metal · Laser-engraved steel"
              title="Metal — weight they remember"
              body="Brushed stainless steel, laser-engraved so your details are cut into the surface, not printed on it. The NFC chip sits in a discreet tap window on the reverse, keeping the metal face clean. It lands on the table with intent."
              extra={<><div className="wiz-group-label" style={{ marginTop: 22 }}>Finishes</div><FinishRow kind="metal" /><a className="btn btn-primary" style={{ marginTop: 24 }} href="Order.html?card=metal">Order a metal card <IconArrowRight size={15} /></a></>}
            />
          </div>
        </section>

        {/* chip + specs */}
        <section className="section alt">
          <div className="wrap">
            <div className="sec-head reveal">
              <div className="eyebrow">Under the surface</div>
              <h2 className="h-sec">The chip that does the talking</h2>
              <p className="lede">Every physical card carries an NFC Forum Type 2 chip and a printed QR backup. Bigger chips hold richer profiles — here's what fits where.</p>
            </div>
            <div className="chip-grid">
              {CATALOG.chips.map((c) => (
                <div className="chip-card reveal" key={c.key}>
                  {c.tag && <span className="tag">{c.tag}</span>}
                  <h4>{c.name}</h4>
                  <div className="mem">{c.mem}</div>
                  <div className="use">{c.use}</div>
                  <div className="note">{c.note}</div>
                </div>
              ))}
            </div>
            <div className="spec-chips reveal" style={{ marginTop: 30 }}>
              {CATALOG.chipSpecs.map((s) => (
                <span className="sc" key={s}><IconCheck size={13} />{s}</span>
              ))}
            </div>
          </div>
        </section>

        {/* how metal taps */}
        <section className="section">
          <div className="wrap">
            <div className="fbreak">
              <div className="fbreak-row reveal">
                <div className="fbreak-copy">
                  <div className="feat-ico"><IconNfc size={20} /></div>
                  <div className="one">Tapping metal</div>
                  <h3>Metal shields radio — so we engineer around it</h3>
                  <p>Solid steel blocks NFC signal, so a metal card's chip lives in a small non-metal window on the back. Hold that side to the top of any phone and your profile opens instantly — same tap, premium body.</p>
                </div>
                <div className="fbreak-art">
                  <div className="demo-tap">
                    <span className="ring" /><span className="ring" /><span className="ring" />
                    <span className="core"><IconNfc size={22} /></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="section alt">
          <div className="wrap">
            <div className="sec-head reveal">
              <div className="eyebrow">Questions</div>
              <h2 className="h-sec">Cards, explained</h2>
            </div>
            <div className="reveal"><FaqList items={CATALOG.faqs.cards} /></div>
          </div>
        </section>

        <CtaBand title="Pick your material" sub="Start free, then add the card that fits how you show up." cta="Build your card" />
      </main>
      <SiteFooter />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<CardsPage />);
