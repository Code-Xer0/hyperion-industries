// =========================================================
// OrderSection — phone-first configurator.
// PRIMARY: the portrait card as it opens on a recipient's
// phone. SECONDARY: the physical card you hand over.
// Both track the chosen template + finish.
// =========================================================

const { useState: useStateOrder } = React;

function handleFor(data) {
  const first = (data.name || "you").split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, "");
  return "hyperion.card/" + (first || "you");
}

function catalogCardOptions() {
  const catalog = window.CATALOG;
  if (!catalog) return [];
  return catalog.materials
    .filter((material) => material.priceFrom > 0)
    .flatMap((material) => (catalog.finishes[material.key] || []).map((finish) => {
      const price = material.priceFrom + (finish.delta || 0);
      return {
        key: material.key + ":" + finish.key,
        cardKey: material.key,
        finishKey: finish.key,
        name: material.name + " · " + finish.name,
        note: finish.note,
        price,
      };
    }));
}

function OrderSection({ person }) {
  const [tpl, setTpl] = useStateOrder("ivory");
  const options = catalogCardOptions();
  const [optionKey, setOptionKey] = useStateOrder("pvc:matte");
  const meta = (window.TEMPLATE_MAP && window.TEMPLATE_MAP[tpl]) || TEMPLATES[1];
  const data = window.galleryPersonFor ? window.galleryPersonFor(tpl, person) : person;
  const choice = options.find((f) => f.key === optionKey) || options[0] || { key: "digital", cardKey: "digital", name: "Digital Card", note: "Live profile + QR, free forever", price: 0 };

  return (
    <section className="section alt" id="order">
      <div className="wrap">
        <div className="sec-head reveal">
          <div className="eyebrow">Your card, live</div>
          <h2 className="h-sec">This is what a tap opens on their phone</h2>
          <p className="lede">Your card is made to be read on a screen — it opens full-height in any phone's
            browser the instant someone taps or scans. Pick a template and watch it change.</p>
        </div>

        <div className="order-grid">
          <div className="order-stage reveal">
            <div className="order-cap">On their phone</div>
            <div className="phone">
              <div className="phone-island" />
              <div className="phone-screen">
                <div className="phone-status">
                  <span>9:41</span>
                  <span className="url"><i />{handleFor(data)}</span>
                  <span>5G</span>
                </div>
                <div className="phone-card">
                  <CardPreview tpl={tpl} data={data} interactive key={tpl} />
                </div>
              </div>
            </div>
          </div>

          <div className="order-panel reveal">
            <div className="op-head">
              <div className="op-title">{meta.name}</div>
              <div className="op-sub">{meta.profession}</div>
            </div>

            <div className="op-group">
              <div className="op-group-label">Template</div>
              <div className="op-swatches">
                {TEMPLATES.map((x) => (
                  <button key={x.key} className="op-swatch" data-on={x.key === tpl ? "1" : "0"}
                          onClick={() => setTpl(x.key)}>
                    <i style={{ background: x.swatch }} />{x.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="op-group">
              <div className="op-group-label">Physical card</div>
              <div className="op-finishes">
                {options.map((f) => (
                  <button key={f.key} className="op-finish" data-on={f.key === choice.key ? "1" : "0"}
                          onClick={() => setOptionKey(f.key)}>
                    <span className="radio" />
                    <span className="f-meta">
                      <span className="f-name">{f.name}</span>
                      <span className="f-note">{f.note}</span>
                    </span>
                    <span className="f-price">${f.price}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="op-incl"><IconCheck size={16} />Digital card is free — physical card is optional</div>

            <div className="op-buy">
              <div className="price"><span className="amt">${choice.price}</span><span className="per">one-time · free reorders</span></div>
              <a className="btn btn-primary" href={"Order.html?card=" + choice.cardKey}>Claim your card <IconArrowRight size={16} /></a>
            </div>
          </div>
        </div>

        <div className="physical-strip reveal">
          <div className="ps-copy">
            <div className="eyebrow">Also ships physical</div>
            <h4>And a card to hand over</h4>
            <p>Every order includes a printed NFC card in your finish. Tap it to any phone and it opens the
              very same profile — front carries your details, back carries your code.</p>
          </div>
          <div className="ps-cards">
            <figure>
              <div className="pc-slot"><PhysicalCard tpl={tpl} data={data} side="front" /></div>
              <figcaption>Front</figcaption>
            </figure>
            <figure>
              <div className="pc-slot"><PhysicalCard tpl={tpl} data={data} side="back" /></div>
              <figcaption>Back</figcaption>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { OrderSection });
