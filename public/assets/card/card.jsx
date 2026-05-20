// =========================================================
// <OperatorCard> — front + back face, lock/activate, flip
// =========================================================

const { useState, useEffect, useRef, useMemo } = React;

// ---- vCard (.vcf) download ----
// Lets a visitor save the operator's contact details even if they later
// lose the link. Built from the live config so it always matches the card.
function downloadVCard(data) {
  const email = data.comms?.find((c) => /DIRECT/i.test(c.eyebrow))?.value || data.doctrine?.email || "";
  const phoneRaw = data.comms?.find((c) => /VOICE/i.test(c.eyebrow))?.value || "";
  const phone = phoneRaw.replace(/[^+\d]/g, "");
  const parts = (data.name || "").trim().split(/\s+/);
  const last = parts.length > 1 ? parts.pop() : "";
  const first = parts.join(" ");
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${last};${first};;;`,
    `FN:${data.name || ""}`,
    `ORG:${data.brand || ""}`,
    `TITLE:${data.role || ""}`,
    email ? `EMAIL;TYPE=INTERNET:${email}` : "",
    phone ? `TEL;TYPE=CELL:${phone}` : "",
    `URL:https://hyperion-industries.dev/dxcard`,
    `NOTE:${data.alias || ""} — ${data.tagline || ""}`,
    "END:VCARD",
  ].filter(Boolean);
  const blob = new Blob([lines.join("\r\n")], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = (data.name || "contact").toLowerCase().replace(/\s+/g, "-") + ".vcf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---- deterministic-looking QR grid (fake; placeholder) ----
function QRCells({ seed = "deusx" }) {
  const cells = useMemo(() => {
    const grid = [];
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const corner =
          (r < 3 && c < 3) || (r < 3 && c > 3) || (r > 3 && c < 3);
        if (corner) {
          const isEdge = r === 0 || c === 0 || r === 2 || c === 2 || r === 6 || (c === 6 && r < 3) || (r === 6 && c < 3);
          const isCenter = (r === 1 && c === 1) || (r === 1 && c === 5) || (r === 5 && c === 1);
          grid.push(isEdge || isCenter);
        } else {
          h = (h * 1103515245 + 12345) | 0;
          grid.push(((h >> 8) & 1) === 1);
        }
      }
    }
    return grid;
  }, [seed]);
  return (
    <div className="scan-qr" aria-hidden="true">
      {cells.map((on, i) => <i key={i} style={{ visibility: on ? "visible" : "hidden" }} />)}
    </div>
  );
}

// ---- shared live clock hook ----
function useUTC() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const hh = String(time.getUTCHours()).padStart(2, "0");
  const mm = String(time.getUTCMinutes()).padStart(2, "0");
  const ss = String(time.getUTCSeconds()).padStart(2, "0");
  return { hh, mm, ss, time };
}

// ---- top operator bar ----
function OpBar({ serial, onFlip, side = "front" }) {
  return (
    <div className="opbar">
      <div className="opbar-left">
        <span className="pill"><span className="dot" /> {side === "front" ? "ONLINE" : "ARCHIVE"}</span>
        <span className="opbar-meta">SER · {serial}</span>
      </div>
      <div className="opbar-right">
        <span className="opbar-meta tick">CAL · NOMINAL</span>
        {onFlip ? (
          <button className="op-flip" onClick={onFlip} aria-label={side === "front" ? "Flip to back" : "Flip to front"}>
            <IconFlip size={14} />
          </button>
        ) : (
          <span className="nfc"><IconNFC size={20} /></span>
        )}
      </div>
    </div>
  );
}

// ---- vertical glyph column ----
function GlyphCol() {
  return (
    <div className="glyph-col" aria-hidden="true">
      <span>Δ</span>
      <span>X</span>
      <span className="small">OPERATOR · I</span>
    </div>
  );
}

// ---- orbital ring (ambient hud, sits over the portrait) ----
function OrbitalRing() {
  return (
    <svg className="orbit" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <linearGradient id="orbit-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"  stopColor="currentColor" stopOpacity="0" />
          <stop offset="50%" stopColor="currentColor" stopOpacity="0.9" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g className="orbit-spin">
        <circle cx="50" cy="50" r="49" fill="none"
                stroke="url(#orbit-grad)" strokeWidth="0.6"
                strokeDasharray="22 8 4 12 30 10" />
        <circle cx="50" cy="1" r="0.9" fill="currentColor" />
      </g>
      <g className="orbit-counter">
        <circle cx="50" cy="50" r="46" fill="none"
                stroke="currentColor" strokeOpacity="0.12" strokeWidth="0.3"
                strokeDasharray="1 3" />
      </g>
    </svg>
  );
}

// ---- portrait block ----
function Portrait() {
  return (
    <div className="portrait">
      <div className="portrait-outer">
        <OrbitalRing />
        <div className="portrait-frame">
          <image-slot
            id="operator-portrait"
            shape="circle"
            placeholder="ΔEUS χ"
            src="/assets/operators/deus-x-portrait-complete.png"
          ></image-slot>
        </div>
      </div>
      <GlyphCol />
    </div>
  );
}

// ---- identity ----
function Identity({ name, alias, role, brand, capability }) {
  return (
    <div className="identity">
      <h1>
        <span>{name}</span>
        <span className="alias">ALIAS · <span>{alias}</span></span>
      </h1>
      <div className="role">{role}</div>
      <div className="brand">{brand}</div>
      <div className="rule" />
      {capability && <div className="capability">{capability}</div>}
    </div>
  );
}

// ---- tagline ----
function Tagline({ text }) {
  return (
    <div className="tagline">
      <em>"{text}"</em>
    </div>
  );
}

// ---- modules row ----
function Modules({ items }) {
  return (
    <div className="systems">
      <div className="systems-label">
        <span>MODULES</span>
        <span className="systems-count">CONSULTING · LIVE</span>
      </div>
      <div className="systems-row">
        {items.map((s) => (
          <a key={s.name}
             href={s.href}
             target={s.href?.startsWith?.("mailto:") ? undefined : "_blank"}
             rel="noreferrer"
             className={"sys-chip "
               + (s.status === "soon" ? "coming " : "")
               + (s.cta ? "cta " : "")}>
            <span className="sys-status" />
            <span className="sys-name">{s.name}</span>
            <span className="sys-tag">{s.tag}</span>
            {s.cta && <span className="sys-chev">›</span>}
          </a>
        ))}
      </div>
    </div>
  );
}

// ---- communications console ----
function CommsConsole({ channels: primaryChannels, rail }) {
  return (
    <div className="connect">
      <div className="connect-label">
        <span>COMMS CONSOLE</span>
        <span className="connect-sub">SECURE · OPEN</span>
      </div>

      <div className="comms-stack">
        {primaryChannels.map((c, i) => (
          <a key={i} className="comms-row" href={c.href}>
            <span className="well"><c.icon size={15} /></span>
            <span className="comms-meta">
              <span className="comms-eyebrow">{c.eyebrow}</span>
              <span className="comms-value">{c.value}</span>
            </span>
            <span className="connect-chev">›</span>
          </a>
        ))}
      </div>

      <div className="connect-rail" role="list">
        {rail.map((c, i) => (
          <a key={i}
             role="listitem"
             className="chan"
             href={c.href}
             target={c.href?.startsWith?.("#") || c.href?.startsWith?.("mailto:") || c.href?.startsWith?.("tel:") ? undefined : "_blank"}
             rel="noreferrer"
             aria-label={c.label}>
            <c.icon size={15} />
            <span className="chan-tip">{c.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

// ---- waveform (ambient) ----
const WAVEFORM_SEED = [4, 9, 6, 13, 7, 11, 5, 14, 8, 10, 6, 12, 5, 9];
function Waveform() {
  return (
    <div className="wave" aria-hidden="true">
      {WAVEFORM_SEED.map((h, i) => (
        <i
          key={i}
          style={{
            "--h": h + "px",
            "--h2": Math.max(2, h - 4) + "px",
            "--d": (i * 0.13) + "s",
          }}
        />
      ))}
    </div>
  );
}

// ---- telemetry strip + signature line ----
function TelemetryStrip() {
  const { hh, mm, ss } = useUTC();
  return (
    <div className="telemetry">
      <div className="tele-mark">
        <span className="gold-mark" />
        <span className="gold">HYPERION</span>
      </div>
      <Waveform />
      <div className="tele-clock">
        <span className="tele-clock-val">{hh}:{mm}:{ss}</span>
        <span className="tele-clock-tz">UTC</span>
      </div>
    </div>
  );
}

function Signature({ text }) {
  return (
    <div className="signature" aria-hidden="true">
      <span className="sig-hair" />
      <span className="sig-text">{text}</span>
      <span className="sig-hair" />
    </div>
  );
}

// ---- back face: hyperion doctrine ----
function BackFace({ data }) {
  const d = data.doctrine || {};
  return (
    <div className="back-pad">
      <div className="back-head">
        <span>{d.label}</span>
        <span>{d.vol}</span>
      </div>
      <div className="back-title">
        <span>{d.titlePre}</span>{" "}
        <span>{d.titleHighlight}</span><br />
        <span>{d.titlePost}</span>
      </div>

      <p className="back-body">{d.body}</p>

      <div className="tenets">
        <div className="tenets-label"><span>PRINCIPLES</span></div>
        <div className="tenet"><span className="n">I.</span><span>OBSERVE BEFORE YOU BUILD</span></div>
        <div className="tenet"><span className="n">II.</span><span>OPTIMIZE FOR RECOVERY</span></div>
        <div className="tenet"><span className="n">III.</span><span>SHIP TRUTH, NOT THEATRE</span></div>
        <div className="tenet"><span className="n">IV.</span><span>REDUCE OPERATIONAL FRICTION</span></div>
        <div className="tenet"><span className="n">V.</span><span>DESIGN FOR CONTINUITY</span></div>
      </div>

      <div className="available">
        <div className="available-label"><span>AVAILABLE FOR</span></div>
        <ul>
          <li>Systems consulting</li>
          <li>Deployment architecture</li>
          <li>Infrastructure modernization</li>
          <li>AI systems integration</li>
          <li>Workflow continuity design</li>
        </ul>
      </div>

      <div className="scan-box">
        <img
          className="scan-qr-img"
          src="/assets/card/qr.png"
          alt="Scan to open operator card"
        />
        <div className="scan-meta">
          <strong>OPEN A CHANNEL</strong>
          <span>{d.website}</span><br />
          <span>{d.email}</span>
        </div>
      </div>
    </div>
  );
}

// ---- the whole card ----
function OperatorCard({ data, motion = "on" }) {
  const [locked, setLocked] = useState(true);
  const [activating, setActivating] = useState(false);
  const [flipped, setFlipped] = useState(false);

  const activate = () => {
    if (!locked || activating) return;
    setActivating(true);
    const dur = motion === "off" ? 0 : 1100;
    setTimeout(() => { setLocked(false); setActivating(false); }, dur);
  };

  useEffect(() => {
    if (motion === "off" && locked) {
      setLocked(false);
    }
  }, [motion]); // eslint-disable-line

  return (
    <div className="card-wrap">
      <div className={"card " + (flipped ? "flipped" : "")}>
        {/* FRONT */}
        <div className={"face front " + (!locked ? "live" : "")}>
          <MeshBG density={26} />
          <div className="frame">
            <div className="bracket tl" />
            <div className="bracket tr" />
            <div className="bracket bl" />
            <div className="bracket br" />
          </div>
          <div className="frame-inner" />

          <OpBar serial={data.serial} onFlip={() => setFlipped(true)} side="front" />
          <Portrait />
          <Identity
            name={data.name}
            alias={data.alias}
            role={data.role}
            brand={data.brand}
            capability={data.capability}
          />
          <Tagline text={data.tagline} />
          <Modules items={data.systems} />
          <CommsConsole channels={data.comms} rail={data.rail} />
          <div className="cardfoot">
            <TelemetryStrip />
            <Signature text={data.footTag} />
          </div>

          {/* lock overlay */}
          {locked && (
            <div
              className={"lock-overlay " + (activating ? "fading" : "")}
              onClick={activate}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && activate()}
              role="button"
              tabIndex={0}
              aria-label="Activate card"
            >
              <div className="lock-inner">
                <div className="lock-ring">
                  <IconNFC size={36} />
                </div>
                <div className="lock-cta">
                  TAP TO ACTIVATE
                  <span className="hint">NFC · HOLD TO SYNC</span>
                </div>
                <button
                  type="button"
                  className="lock-vcard"
                  onClick={(e) => { e.stopPropagation(); downloadVCard(data); }}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  ↓ SAVE CONTACT
                </button>
              </div>
            </div>
          )}

          {/* scan sweep */}
          {activating && <div className="scan-sweep" aria-hidden="true" />}
        </div>

        {/* BACK */}
        <div className="face back">
          <MeshBG density={26} />
          <div className="frame">
            <div className="bracket tl" />
            <div className="bracket tr" />
            <div className="bracket bl" />
            <div className="bracket br" />
          </div>
          <div className="frame-inner" />
          <OpBar serial={data.serial} onFlip={() => setFlipped(false)} side="back" />
          <BackFace data={data} />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { OperatorCard });
