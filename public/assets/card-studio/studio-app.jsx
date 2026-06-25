// =========================================================
// Hyperion Card Studio — app shell + Tweaks
// =========================================================

const { useState: useStateApp, useEffect: useEffectApp } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#ff4b3e",
  "copyTone": "plain",
  "heroTemplate": "ivory",
  "heroTexture": true,
  "name": "Maya Okonkwo",
  "initials": "MO",
  "role": "Product Designer",
  "org": "Northbound Studio",
  "capability": "Product · Systems · Prototyping",
  "tagline": "Design that earns the next conversation.",
  "credential": "DESIGN · OPEN",
  "footTag": "Open to new projects",
  "email": "maya@northbound.co",
  "phone": "+1 (415) 720-3318",
  "website": "maya.studio"
}/*EDITMODE-END*/;

const COPY = {
  plain: {
    heroTitle: "One tap. Your whole *introduction.*",
    heroSub: "Hyperion Card Studio turns a tap or scan into your details, links, and latest work — on a card that always stays current. Pick a template, make it yours, share it anywhere.",
    ctaTitle: "Make an introduction worth keeping.",
  },
  characterful: {
    heroTitle: "Hand over more than *a rectangle.*",
    heroSub: "A tap. A scan. Suddenly you're saved — name, links, latest work and all — on a card that updates itself long after the handshake. Pick a look, make it yours, never reprint again.",
    ctaTitle: "Be the card they actually keep.",
  },
};

// "wrap *this* in accent"
function renderEmph(text) {
  return String(text).split(/(\*[^*]+\*)/g).map((seg, i) =>
    seg.startsWith("*") && seg.endsWith("*")
      ? <span className="accent" key={i}>{seg.slice(1, -1)}</span>
      : <React.Fragment key={i}>{seg}</React.Fragment>
  );
}

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
function isLight([r, g, b]) { return (r * 299 + g * 587 + b * 114) / 1000 > 150; }

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const valid = (k) => (TEMPLATE_MAP[k] ? k : "ivory");
  const [heroTpl, setHeroTpl] = useStateApp(valid(t.heroTemplate));

  // keep hero template in sync if changed from the panel
  useEffectApp(() => { setHeroTpl(valid(t.heroTemplate)); }, [t.heroTemplate]);

  // migrate any retired template stored from an earlier version
  useEffectApp(() => {
    if (!TEMPLATE_MAP[t.heroTemplate]) setTweak("heroTemplate", "ivory");
  }, []);

  // apply accent live
  useEffectApp(() => {
    const root = document.documentElement;
    const rgb = hexToRgb(t.accent);
    root.style.setProperty("--accent", t.accent);
    root.style.setProperty("--accent-ink", isLight(rgb) ? "#161116" : "#ffffff");
    root.style.setProperty("--accent-soft", `rgba(${rgb.join(",")},0.14)`);
    root.style.setProperty("--accent-faint", `rgba(${rgb.join(",")},0.07)`);
    root.style.setProperty("--accent-line", `rgba(${rgb.join(",")},0.42)`);
  }, [t.accent]);

  // hero texture toggle
  useEffectApp(() => {
    document.documentElement.style.setProperty("--hero-tex", t.heroTexture ? "0.5" : "0");
  }, [t.heroTexture]);

  // reveal-on-scroll
  useEffectApp(() => {
    const els = Array.from(document.querySelectorAll(".reveal"));
    if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach((e) => e.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver((ents) => {
      ents.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);

  const copyRaw = COPY[t.copyTone] || COPY.plain;
  const copy = {
    heroTitle: renderEmph(copyRaw.heroTitle),
    heroSub: copyRaw.heroSub,
    ctaTitle: copyRaw.ctaTitle,
  };

  const person = {
    initials: t.initials,
    name: t.name,
    role: t.role,
    org: t.org,
    serial: "HCS · 0042",
    status: "LIVE",
    credential: t.credential,
    footTag: t.footTag,
    capability: t.capability,
    availableFor: ["Product design", "Design systems", "Prototyping"],
    tagline: t.tagline,
    contacts: [
      { icon: IconMail, text: t.email },
      { icon: IconPhone, text: t.phone },
      { icon: IconGlobe, text: t.website },
    ],
    website: t.website,
    email: t.email,
    backNote: "One tap shares everything — and updates itself the moment anything changes.",
  };

  return (
    <>
      <Nav />
      <main>
        <Hero person={person} heroTpl={heroTpl} setHeroTpl={setHeroTpl} copy={copy} />
        <Trust />
        <HowItWorks />
        <Gallery person={person} />
        <OrderSection person={person} />
        <Features />
        <UseCases />
        <Pricing />
        <Faq />
        <FinalCta copy={copy} />
      </main>
      <Footer />

      <TweaksPanel title="Tweaks">
        <TweakSection label="Style">
          <TweakColor label="Accent" value={t.accent} onChange={(v) => setTweak("accent", v)}
            options={["#ff4b3e", "#cba35a", "#5b9dff", "#2bbd8c", "#8a6cff"]} />
          <TweakToggle label="Hero grid texture" value={t.heroTexture} onChange={(v) => setTweak("heroTexture", v)} />
        </TweakSection>

        <TweakSection label="Voice">
          <TweakRadio label="Copy tone" value={t.copyTone} onChange={(v) => setTweak("copyTone", v)}
            options={[{ value: "plain", label: "Plain" }, { value: "characterful", label: "Bolder" }]} />
        </TweakSection>

        <TweakSection label="Hero card">
          <TweakSelect label="Template" value={t.heroTemplate} onChange={(v) => setTweak("heroTemplate", v)}
            options={TEMPLATES.map((x) => ({ value: x.key, label: x.name }))} />
          <TweakText label="Name" value={t.name} onChange={(v) => setTweak("name", v)} />
          <TweakText label="Initials" value={t.initials} onChange={(v) => setTweak("initials", v)} />
          <TweakText label="Role" value={t.role} onChange={(v) => setTweak("role", v)} />
          <TweakText label="Company" value={t.org} onChange={(v) => setTweak("org", v)} />
          <TweakText label="Capability" value={t.capability} onChange={(v) => setTweak("capability", v)} />
          <TweakText label="Credential" value={t.credential} onChange={(v) => setTweak("credential", v)} />
          <TweakText label="Tagline" value={t.tagline} onChange={(v) => setTweak("tagline", v)} />
          <TweakText label="Footer note" value={t.footTag} onChange={(v) => setTweak("footTag", v)} />
        </TweakSection>

        <TweakSection label="Contact">
          <TweakText label="Email" value={t.email} onChange={(v) => setTweak("email", v)} />
          <TweakText label="Phone" value={t.phone} onChange={(v) => setTweak("phone", v)} />
          <TweakText label="Website" value={t.website} onChange={(v) => setTweak("website", v)} />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
