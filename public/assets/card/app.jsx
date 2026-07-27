// =========================================================
// App — production operator card shell
// Config is fetched from assets/card/card.config.json so the
// editor (edit.html) can patch it via the GitHub Contents API
// without touching code. Falls back to embedded defaults if
// the fetch fails (file:// preview, offline, etc.).
// =========================================================

const { useState: useStateApp, useEffect: useEffectApp } = React;

const FALLBACK_CONFIG = {
  accent:   "#ff2a36",
  motion:   "on",
  serial:   "HYP-Δ-0001",
  index:    "I",
  name:     "VICTOR AMANI",
  alias:    "Δeus χ",
  role:     "FOUNDER · SYSTEMS ARCHITECT",
  brand:    "HYPERION INDUSTRIES",
  capability: "INFRASTRUCTURE · CONTINUITY · AI SYSTEMS",
  tagline:  "Building systems that remember, adapt, and survive contact with reality.",
  footTag:  "SYSTEMS BUILT TO SURVIVE FAILURE",
  teleMark: "HYPERION",
  glyph:    { top: "Δ", bottom: "X", label: "OPERATOR · I" },
  status:   { front: "ONLINE", back: "ARCHIVE", cal: "NOMINAL" },
  portrait: "/assets/operators/victor-portrait.mp4",
  portraitSources: [
    "/assets/operators/victor-portrait.webm",
    "/assets/operators/victor-portrait.mp4",
  ],
  // Blend mode dissolves the portrait edge-first into the card. It assumes a
  // subject that is brighter than the panel; this operator plate is a dark
  // helmet on a night city, so the mask kept the near-black centre and faded
  // the bright neon rim — the portrait read as empty. Circle crop restores the
  // accent ring + haze, which gives the dark plate a defined edge.
  portraitBlend: false,
  qr: "/assets/card/qr.png",
  doctrine: {
    label:          "HYPERION DOCTRINE",
    vol:            "VOL · 01",
    titlePre:       "Build systems that",
    titleHighlight: "survive",
    titlePost:      "contact with reality.",
    body:           "Hyperion develops resilient infrastructure, continuity systems, and adaptive operational tooling — designed to remain functional under pressure, change, and uncertainty.",
    website:        "hyperion-industries.dev",
    email:          "va@hyperion-industries.dev",
  },
  principles: [
    "OBSERVE BEFORE YOU BUILD",
    "OPTIMIZE FOR RECOVERY",
    "SHIP TRUTH, NOT THEATRE",
    "REDUCE OPERATIONAL FRICTION",
    "DESIGN FOR CONTINUITY",
  ],
  availableFor: [
    "Systems consulting",
    "Deployment architecture",
    "Infrastructure modernization",
    "AI systems integration",
    "Workflow continuity design",
  ],
  email:   "va@hyperion-industries.dev",
  phone:   "+1 (612) 314-9992",
  website: "hyperion-industries.dev",
  links: {
    hyperion:  "https://hyperion-industries.dev",
    chronos:   "https://chr0nos.app",
    forge:     "mailto:va@hyperion-industries.dev?subject=Forge%20Inquiry",
    github:    "https://github.com/Code-Xer0",
    instagram: "https://www.instagram.com/code_xer0/",
    kofi:      "https://ko-fi.com/hyperionindustries",
  },
};

// One hex re-skins the card, stage, lattice and glare. --accent-rgb is the
// channel triplet every rgba() in card.css composes against, so the canvas
// layers can read the same value back out of computed style.
function applyAccent(accent) {
  const root = document.documentElement;
  const hex = (accent || FALLBACK_CONFIG.accent).replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  root.style.setProperty("--accent",       accent);
  root.style.setProperty("--accent-rgb",   `${r}, ${g}, ${b}`);
  root.style.setProperty("--accent-soft",  `rgba(${r}, ${g}, ${b}, 0.18)`);
  root.style.setProperty("--accent-faint", `rgba(${r}, ${g}, ${b}, 0.06)`);
  root.style.setProperty("--accent-line",  `rgba(${r}, ${g}, ${b}, 0.55)`);
  root.style.setProperty("--accent-glow",  `rgba(${r}, ${g}, ${b}, 0.35)`);
  // Stage hex-mesh: stroke colour baked in so the tile is a plain background
  // image (see .stage::before). "#" must be %23 inside a data URL.
  const stroke = "%23" + hex;
  root.style.setProperty("--hexmesh",
    `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='56' height='48' viewBox='0 0 56 48'>` +
    `<g fill='none' stroke='${stroke}' stroke-width='0.8'>` +
    `<polygon points='14,4 28,4 35,16 28,28 14,28 7,16'/>` +
    `<polygon points='42,4 56,4 63,16 56,28 42,28 35,16'/>` +
    `<polygon points='14,28 28,28 35,40 28,52 14,52 7,40'/>` +
    `<polygon points='42,28 56,28 63,40 56,52 42,52 35,40'/>` +
    `</g></svg>")`);
}

// Corner HUD marks around the card. Hidden ≤700px by card.css.
function StageMarks({ serial, index }) {
  return (
    <div className="stage-marks" aria-hidden="true">
      <div className="tl"><div className="hot">HYP · OPERATOR REGISTRY</div><span>NODE / {index} · FORGE DISTRICT</span></div>
      <div className="tr"><div className="hot">CARD ID · {serial}</div><span>REV 2026.07</span></div>
      <div className="bl"><span>UPLINK NOMINAL</span><div className="hot">↳ READING</div></div>
      <div className="br"><span>HANDSHAKE · OK</span><div className="hot">∆ — SIGNED</div></div>
    </div>
  );
}

function buildData(c) {
  const F = FALLBACK_CONFIG;
  return {
    serial:     c.serial,
    index:      c.index || F.index,
    name:       c.name,
    alias:      c.alias,
    role:       c.role,
    brand:      c.brand,
    capability: c.capability,
    tagline:    c.tagline,
    footTag:    c.footTag,
    teleMark:   c.teleMark || F.teleMark,
    glyph:      c.glyph || F.glyph,
    status:     c.status || F.status,
    doctrine:   c.doctrine,
    website:    c.website,
    email:      c.email,
    qr:         c.qr || F.qr,
    portrait:        c.portrait !== undefined ? c.portrait : F.portrait,
    portraitSources: c.portraitSources !== undefined ? c.portraitSources : F.portraitSources,
    portraitBlend:   c.portraitBlend !== undefined ? c.portraitBlend : F.portraitBlend,
    // Slot id tracks the serial so a re-issued card starts with a fresh crop.
    slotId:     "op-" + String(c.serial || "operator").replace(/[^A-Za-z0-9]/g, ""),
    principles:   c.principles   || F.principles,
    availableFor: c.availableFor || F.availableFor,
    systems: [
      { name: "HYPERION",      tag: "PARENT · CONSULTING", href: c.links.hyperion, status: "live" },
      { name: "CHR0N.OS",      tag: "BETA · CONTINUITY",   href: c.links.chronos,  status: "live" },
      { name: "FORGE INQUIRY", tag: "REQUEST BUILD",       href: c.links.forge,    cta: true },
    ],
    comms: [
      { icon: "mail",  eyebrow: "DIRECT CHANNEL", value: c.email, href: `mailto:${c.email}` },
      { icon: "phone", eyebrow: "VOICE CHANNEL",  value: c.phone, href: `tel:${c.phone.replace(/[^+\d]/g, "")}` },
    ],
    rail: [
      { icon: "globe",     label: c.website,                     href: c.links.hyperion  },
      { icon: "github",    label: "github / Code-Xer0",          href: c.links.github    },
      { icon: "instagram", label: "instagram / code_xer0",       href: c.links.instagram },
      { icon: "coffee",    label: "ko-fi / hyperionindustries",  href: c.links.kofi      },
    ],
  };
}

// Expose a tiny store so edit.jsx can hook into the same render path
// without forking this file. Default impl just returns the fetched value.
window.__cardConfig = window.__cardConfig || {
  load: () =>
    fetch("/assets/card/card.config.json?t=" + Date.now(), { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("no config"))))
      .catch(() => FALLBACK_CONFIG),
};

function App() {
  const [config, setConfig] = useStateApp(null);

  useEffectApp(() => {
    let cancelled = false;
    window.__cardConfig.load().then((c) => {
      if (!cancelled) {
        applyAccent(c.accent || FALLBACK_CONFIG.accent);
        setConfig(c);
      }
    });

    // Editor hook — re-render on live tweak changes
    const onTweak = (e) => {
      setConfig((prev) => {
        const next = { ...prev, ...(e.detail || {}) };
        if (e.detail && e.detail.accent) applyAccent(e.detail.accent);
        return next;
      });
    };
    window.addEventListener("tweakchange", onTweak);
    return () => {
      cancelled = true;
      window.removeEventListener("tweakchange", onTweak);
    };
  }, []);

  if (!config) return null; // brief blank while fetching; lock overlay covers it

  return (
    <div className="stage">
      <SignalField enabled={config.motion === "on"} />
      <StageMarks serial={config.serial} index={config.index || FALLBACK_CONFIG.index} />
      <OperatorCard data={buildData(config)} motion={config.motion} />
    </div>
  );
}

// Expose for the editor entry to reuse without re-defining.
Object.assign(window, { App, FALLBACK_CONFIG, applyAccent, buildData, StageMarks });

// edit.html sets this flag BEFORE Babel compiles app.jsx, so the editor
// can mount its own wrapped App with the TweaksPanel attached.
if (!window.__cardSuppressAutoMount) {
  ReactDOM.createRoot(document.getElementById("root")).render(<App />);
}
