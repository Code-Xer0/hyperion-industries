// =========================================================
// CATALOG — single source of truth for product data shared
// across Cards, Pricing, Features, and the Order wizard.
// Icons are stored as NAMES; pages resolve window[name].
// =========================================================

const CATALOG = {
  materials: [
    {
      key: "digital", name: "Digital Card", tag: "Free forever", priceFrom: 0,
      icon: "IconQr", weight: "—", lead: "No print. No wait.",
      blurb: "Your live profile and QR code. Share by link, scan, or wallet pass — there's nothing to print and nothing for the other person to install.",
      bullets: ["Live profile + QR code", "Save-to-contacts", "Apple & Google Wallet", "Edit anytime, updates everywhere"],
    },
    {
      key: "pvc", name: "PVC NFC Card", tag: "Most popular", priceFrom: 39,
      icon: "IconLayers", weight: "≈ 5 g", lead: "The everyday card.",
      blurb: "Full-color print on both faces with an NFC chip sealed inside. Light, durable, and water-resistant — the card that does the day-to-day work.",
      bullets: ["Full-color print, both sides", "NFC tap + QR backup", "Water- & scuff-resistant", "Matte, gloss, or soft-touch"],
    },
    {
      key: "metal", name: "Metal NFC Card", tag: "Premium", priceFrom: 89,
      icon: "IconShield", weight: "≈ 28 g", lead: "Weight they remember.",
      blurb: "Laser-engraved stainless steel with genuine heft. The NFC chip sits in a discreet tap window on the reverse, so the metal face stays clean.",
      bullets: ["Laser-engraved stainless steel", "Brushed, matte black, or polished", "Scratch- & bend-resistant", "Tap window on the reverse"],
    },
  ],

  finishes: {
    pvc: [
      { key: "matte",  name: "Matte",      delta: 0,  note: "Low-glare, fingerprint-resistant" },
      { key: "gloss",  name: "Gloss",      delta: 0,  note: "Vivid color, high shine" },
      { key: "soft",   name: "Soft-touch", delta: 10, note: "Velvet hand-feel" },
    ],
    metal: [
      { key: "brushed", name: "Brushed steel", delta: 0,  note: "Satin, directional grain" },
      { key: "matte",   name: "Matte black",   delta: 10, note: "Stealth, anti-glare coat" },
      { key: "polished",name: "Polished black",delta: 20, note: "Mirror, dramatic depth" },
      { key: "gold",    name: "24k gold accent",delta: 40, note: "Engraving filled in gold" },
    ],
    digital: [],
  },

  chips: [
    { key: "ntag213", name: "NTAG213", mem: "144 bytes", use: "Links & short profiles", note: "Reliable and economical" },
    { key: "ntag215", name: "NTAG215", mem: "504 bytes", use: "A full vCard + links",   note: "Fits a complete contact", tag: "Default" },
    { key: "ntag216", name: "NTAG216", mem: "888 bytes", use: "Rich vCard + media",      note: "Most headroom", tag: "In metal" },
  ],
  chipSpecs: [
    "13.56 MHz · NFC Forum Type 2",
    "Read range ≈ 1–4 cm",
    "~10-year data retention",
    "Password-protectable",
    "Reprogrammable destination",
    "QR fallback for any phone",
  ],

  tiers: [
    { key: "starter", name: "Starter", price: "$0",     per: "free forever", desc: "Your digital card and QR, live today.", cta: "Start free", featured: false },
    { key: "pro",     name: "Pro",     price: "$9",     per: "/ month",      desc: "A physical card plus the tools to make it count.", cta: "Get Pro", featured: true, note: "or $90/yr" },
    { key: "team",    name: "Team",    price: "Custom", per: "per seat",     desc: "One brand, many cards, managed together.", cta: "Talk to us", featured: false },
  ],

  planMatrix: [
    { label: "Digital cards",            starter: "1",    pro: "3",            team: "Unlimited" },
    { label: "NFC tap + QR sharing",     starter: true,   pro: true,           team: true },
    { label: "Save-to-contacts",         starter: true,   pro: true,           team: true },
    { label: "Apple & Google Wallet",    starter: true,   pro: true,           team: true },
    { label: "Templates",                starter: "Core", pro: "All 8 + color",team: "All + brand kit" },
    { label: "Live updates",             starter: true,   pro: true,           team: true },
    { label: "Custom link",              starter: false,  pro: true,           team: true },
    { label: "Custom domain",            starter: false,  pro: true,           team: true },
    { label: "Tap & scan analytics",     starter: false,  pro: true,           team: true },
    { label: "Lead capture form",        starter: false,  pro: true,           team: true },
    { label: "Physical card included",   starter: false,  pro: "1 PVC",        team: "Bulk pricing" },
    { label: "Shared brand kit",         starter: false,  pro: false,          team: true },
    { label: "Admin dashboard",          starter: false,  pro: false,          team: true },
    { label: "Priority support",         starter: false,  pro: false,          team: true },
  ],

  features: [
    { icon: "IconNfc",     name: "Tap to share",        one: "Hold the card to any phone.",
      blurb: "NFC fires the instant your card meets a phone — your profile opens in the browser, no app on either side. Works on virtually every modern iPhone and Android." },
    { icon: "IconQr",      name: "QR backup",           one: "For every other phone.",
      blurb: "A printed QR on the back does the exact same job for older or NFC-off phones. Point, scan, done — your card never fails to open." },
    { icon: "IconDownload",name: "Save to contacts",    one: "One tap into their phone.",
      blurb: "A single tap writes a full contact card — name, photo, role, every link — straight into their address book. You stay in the phone, not the drawer." },
    { icon: "IconRefresh", name: "Always up to date",   one: "Change once, everywhere.",
      blurb: "New title, new number, new link? Edit your profile and every card you've ever shared updates itself. The physical card never goes stale." },
    { icon: "IconChart",   name: "Tap & scan analytics",one: "See what actually lands.",
      blurb: "Track taps, scans, saves, and link clicks over time so you know which introductions turn into conversations — and which links to feature." },
    { icon: "IconLayers",  name: "Wallet pass",         one: "Keep your own card handy.",
      blurb: "Add your card to Apple & Google Wallet for the moments you don't have the physical one — your code is always a swipe away." },
    { icon: "IconShield",  name: "Privacy & control",   one: "You own what shows.",
      blurb: "Decide exactly what appears, pause sharing anytime, and disable a lost card in seconds. We never sell your data." },
    { icon: "IconGlobe",   name: "Custom link & domain",one: "A URL that's unmistakably you.",
      blurb: "Claim a clean handle like hyperion.card/you, or point your own domain at your profile for a fully branded address." },
    { icon: "IconUsers",   name: "Lead capture",        one: "Catch them back.",
      blurb: "Add a one-field capture so the people you meet can leave their details too — every introduction becomes two-way." },
  ],

  faqs: {
    cards: [
      { q: "What's the difference between PVC and metal?", a: "PVC is a light, full-color card printed on both sides — versatile and the best value. Metal is laser-engraved stainless steel with real weight and a premium feel; its NFC chip lives in a tap window on the back so the metal face stays clean." },
      { q: "How do I tap a metal card?", a: "Hold the back of the card to the top of a phone. Metal shields radio, so the chip sits in a small non-metal window on the reverse — that's the spot that taps." },
      { q: "Which NFC chip is inside?", a: "PVC cards ship with an NTAG215 (504 bytes — enough for a full contact). Metal cards step up to an NTAG216 (888 bytes) for extra headroom. Both are NFC Forum Type 2, readable by any modern phone." },
      { q: "Can I change where my card points later?", a: "Yes. The chip points at your Hyperion profile, and you edit the profile anytime — the destination is reprogrammable and your printed card never needs replacing." },
      { q: "Is there a QR code too?", a: "Every physical card carries a QR on the reverse as a universal fallback, so even a phone with NFC switched off can open your card." },
    ],
    pricing: [
      { q: "Is the digital card really free?", a: "Yes — your digital card, QR, and save-to-contacts are free forever. You only pay if you want a physical card or the Pro tools." },
      { q: "Do I need Pro to order a physical card?", a: "No. Anyone can order a PVC or metal card. Pro bundles one PVC card in and adds analytics, custom domain, and lead capture." },
      { q: "What does 'free reorders' mean?", a: "If your details change, you never pay to reprint — your existing card just updates. Replacements for a lost card are at cost." },
      { q: "Can I pay yearly?", a: "Pro is $9/month or $90/year. Team is billed per seat — talk to us for volume pricing." },
    ],
  },
};

Object.assign(window, { CATALOG });
