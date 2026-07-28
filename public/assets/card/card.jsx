// =========================================================
// <OperatorCard> — front + back face, lock/activate, flip, tilt.
// Content is passed in via `data` (built from card.config.json by
// app.jsx); everything visual lives here + card.css and is shared
// by every operator.
// =========================================================

const { useState, useEffect, useRef, useMemo } = React;

// icon-name → component (config references icons by string key)
const ICONS = {
  mail: IconMail, phone: IconPhone, globe: IconGlobe, github: IconGithub,
  heart: IconHeart, coffee: IconCoffee, link: IconLink, location: IconLocation,
  instagram: IconInstagram,
};
const iconFor = (k) => (typeof k === "function" ? k : ICONS[k] || IconLink);
const isLocalHref = (h) => !h || /^(#|mailto:|tel:)/.test(h);

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
function OpBar({ serial, status, onFlip, side = "front" }) {
  return (
    <div className="opbar">
      <div className="opbar-left">
        <span className="pill"><span className="dot" /> {side === "front" ? (status?.front || "ONLINE") : (status?.back || "ARCHIVE")}</span>
        <span className="opbar-meta">SER · {serial}</span>
      </div>
      <div className="opbar-right">
        <span className="opbar-meta tick">CAL · {status?.cal || "NOMINAL"}</span>
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

// ---- vertical glyph column beside the portrait ----
function GlyphCol({ glyph }) {
  const g = glyph || {};
  return (
    <div className="glyph-col" aria-hidden="true">
      <span>{g.top}</span>
      <span>{g.bottom}</span>
      <span className="small">{g.label}</span>
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
// blend=true dissolves the portrait into the card with a soft radial mask
// (no circle, no ring). image-slot clips to its own frame inside shadow DOM,
// so blend mode uses a square frame and lets the host mask do the fade.
//
// An animated portrait is served as muted looping video, not GIF: the source
// GIF was 800×450 × 418 frames, and Chromium's decoded-frame cache for that
// pins the main thread hard enough to freeze the page. Video is
// hardware-decoded and ~15× smaller for the same motion.
const VIDEO_RE = /\.(mp4|webm|mov|m4v)(\?|$)/i;
const VIDEO_MIME = { mp4: "video/mp4", m4v: "video/mp4", mov: "video/quicktime", webm: "video/webm" };
const mimeFor = (src) => VIDEO_MIME[String(src).split("?")[0].split(".").pop().toLowerCase()];

function PortraitVideo({ sources, motion }) {
  const ref = useRef(null);
  // The motion toggle freezes the canvases; the portrait follows suit.
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (motion === "off") v.pause();
    else v.play?.().catch(() => {});
  }, [motion]);
  return (
    <video
      ref={ref}
      className="portrait-video"
      autoPlay muted loop playsInline preload="auto"
      aria-hidden="true" tabIndex={-1}
    >
      {sources.map((s) => <source key={s} src={s} type={mimeFor(s)} />)}
    </video>
  );
}

function Portrait({ glyph, portrait, portraitSources, slotId, blend, motion }) {
  // Prefer an explicit source list (webm first, mp4 fallback); otherwise fall
  // back to the single `portrait` path when it points at a video.
  const sources = (portraitSources && portraitSources.length)
    ? portraitSources
    : (portrait && VIDEO_RE.test(portrait) ? [portrait] : null);

  return (
    <div className={"portrait" + (blend ? " blend" : "")}>
      <div className="portrait-outer">
        <OrbitalRing />
        <div className={"portrait-frame" + (blend ? " blend" : "")}>
          {sources ? (
            <PortraitVideo sources={sources} motion={motion} />
          ) : (
            <image-slot
              id={slotId || "operator-portrait"}
              shape={blend ? "rounded" : "circle"}
              radius={blend ? "0" : undefined}
              fit="cover"
              placeholder="ΔEUS χ"
              {...(portrait ? { src: portrait } : {})}
            ></image-slot>
          )}
          <span className="portrait-scan" aria-hidden="true" />
        </div>
      </div>
      <GlyphCol glyph={glyph} />
    </div>
  );
}

// ---- identity ----
function Identity({ name, alias, role, brand, capability, index }) {
  return (
    <div className="identity">
      <div className="identity-top">
        <span className="op-index">OPR<b>{index}</b></span>
      </div>
      <h1><span>{name}</span></h1>
      <div className="alias"><span className="alias-key">ALIAS</span><span>{alias}</span></div>
      <div className="rule" />
      <div className="role">{role}</div>
      <div className="brand">{brand}</div>
      {capability && <div className="capability">{capability}</div>}
    </div>
  );
}

// ---- tagline ----
function Tagline({ text }) {
  return (
    <div className="tagline">
      <em>&ldquo;{text}&rdquo;</em>
    </div>
  );
}

// ---- modules row ----
function Modules({ items }) {
  return (
    <div className="systems">
      <div className="systems-label">
        <span>MODULES</span>
        <span className="systems-count">REGISTRY · LIVE</span>
      </div>
      <div className="systems-row">
        {(items || []).map((s) => (
          <a key={s.name}
             href={s.href}
             target={isLocalHref(s.href) ? undefined : "_blank"}
             rel="noreferrer"
             className={"sys-chip "
               + (s.status === "soon" ? "coming " : "")
               + (s.cta ? "cta " : "")}>
            <span className="sys-status" />
            <span className="sys-name">{s.name}</span>
            <span className="sys-tag">{s.tag}</span>
            {s.cta && <span className="sys-chev"><IconArrow size={13} /></span>}
          </a>
        ))}
      </div>
    </div>
  );
}

// ---- communications console ----
function CommsConsole({ channels, rail }) {
  return (
    <div className="connect">
      <div className="connect-label">
        <span>COMMS CONSOLE</span>
        <span className="connect-sub">SECURE · OPEN</span>
      </div>

      <div className="comms-stack">
        {(channels || []).map((c, i) => {
          const Ico = iconFor(c.icon);
          return (
            <a key={i} className="comms-row" href={c.href}
               target={isLocalHref(c.href) ? undefined : "_blank"} rel="noreferrer">
              <span className="well"><Ico size={15} /></span>
              <span className="comms-meta">
                <span className="comms-eyebrow">{c.eyebrow}</span>
                <span className="comms-value">{c.value}</span>
              </span>
              <span className="connect-chev"><IconArrow size={14} /></span>
            </a>
          );
        })}
      </div>

      <div className="connect-rail" role="list">
        {(rail || []).map((c, i) => {
          const Ico = iconFor(c.icon);
          return (
            <a key={i}
               role="listitem"
               className="chan"
               href={c.href}
               target={isLocalHref(c.href) ? undefined : "_blank"}
               rel="noreferrer"
               aria-label={c.label}>
              <Ico size={15} />
              <span className="chan-tip">{c.label}</span>
            </a>
          );
        })}
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
function TelemetryStrip({ mark }) {
  const { hh, mm, ss } = useUTC();
  return (
    <div className="telemetry">
      <div className="tele-mark">
        <span className="gold-mark" />
        <span className="gold">{mark || "HYPERION"}</span>
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
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
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
        <span className="hl">{d.titleHighlight}</span><br />
        <span>{d.titlePost}</span>
      </div>

      <p className="back-body">{d.body}</p>

      <div className="tenets">
        <div className="tenets-label"><span>PRINCIPLES</span></div>
        {(data.principles || []).map((p, i) => (
          <div className="tenet" key={i}><span className="n">{ROMAN[i] || (i + 1)}</span><span>{p}</span></div>
        ))}
      </div>

      <div className="available">
        <div className="available-label"><span>AVAILABLE FOR</span></div>
        <ul>{(data.availableFor || []).map((a, i) => <li key={i}>{a}</li>)}</ul>
      </div>

      <div className="scan-box">
        {/* Real branded QR — encodes the live card URL. */}
        <img
          className="scan-qr-img"
          src={data.qr || "/assets/card/qr.png"}
          alt="Scan to open operator card"
        />
        <div className="scan-meta">
          <strong>OPEN A CHANNEL</strong>
          <span>{d.website || data.website}</span><br />
          <span>{d.email || data.email}</span>
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
  const wrapRef = useRef(null);

  const fb = (typeof window !== "undefined" && window.HypFeedback) || null;

  // Tilt is a hover/fine-pointer affordance only — touch devices and
  // reduced-motion users get the flat card.
  const tiltOK = useMemo(() => {
    const mm = window.matchMedia;
    if (!mm) return false;
    return mm("(hover: hover) and (pointer: fine)").matches
      && !mm("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const onMove = (e) => {
    const el = wrapRef.current;
    if (!el || !tiltOK || motion === "off") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--tilt-y", (x * 12).toFixed(2) + "deg");
    el.style.setProperty("--tilt-x", (y * -10).toFixed(2) + "deg");
    el.style.setProperty("--glare-x", ((x + 0.5) * 100).toFixed(1) + "%");
    el.style.setProperty("--glare-y", ((y + 0.5) * 100).toFixed(1) + "%");
    el.style.setProperty("--glare-o", "1");
    el.style.setProperty("--lift", "14px");
  };
  const onLeave = () => {
    const el = wrapRef.current;
    if (!el) return;
    el.style.setProperty("--tilt-y", "0deg");
    el.style.setProperty("--tilt-x", "0deg");
    el.style.setProperty("--glare-o", "0");
    el.style.setProperty("--lift", "0px");
  };

  const activate = () => {
    if (!locked || activating) return;
    setActivating(true);
    // The flourish: accept the invitation with a swell + sweep, then a
    // bright "systems online" confirm as the reveal completes.
    if (fb) { fb.activate(); fb.sweep(); }
    const dur = motion === "off" ? 0 : 1100;
    setTimeout(() => {
      setLocked(false);
      setActivating(false);
      if (fb) fb.live();
    }, dur);
  };

  const flipTo = (next) => {
    if (fb) fb.flip();
    setFlipped(next);
  };

  // Mute the audio/haptic flourish when motion is off.
  useEffect(() => {
    if (fb) fb.setMuted(motion === "off");
  }, [motion]); // eslint-disable-line

  useEffect(() => {
    if (motion === "off" && locked) {
      setLocked(false);
    }
  }, [motion]); // eslint-disable-line

  const Frame = () => (
    <>
      <div className="frame">
        <div className="bracket tl" />
        <div className="bracket tr" />
        <div className="bracket bl" />
        <div className="bracket br" />
      </div>
      <div className="frame-inner" />
    </>
  );

  return (
    <div className="card-fit">
    <div className="card-wrap" ref={wrapRef} onPointerMove={onMove} onPointerLeave={onLeave}>
      <div className="card-tilt">
      <div className={"card " + (flipped ? "flipped" : "")}>
        {/* FRONT */}
        <div className={"face front " + (!locked ? "live" : "")}>
          <MeshBG density={30} energy={1.6} />
          <Frame />

          <OpBar serial={data.serial} status={data.status} onFlip={() => flipTo(true)} side="front" />
          <Portrait
            glyph={data.glyph}
            portrait={data.portrait}
            portraitSources={data.portraitSources}
            slotId={data.slotId}
            blend={data.portraitBlend}
            motion={motion}
          />
          <Identity
            name={data.name}
            alias={data.alias}
            role={data.role}
            brand={data.brand}
            capability={data.capability}
            index={data.index}
          />
          <Tagline text={data.tagline} />
          <Modules items={data.systems} />
          <CommsConsole channels={data.comms} rail={data.rail} />
          <div className="cardfoot">
            <TelemetryStrip mark={data.teleMark} />
            <Signature text={data.footTag} />
          </div>
          <span className="holo-glare" aria-hidden="true" />
          {!locked && <span className="face-scan" aria-hidden="true" />}

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
                  onClick={(e) => { e.stopPropagation(); if (fb) fb.click(); downloadVCard(data); }}
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
          <MeshBG density={30} energy={1.6} />
          <Frame />
          <OpBar serial={data.serial} status={data.status} onFlip={() => flipTo(false)} side="back" />
          <BackFace data={data} />
          <span className="holo-glare" aria-hidden="true" />
        </div>
      </div>
      </div>
    </div>
    </div>
  );
}

Object.assign(window, { OperatorCard });
