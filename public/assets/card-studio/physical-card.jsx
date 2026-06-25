// =========================================================
// PhysicalCard — landscape 3.5×2 front & back, print-style.
// Consumes the same per-template material tokens as the
// digital card (mirrored in pcards.css).
// =========================================================

function PhysicalFront({ data }) {
  return (
    <div className="pcard-face front">
      <div className="pc-top">
        <span className="pc-brand">
          <span className="pc-mark"><BrandMark size={15} /></span>
          <span>Hyperion <span className="sub">Card</span></span>
        </span>
        <span className="pc-cred">{data.credential || "NFC"}<span className="nfc"><IconNfc size={11} /></span></span>
      </div>

      <div className="pc-foot">
        <div className="pc-id">
          <div className="pc-name">{data.name}</div>
          <div className="pc-role">{data.role}</div>
          <div className="pc-org">{data.org}</div>
        </div>
        <div className="pc-contacts">
          <span><span className="ico"><IconMail size={11} /></span>{data.email}</span>
          <span><span className="ico"><IconPhone size={11} /></span>{data.phone}</span>
          <span><span className="ico"><IconGlobe size={11} /></span>{data.website}</span>
        </div>
      </div>
    </div>
  );
}

function PhysicalBack({ data }) {
  const cells = (window.qrCells ? window.qrCells((data.website || "hyperion") + (data.initials || "")) : []);
  return (
    <div className="pcard-face back">
      <div className="pc-back-top">
        <span className="pc-goldmark"><span className="dia" />Hyperion</span>
        <span>{data.serial}</span>
      </div>

      <div className="pc-back-mono">
        <div className="glyph">{data.initials}</div>
        <div className="pc-back-tag">{data.tagline}</div>
      </div>

      <div className="pc-back-foot">
        <div className="pc-back-web">
          <small>Tap or scan</small>
          {data.website}
        </div>
        <div className="pc-qr" aria-hidden="true">
          {cells.map((on, i) => <i key={i} style={{ visibility: on ? "visible" : "hidden" }} />)}
        </div>
      </div>
    </div>
  );
}

function PhysicalCard({ tpl = "ivory", data, side = "front" }) {
  const meta = (window.TEMPLATE_MAP && window.TEMPLATE_MAP[tpl]) ? window.TEMPLATE_MAP[tpl] : { key: "ivory" };
  return (
    <div className="pcard" data-tpl={meta.key}>
      {side === "front" ? <PhysicalFront data={data} /> : <PhysicalBack data={data} />}
    </div>
  );
}

Object.assign(window, { PhysicalCard, PhysicalFront, PhysicalBack });
