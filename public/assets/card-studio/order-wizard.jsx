// =========================================================
// Order wizard — 5 steps + confirmation, with a live phone
// preview. Reads ?tpl= and ?card= to preselect. Price comes
// from CATALOG (material base + finish delta).
// =========================================================

const { useState: useStateWiz, useEffect: useEffectWiz, useMemo: useMemoWiz } = React;

const STEPS = [
  { key: "template", label: "Template" },
  { key: "card",     label: "Card type" },
  { key: "finish",   label: "Finish" },
  { key: "details",  label: "Details" },
  { key: "review",   label: "Review" },
];

function getParam(name) {
  try { return new URLSearchParams(window.location.search).get(name); } catch (e) { return null; }
}
function initialsOf(name) {
  const p = String(name || "").trim().split(/\s+/);
  return ((p[0]?.[0] || "") + (p[1]?.[0] || "")).toUpperCase() || "—";
}
function handleOf(name) {
  const first = String(name || "you").split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, "");
  return "hyperion.card/" + (first || "you");
}

/* ---- live phone preview ---- */
function WizPhone({ tpl, data }) {
  return (
    <div className="phone">
      <div className="phone-island" />
      <div className="phone-screen">
        <div className="phone-status">
          <span>9:41</span>
          <span className="url"><i />{handleOf(data.name)}</span>
          <span>5G</span>
        </div>
        <div className="phone-card">
          <CardPreview tpl={tpl} data={data} interactive key={tpl} />
        </div>
      </div>
    </div>
  );
}

/* ---- steps ---- */
function StepTemplate({ tpl, setTpl }) {
  return (
    <div className="wiz-panel">
      <h2 className="wiz-h">Choose a starting point</h2>
      <p className="wiz-sub">Eight looks, each finished for a profession. You can recolor and rewrite any of them — pick whichever feels closest.</p>
      <div className="opt-templates">
        {TEMPLATES.map((t) => (
          <button key={t.key} className="opt-tpl" data-on={t.key === tpl ? "1" : "0"} onClick={() => setTpl(t.key)}>
            <span className="sw" style={{ background: t.swatch }} />
            <span className="nm">{t.name}</span>
            <span className="pf">{t.profession}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepCard({ cardKey, setCardKey }) {
  return (
    <div className="wiz-panel">
      <h2 className="wiz-h">Pick your card</h2>
      <p className="wiz-sub">Every option points at the same live profile. Start free, or add something to hand over.</p>
      <div className="opt-row">
        {CATALOG.materials.map((m) => {
          const Icon = window[m.icon] || IconLayers;
          return (
            <button key={m.key} className="opt-card" data-on={m.key === cardKey ? "1" : "0"} onClick={() => setCardKey(m.key)}>
              <span className="radio" />
              <span className="oc-ico"><Icon size={18} /></span>
              <span className="oc-meta">
                <span className="oc-name">{m.name}</span>
                <span className="oc-note">{m.lead} {m.bullets[0]}.</span>
              </span>
              <span className="oc-price">{m.priceFrom > 0 ? "from $" + m.priceFrom : "Free"}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepFinish({ cardKey, finishKey, setFinishKey }) {
  const finishes = CATALOG.finishes[cardKey] || [];
  const base = CATALOG.materials.find((m) => m.key === cardKey)?.priceFrom || 0;
  if (!finishes.length) {
    return (
      <div className="wiz-panel">
        <h2 className="wiz-h">No finish needed</h2>
        <p className="wiz-sub">The digital card has nothing to print — your profile is the product. Skip ahead to your details.</p>
        <div className="opt-card" data-on="1" style={{ cursor: "default" }}>
          <span className="oc-ico"><IconQr size={18} /></span>
          <span className="oc-meta"><span className="oc-name">Digital card</span><span className="oc-note">Live profile + QR, free forever</span></span>
          <span className="oc-price">Free</span>
        </div>
      </div>
    );
  }
  return (
    <div className="wiz-panel">
      <h2 className="wiz-h">Choose your finish</h2>
      <p className="wiz-sub">{cardKey === "metal" ? "Laser-engraved stainless steel — pick how it catches the light." : "Full-color print — pick the surface that suits you."}</p>
      <div className="opt-row">
        {finishes.map((f) => (
          <button key={f.key} className="opt-card" data-on={f.key === finishKey ? "1" : "0"} onClick={() => setFinishKey(f.key)}>
            <span className="radio" />
            <span className="oc-meta">
              <span className="oc-name">{f.name}</span>
              <span className="oc-note">{f.note}</span>
            </span>
            <span className="oc-price">{f.delta ? "+$" + f.delta : "$" + base}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepDetails({ draft, setField }) {
  const F = [
    ["name", "Full name", "Maya Okonkwo"], ["role", "Role / title", "Product Designer"],
    ["org", "Company", "Northbound Studio"], ["tagline", "Tagline", "Design that earns the next conversation."],
    ["email", "Email", "maya@northbound.co"], ["phone", "Phone", "+1 (415) 720-3318"],
    ["website", "Website", "maya.studio"], ["credential", "Credential / status", "DESIGN · OPEN"],
  ];
  return (
    <div className="wiz-panel">
      <h2 className="wiz-h">Make it yours</h2>
      <p className="wiz-sub">This is what opens when someone taps your card. Edit anytime later — updates reach every card instantly.</p>
      <div className="wiz-field">
        <label>{F[0][1]}</label>
        <input value={draft.name} placeholder={F[0][2]} onChange={(e) => setField("name", e.target.value)} />
      </div>
      <div className="wiz-fields-2">
        {[F[1], F[2]].map(([k, l, ph]) => (
          <div className="wiz-field" key={k}><label>{l}</label><input value={draft[k]} placeholder={ph} onChange={(e) => setField(k, e.target.value)} /></div>
        ))}
      </div>
      <div className="wiz-field">
        <label>{F[3][1]}</label>
        <input value={draft.tagline} placeholder={F[3][2]} onChange={(e) => setField("tagline", e.target.value)} />
      </div>
      <div className="wiz-group-label">Contact</div>
      <div className="wiz-fields-2">
        {[F[4], F[5]].map(([k, l, ph]) => (
          <div className="wiz-field" key={k}><label>{l}</label><input value={draft[k]} placeholder={ph} onChange={(e) => setField(k, e.target.value)} /></div>
        ))}
      </div>
      <div className="wiz-fields-2">
        {[F[6], F[7]].map(([k, l, ph]) => (
          <div className="wiz-field" key={k}><label>{l}</label><input value={draft[k]} placeholder={ph} onChange={(e) => setField(k, e.target.value)} /></div>
        ))}
      </div>
    </div>
  );
}

function StepReview({ tpl, cardKey, finishKey, total, data }) {
  const mat = CATALOG.materials.find((m) => m.key === cardKey);
  const finish = (CATALOG.finishes[cardKey] || []).find((f) => f.key === finishKey);
  const tplMeta = TEMPLATE_MAP[tpl];
  return (
    <div className="wiz-panel">
      <h2 className="wiz-h">Review your order</h2>
      <p className="wiz-sub">Everything check out? You can still go back and change any step.</p>
      <div className="sum">
        <div className="sum-row"><span className="k">Name</span><span className="v">{data.name}</span></div>
        <div className="sum-row"><span className="k">Template</span><span className="v">{tplMeta.name} · {tplMeta.profession}</span></div>
        <div className="sum-row"><span className="k">Card</span><span className="v">{mat.name}</span></div>
        {finish && <div className="sum-row"><span className="k">Finish</span><span className="v">{finish.name}</span></div>}
        <div className="sum-row"><span className="k">Profile URL</span><span className="v">{handleOf(data.name)}</span></div>
      </div>
      <div className="sum-total">
        <span className="k">{total > 0 ? "Total (one-time)" : "Total"}</span>
        <span className="amt">{total > 0 ? "$" + total : "Free"}</span>
      </div>
      {total > 0 && <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-mute)", marginTop: 6, textAlign: "right" }}>Free reorders · ships in 5–7 days</div>}
    </div>
  );
}

function OrderWizard() {
  const [stepIdx, setStepIdx] = useStateWiz(0);
  const [placed, setPlaced] = useStateWiz(false);
  const [tpl, setTpl] = useStateWiz(() => (TEMPLATE_MAP[getParam("tpl")] ? getParam("tpl") : "ivory"));
  const [cardKey, setCardKey] = useStateWiz(() => {
    const c = getParam("card");
    return CATALOG.materials.some((m) => m.key === c) ? c : "pvc";
  });
  const [finishKey, setFinishKey] = useStateWiz("matte");
  const [draft, setDraft] = useStateWiz(() => ({
    name: DEFAULT_PERSON.name, role: DEFAULT_PERSON.role, org: DEFAULT_PERSON.org,
    tagline: DEFAULT_PERSON.tagline, email: DEFAULT_PERSON.email, phone: DEFAULT_PERSON.phone,
    website: DEFAULT_PERSON.website, credential: DEFAULT_PERSON.credential,
  }));
  const setField = (k, v) => setDraft((d) => ({ ...d, [k]: v }));

  // reset finish to first valid when card type changes
  useEffectWiz(() => {
    const fs = CATALOG.finishes[cardKey] || [];
    if (fs.length && !fs.some((f) => f.key === finishKey)) setFinishKey(fs[0].key);
  }, [cardKey]);

  const total = useMemoWiz(() => {
    const base = CATALOG.materials.find((m) => m.key === cardKey)?.priceFrom || 0;
    if (base === 0) return 0;
    const delta = (CATALOG.finishes[cardKey] || []).find((f) => f.key === finishKey)?.delta || 0;
    return base + delta;
  }, [cardKey, finishKey]);

  // assemble live card data from draft (themed by template)
  const data = useMemoWiz(() => {
    const base = personaFor(tpl, DEFAULT_PERSON);
    const merged = {
      ...base, ...draft, initials: initialsOf(draft.name),
      contacts: [
        { icon: IconMail, text: draft.email },
        { icon: IconPhone, text: draft.phone },
        { icon: IconGlobe, text: draft.website },
      ],
    };
    return merged;
  }, [tpl, draft]);

  // digital cards skip the finish step
  const steps = cardKey === "digital" ? STEPS.filter((s) => s.key !== "finish") : STEPS;
  const clampIdx = Math.min(stepIdx, steps.length - 1);
  const step = steps[clampIdx];
  const canNext = step.key === "details" ? draft.name.trim().length > 0 : true;

  const go = (d) => setStepIdx((i) => Math.max(0, Math.min(steps.length - 1, i + d)));

  if (placed) {
    return (
      <>
        <SiteNav active={null} />
        <main className="wiz">
          <div className="wrap">
            <div className="wiz-done">
              <div className="check"><IconCheck size={30} /></div>
              <h2>Preview captured locally</h2>
              <p>This legacy room does not place an order, publish a profile, reserve a price, or confirm shipment. Open the native Card Studio to stage an operator-reviewed design brief.</p>
              <div className="cta-actions" style={{ justifyContent: "center", marginTop: 28 }}>
                <a className="btn btn-primary btn-lg" href={HOME_HREF}>Back to home <IconArrowRight size={16} /></a>
                <a className="btn btn-ghost btn-lg" href="Templates.html">Browse templates</a>
              </div>
            </div>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteNav active={null} />
      <main className="wiz">
        <div className="wrap">
          {/* progress */}
          <div className="wiz-progress">
            {steps.map((s, i) => (
              <React.Fragment key={s.key}>
                {i > 0 && <span className="wiz-conn" data-done={i <= clampIdx ? "1" : "0"} />}
                <div className="wiz-step" data-state={i === clampIdx ? "active" : i < clampIdx ? "done" : "todo"}>
                  <span className="num">{i < clampIdx ? <IconCheck size={14} /> : i + 1}</span>
                  <span className="lbl">{s.label}</span>
                </div>
              </React.Fragment>
            ))}
          </div>

          <div className="wiz-grid">
            <div className="wiz-main">
              {step.key === "template" && <StepTemplate tpl={tpl} setTpl={setTpl} />}
              {step.key === "card" && <StepCard cardKey={cardKey} setCardKey={setCardKey} />}
              {step.key === "finish" && <StepFinish cardKey={cardKey} finishKey={finishKey} setFinishKey={setFinishKey} />}
              {step.key === "details" && <StepDetails draft={draft} setField={setField} />}
              {step.key === "review" && <StepReview tpl={tpl} cardKey={cardKey} finishKey={finishKey} total={total} data={data} />}

              <div className="wiz-nav">
                <button className="btn btn-ghost" onClick={() => go(-1)} disabled={clampIdx === 0}
                        style={{ opacity: clampIdx === 0 ? 0.4 : 1, pointerEvents: clampIdx === 0 ? "none" : "auto" }}>
                  Back
                </button>
                {step.key === "review"
                  ? <button className="btn btn-primary" onClick={() => setPlaced(true)}>
                      Save preview locally <IconArrowRight size={16} />
                    </button>
                  : <button className="btn btn-primary" onClick={() => go(1)} disabled={!canNext}
                            style={{ opacity: canNext ? 1 : 0.5, pointerEvents: canNext ? "auto" : "none" }}>
                      Continue <IconArrowRight size={16} />
                    </button>}
              </div>
            </div>

            {/* live preview */}
            <div className="wiz-stage">
              <WizPhone tpl={tpl} data={data} />
              <div className="order-cap">Live preview</div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<OrderWizard />);
