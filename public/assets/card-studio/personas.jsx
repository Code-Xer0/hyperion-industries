// =========================================================
// Shared personas — profession-true sample identities.
// One engine, any trade. Used by the gallery, order section,
// templates page, and order wizard so personas never drift.
// =========================================================

const PERSONA_VARIANTS = {
  slate:    { initials: "JR", name: "Jonah Reyes",      role: "Operations Lead",        org: "Atlas Group",        serial: "HCS · 0118",
              credential: "OPS · LIVE", footTag: "Operations — Atlas Group",
              capability: "Delivery · Resourcing · Process",
              email: "jonah@atlasgroup.co", phone: "+1 (312) 555-0142", website: "atlasgroup.co",
              availableFor: ["Program delivery", "Vendor & resourcing", "Process design"],
              tagline: "Keeps the moving parts moving." },
  ivory:    { initials: "EL", name: "Elise Lambert",     role: "Management Consultant",   org: "Lambert Advisory",   serial: "HCS · 0067",
              credential: "ADVISORY", footTag: "Independent advisory",
              capability: "Strategy · Org Design · Advisory",
              email: "elise@lambertadvisory.com", phone: "+1 (646) 555-0188", website: "lambertadvisory.com",
              availableFor: ["Strategy sprints", "Org design", "Board advisory"],
              tagline: "Clear thinking for complicated rooms." },
  counsel:  { initials: "EW", name: "Eleanor Whitfield", role: "Attorney at Law",         org: "Whitfield & Cross",  serial: "HCS · 0031",
              credential: "BAR · CA #2841", footTag: "Admitted to the State Bar",
              capability: "Litigation · M&A · IP",
              email: "ew@whitfieldcross.law", phone: "+1 (415) 555-0119", website: "whitfieldcross.law",
              availableFor: ["Contracts & disputes", "Mediation", "Corporate counsel"],
              tagline: "Counsel that holds up under pressure." },
  sterling: { initials: "MD", name: "Marcus Devlin",     role: "Managing Director",       org: "Halcyon Capital",    serial: "HCS · 0049",
              credential: "SERIES 7 · 66", footTag: "Halcyon Capital — Private",
              capability: "Wealth · Private Markets · M&A",
              email: "m.devlin@halcyon.capital", phone: "+1 (212) 555-0177", website: "halcyon.capital",
              availableFor: ["Wealth structuring", "Private markets", "M&A advisory"],
              tagline: "Patient capital, precise execution." },
  atelier:  { initials: "NS", name: "Nadia Sørensen",    role: "Studio Artist",           org: "Atelier Sørensen",   serial: "HCS · 0072",
              credential: "STUDIO · 2014", footTag: "Commissions open",
              capability: "Commissions · Exhibitions · Licensing",
              email: "studio@sorensen.art", phone: "+45 31 55 01 72", website: "sorensen.art",
              availableFor: ["Commissions", "Exhibitions", "Licensing"],
              tagline: "Work that asks to be looked at twice." },
  meridian: { initials: "HT", name: "Hiro Tanaka",       role: "Principal Architect",     org: "Meridian Studio",    serial: "HCS · 0085",
              credential: "AIA · LIC", footTag: "Meridian Studio — Practice",
              capability: "Residential · Adaptive Reuse · Planning",
              email: "hiro@meridian.studio", phone: "+1 (213) 555-0185", website: "meridian.studio",
              availableFor: ["Residential", "Adaptive reuse", "Master planning"],
              tagline: "Structure, light, and everything between." },
  verdant:  { initials: "AO", name: "Dr. Amara Osei",    role: "Naturopathic Physician",  org: "Verdant Health",     serial: "HCS · 0094",
              credential: "ND · LIC", footTag: "Accepting new patients",
              capability: "Consults · Wellness Plans · Telehealth",
              email: "care@verdant.health", phone: "+1 (503) 555-0194", website: "verdant.health",
              availableFor: ["Consultations", "Wellness plans", "Telehealth"],
              tagline: "Care that starts by listening." },
  operator: { initials: "VA", name: "Victor Amani",      role: "Founder & Systems Architect", org: "Hyperion",       serial: "HYP-Δ-0001",
              credential: "CAL · NOMINAL", footTag: "Built to survive contact with reality",
              capability: "Infrastructure · Continuity · AI Systems", connectLabel: "Comms Console",
              email: "deusx@hyperion.industries", phone: "+1 (612) 314-9992", website: "hyperion.industries",
              availableFor: ["Systems consulting", "Deployment architecture", "AI integration"],
              tagline: "Systems architect. Infrastructure. Continuity.", status: "ONLINE" },
};

const DEFAULT_PERSON = {
  initials: "MO", name: "Maya Okonkwo", role: "Product Designer", org: "Northbound Studio",
  serial: "HCS · 0042", status: "LIVE", credential: "DESIGN · OPEN", footTag: "Open to new projects",
  capability: "Product · Systems · Prototyping",
  email: "maya@northbound.co", phone: "+1 (415) 720-3318", website: "maya.studio",
  availableFor: ["Product design", "Design systems", "Prototyping"],
  tagline: "Design that earns the next conversation.",
  backNote: "One tap shares everything — and updates itself the moment anything changes.",
};

// merge a persona over a base and (re)build the contact rail so it always
// matches the merged email / phone / website.
function personaFor(key, base) {
  const b = base || DEFAULT_PERSON;
  const merged = { ...b, ...(PERSONA_VARIANTS[key] || {}) };
  merged.contacts = [
    { icon: IconMail,  text: merged.email },
    { icon: IconPhone, text: merged.phone },
    { icon: IconGlobe, text: merged.website },
  ];
  if (!merged.backNote) merged.backNote = DEFAULT_PERSON.backNote;
  return merged;
}

Object.assign(window, {
  PERSONA_VARIANTS, DEFAULT_PERSON, personaFor,
  galleryPersonFor: personaFor,   // back-compat alias
});
