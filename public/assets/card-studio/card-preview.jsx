// =========================================================
// CardPreview — one structure, five templates.
// Front face always; back face + flip when interactive.
// =========================================================

const { useState: useStateCard } = React;

const TEMPLATES = [
  { key: "slate",    name: "Slate",    profession: "Operations & management", tag: "UNIVERSAL · MINIMAL",     align: "left",   swatch: "#9aa6bd" },
  { key: "ivory",    name: "Ivory",    profession: "Consulting & advisory",    tag: "EDITORIAL · SERIF",       align: "left",   swatch: "#b06a45" },
  { key: "counsel",  name: "Counsel",  profession: "Law & mediation",          tag: "DEEP INK · GOLD RULE",    align: "center", swatch: "#c2a25a" },
  { key: "sterling", name: "Sterling", profession: "Finance & banking",         tag: "NAVY · ENGRAVED",         align: "left",   swatch: "#c8a657" },
  { key: "atelier",  name: "Atelier",  profession: "Art & creative",            tag: "CREAM · EXPRESSIVE",      align: "left",   swatch: "#b8412e" },
  { key: "meridian", name: "Meridian", profession: "Architecture & design",     tag: "BLUEPRINT · MONO",       align: "left",   swatch: "#3a4a52" },
  { key: "verdant",  name: "Verdant",  profession: "Health & wellness",         tag: "CALM · SOFT",            align: "center", swatch: "#6fb38a" },
  { key: "operator", name: "Operator", profession: "Tech & product",            tag: "FLAGSHIP · MAXIMAL",      align: "left",   swatch: "#ff2a36" },
];
const TEMPLATE_MAP = Object.fromEntries(TEMPLATES.map((t) => [t.key, t]));

// deterministic 7×7 QR-ish grid (placeholder)
function qrCells(seed) {
  const cells = [];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      const corner = (r < 3 && c < 3) || (r < 3 && c > 3) || (r > 3 && c < 3);
      if (corner) {
        const edge = r === 0 || c === 0 || r === 2 || c === 2 || r === 6 || (c === 6 && r < 3) || (r === 6 && c < 3);
        const ctr = (r === 1 && c === 1) || (r === 1 && c === 5) || (r === 5 && c === 1);
        cells.push(edge || ctr);
      } else {
        h = (h * 1103515245 + 12345) | 0;
        cells.push(((h >> 8) & 1) === 1);
      }
    }
  }
  return cells;
}

function CardFront({ data, portraitSlot }) {
  return (
    <div className="bcard-face front">
      <div className="bc-top">
        <span className="bc-pill"><i />{data.status || "LIVE"}</span>
        <span className="bc-cred">{data.credential || data.serial}<span className="nfc"><IconNfc size={12} /></span></span>
      </div>

      <div className="bc-id">
        <div className="bc-avatar">
          {portraitSlot
            ? <image-slot id="hcs-portrait" shape="circle" placeholder="DROP PHOTO"></image-slot>
            : <span className="mono">{data.initials}</span>}
        </div>
        <div className="bc-name">{data.name}</div>
        <div className="bc-role">{data.role}</div>
        <div className="bc-org">{data.org}</div>
        {data.capability && <div className="bc-capability">{data.capability}</div>}
      </div>

      <div className="bc-rule" />
      <div className="bc-tagline">{data.tagline}</div>

      <div className="bc-connect">
        <div className="bc-connect-label">{data.connectLabel || "Connect"}</div>
        <div className="bc-contacts">
          {data.contacts.map((c, i) => (
            <div className="bc-contact" key={i}>
              <span className="ic"><c.icon size={13} /></span>
              <span>{c.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bc-foot">
        <span className="bc-mark"><span className="dia" />HYPERION</span>
        <span className="bc-tap"><IconNfc size={11} />Tap to save</span>
      </div>

      {data.footTag && (
        <div className="bc-sig">
          <span className="hair" /><span className="t">{data.footTag}</span><span className="hair" />
        </div>
      )}
    </div>
  );
}

function CardBack({ data }) {
  const cells = qrCells((data.website || "hyperion") + data.initials);
  return (
    <div className="bcard-face back">
      <div className="bc-back-head">
        <span>{data.org}</span>
        <span>{data.serial}</span>
      </div>
      <div className="bc-back-title">{data.name}</div>
      <div className="bc-back-body">{data.backNote}</div>
      {data.availableFor && data.availableFor.length > 0 && (
        <div className="bc-avail">
          <div className="bc-avail-label">Available for</div>
          <ul>{data.availableFor.map((x, i) => <li key={i}>{x}</li>)}</ul>
        </div>
      )}
      <div className="bc-qr-box">
        <div className="bc-qr" aria-hidden="true">
          {cells.map((on, i) => <i key={i} style={{ visibility: on ? "visible" : "hidden" }} />)}
        </div>
        <div className="bc-qr-meta">
          <strong>Scan to save</strong>
          {data.website}<br />{data.email}
        </div>
      </div>
    </div>
  );
}

function CardPreview({ tpl = "ivory", data, interactive = false, enter = false, portraitSlot = false }) {
  const [flipped, setFlipped] = useStateCard(false);
  const meta = TEMPLATE_MAP[tpl] || TEMPLATE_MAP.ivory;
  const cls = "bcard" + (flipped ? " flipped" : "") + (enter ? " enter" : "");
  return (
    <div className={cls} data-tpl={meta.key} data-align={meta.align || "left"}>
      {interactive && (
        <div className="bcard-flip">
          <button className="card-flip-btn" onClick={() => setFlipped((f) => !f)}
                  aria-label="Flip card">
            <IconFlip size={12} />{flipped ? "Front" : "Back"}
          </button>
        </div>
      )}
      <div className="bcard-inner">
        <CardFront data={data} portraitSlot={portraitSlot} />
        {interactive && <CardBack data={data} />}
      </div>
    </div>
  );
}

Object.assign(window, { CardPreview, TEMPLATES, TEMPLATE_MAP, qrCells });
