// =========================================================
// App — production operator card shell (no dev tools)
// =========================================================

const CONFIG = {
  accent:   "#ff2a36",
  motion:   "on",
  serial:   "HYP-Δ-0001",
  name:     "VICTOR AMANI",
  alias:    "Δeus χ",
  role:     "FOUNDER · SYSTEMS ARCHITECT",
  brand:    "HYPERION INDUSTRIES",
  capability: "INFRASTRUCTURE · CONTINUITY · AI SYSTEMS",
  tagline:  "Building systems that remember, adapt, and survive contact with reality.",
  footTag:  "SYSTEMS BUILT TO SURVIVE FAILURE",
  doctrine: {
    label:     "HYPERION DOCTRINE",
    vol:       "VOL · 01",
    titlePre:  "Build systems that",
    titleHighlight: "survive",
    titlePost: "contact with reality.",
    body:      "Hyperion develops resilient infrastructure, continuity systems, and adaptive operational tooling — designed to remain functional under pressure, change, and uncertainty.",
    website:   "hyperion-industries.dev",
    email:     "deusx@hyperion.industries",
  },
  email:   "deusx@hyperion.industries",
  phone:   "+1 (612) 314-9992",
  website: "hyperion-industries.dev",
};

// Apply CSS variables from config (runs once at parse time)
(function () {
  const root = document.documentElement;
  const hex = CONFIG.accent.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  root.style.setProperty("--accent",       CONFIG.accent);
  root.style.setProperty("--accent-soft",  `rgba(${r},${g},${b},0.18)`);
  root.style.setProperty("--accent-faint", `rgba(${r},${g},${b},0.06)`);
  root.style.setProperty("--accent-line",  `rgba(${r},${g},${b},0.55)`);
  root.style.setProperty("--accent-glow",  `rgba(${r},${g},${b},0.35)`);
})();

function App() {
  const data = {
    serial:     CONFIG.serial,
    name:       CONFIG.name,
    alias:      CONFIG.alias,
    role:       CONFIG.role,
    brand:      CONFIG.brand,
    capability: CONFIG.capability,
    tagline:    CONFIG.tagline,
    footTag:    CONFIG.footTag,
    doctrine:   CONFIG.doctrine,
    systems: [
      { name: "HYPERION",      tag: "PARENT · CONSULTING", href: "https://hyperion-industries.dev",                                      status: "live" },
      { name: "CHR0N.OS",      tag: "BETA · CONTINUITY",   href: "https://chr0nos.app",                                                  status: "live" },
      { name: "FORGE INQUIRY", tag: "REQUEST BUILD",       href: `mailto:forge@hyperion-industries.dev?subject=Forge%20Inquiry`,          cta: true },
    ],
    comms: [
      { icon: IconMail,  eyebrow: "DIRECT CHANNEL", value: CONFIG.email, href: `mailto:${CONFIG.email}` },
      { icon: IconPhone, eyebrow: "VOICE CHANNEL",  value: CONFIG.phone, href: `tel:${CONFIG.phone.replace(/[^+\d]/g, "")}` },
    ],
    rail: [
      { icon: IconGlobe,  label: CONFIG.website,      href: "https://hyperion-industries.dev" },
      { icon: IconGithub, label: "github / @deusx",   href: "https://github.com/deusx" },
      { icon: IconHeart,  label: "sponsors",           href: "#" },
      { icon: IconCoffee, label: "ko-fi",              href: "#" },
    ],
  };

  return (
    <div className="stage">
      <SignalField enabled={CONFIG.motion === "on"} />
      <OperatorCard data={data} motion={CONFIG.motion} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
