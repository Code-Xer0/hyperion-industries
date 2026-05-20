// Inline SVG icons. Stroke-based, 1.5px, currentColor.
// One source of truth — swap any later without touching layout.

const Icon = ({ children, size = 16, ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...rest}
  >
    {children}
  </svg>
);

const IconGlobe = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3c2.7 3 2.7 15 0 18" />
    <path d="M12 3c-2.7 3-2.7 15 0 18" />
  </Icon>
);
const IconMail = (p) => (
  <Icon {...p}>
    <rect x="3" y="5" width="18" height="14" rx="1.5" />
    <path d="M3 7l9 7 9-7" />
  </Icon>
);
const IconGithub = (p) => (
  <Icon {...p}>
    <path d="M9 19c-4.3 1.3-4.3-2.2-6-2.5M15 21v-3.6c0-1 0-1.6-.6-2.2 2.7-.3 5.6-1.3 5.6-6 0-1.2-.5-2.3-1.2-3.1.1-.4.5-1.6-.1-3.2 0 0-1-.3-3.3 1.2a11.4 11.4 0 0 0-6 0C7 .3 6 .6 6 .6c-.6 1.6-.2 2.8-.1 3.2A4.6 4.6 0 0 0 4.7 7c0 4.6 2.8 5.6 5.5 6-.4.4-.6.9-.6 1.7V21" />
  </Icon>
);
const IconLink = (p) => (
  <Icon {...p}>
    <path d="M10 14a4 4 0 0 0 5.6 0l3-3a4 4 0 0 0-5.6-5.6l-1 1" />
    <path d="M14 10a4 4 0 0 0-5.6 0l-3 3a4 4 0 0 0 5.6 5.6l1-1" />
  </Icon>
);
const IconPhone = (p) => (
  <Icon {...p}>
    <path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
  </Icon>
);
const IconLocation = (p) => (
  <Icon {...p}>
    <path d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z" />
    <circle cx="12" cy="10" r="2.5" />
  </Icon>
);
const IconDownload = (p) => (
  <Icon {...p}>
    <path d="M12 3v12" />
    <path d="M7 11l5 5 5-5" />
    <path d="M4 21h16" />
  </Icon>
);
const IconHeart = (p) => (
  <Icon {...p}>
    <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />
  </Icon>
);
const IconCoffee = (p) => (
  <Icon {...p}>
    <path d="M5 9h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" />
    <path d="M16 11h2a2 2 0 0 1 0 4h-2" />
    <path d="M8 3v2M11 3v2" />
  </Icon>
);
const IconNFC = (p) => (
  <Icon {...p}>
    <path d="M6 12a6 6 0 0 1 6-6" />
    <path d="M6 12a6 6 0 0 0 6 6" />
    <path d="M3 12a9 9 0 0 1 9-9" />
    <path d="M3 12a9 9 0 0 0 9 9" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
  </Icon>
);
const IconFlip = (p) => (
  <Icon {...p}>
    <path d="M3 9a6 6 0 0 1 11-3" />
    <path d="M14 3v4h-4" />
    <path d="M21 15a6 6 0 0 1-11 3" />
    <path d="M10 21v-4h4" />
  </Icon>
);
const IconArrow = (p) => (
  <Icon {...p}>
    <path d="M5 12h14" />
    <path d="M13 6l6 6-6 6" />
  </Icon>
);
const IconClock = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Icon>
);
const IconBrain = (p) => (
  <Icon {...p}>
    <path d="M9 4a3 3 0 0 0-3 3v1a3 3 0 0 0-2 3 3 3 0 0 0 2 3v1a3 3 0 0 0 3 3h1V4H9z" />
    <path d="M15 4a3 3 0 0 1 3 3v1a3 3 0 0 1 2 3 3 3 0 0 1-2 3v1a3 3 0 0 1-3 3h-1V4h1z" />
  </Icon>
);
const IconHelix = (p) => (
  <Icon {...p}>
    <path d="M6 4c0 4 12 4 12 8s-12 4-12 8" />
    <path d="M18 4c0 4-12 4-12 8s12 4 12 8" />
  </Icon>
);
const IconInstagram = (p) => (
  <Icon {...p}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </Icon>
);

Object.assign(window, {
  Icon,
  IconGlobe, IconMail, IconGithub, IconLink, IconPhone,
  IconLocation, IconDownload, IconHeart, IconCoffee,
  IconNFC, IconFlip, IconArrow, IconClock, IconBrain, IconHelix,
  IconInstagram,
});
