// Hyperion Card Studio — stroke icon set (1.6px, currentColor).
// Self-contained for the studio page (no dependency on the operator-card icons.jsx).

const SIcon = ({ children, size = 18, sw = 1.6, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth={sw} strokeLinecap="round"
       strokeLinejoin="round" aria-hidden="true" {...rest}>
    {children}
  </svg>
);

const IconNfc = (p) => (<SIcon {...p}>
  <path d="M5 7.5a9 9 0 0 1 0 9" /><path d="M9 5.5a14 14 0 0 1 0 13" />
  <path d="M14 9a4 4 0 0 0-3 0c-1 .5-1 1.5 0 5.5" />
  <path d="M19 5.5a14 14 0 0 0 0 13" />
</SIcon>);
const IconQr = (p) => (<SIcon {...p}>
  <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
  <rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3" /><path d="M21 14v7h-7" /><path d="M17 21h.01M21 17h.01" />
</SIcon>);
const IconArrowRight = (p) => (<SIcon {...p}><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></SIcon>);
const IconCheck = (p) => (<SIcon {...p}><path d="M4 12.5l5 5L20 6.5" /></SIcon>);
const IconBolt = (p) => (<SIcon {...p}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" /></SIcon>);
const IconLayers = (p) => (<SIcon {...p}>
  <path d="M12 3 3 8l9 5 9-5-9-5z" /><path d="M3 13l9 5 9-5" /><path d="M3 18l9 5 9-5" />
</SIcon>);
const IconRefresh = (p) => (<SIcon {...p}>
  <path d="M20 11a8 8 0 0 0-14-4l-2 2" /><path d="M4 5v4h4" />
  <path d="M4 13a8 8 0 0 0 14 4l2-2" /><path d="M20 19v-4h-4" />
</SIcon>);
const IconChart = (p) => (<SIcon {...p}>
  <path d="M4 20V4" /><path d="M4 20h16" /><rect x="8" y="11" width="3" height="6" rx="0.5" />
  <rect x="14" y="7" width="3" height="10" rx="0.5" />
</SIcon>);
const IconShield = (p) => (<SIcon {...p}><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" /><path d="M9 12l2 2 4-4" /></SIcon>);
const IconPhone = (p) => (<SIcon {...p}><path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></SIcon>);
const IconMail = (p) => (<SIcon {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></SIcon>);
const IconGlobe = (p) => (<SIcon {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3c2.7 3 2.7 15 0 18M12 3c-2.7 3-2.7 15 0 18" /></SIcon>);
const IconLinkedin = (p) => (<SIcon {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M7 10v7M7 7v.01M11 17v-4a2 2 0 0 1 4 0v4M11 11v6" /></SIcon>);
const IconMapPin = (p) => (<SIcon {...p}><path d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" /></SIcon>);
const IconPlus = (p) => (<SIcon {...p}><path d="M12 5v14M5 12h14" /></SIcon>);
const IconDownload = (p) => (<SIcon {...p}><path d="M12 3v12" /><path d="M7 11l5 5 5-5" /><path d="M4 21h16" /></SIcon>);
const IconFlip = (p) => (<SIcon {...p}><path d="M3 9a6 6 0 0 1 11-3" /><path d="M14 3v4h-4" /><path d="M21 15a6 6 0 0 1-11 3" /><path d="M10 21v-4h4" /></SIcon>);
const IconBriefcase = (p) => (<SIcon {...p}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M3 12h18" /></SIcon>);
const IconCamera = (p) => (<SIcon {...p}><path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L19 6h0a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><circle cx="12" cy="12.5" r="3.2" /></SIcon>);
const IconUsers = (p) => (<SIcon {...p}><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 5.5a3 3 0 0 1 0 5.5" /><path d="M17 14a6 6 0 0 1 4 6" /></SIcon>);
const IconHome = (p) => (<SIcon {...p}><path d="M4 11l8-7 8 7" /><path d="M6 9.5V20h12V9.5" /><path d="M10 20v-5h4v5" /></SIcon>);
const IconSparkle = (p) => (<SIcon {...p}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" /></SIcon>);
const IconPalette = (p) => (<SIcon {...p}><path d="M12 3a9 9 0 0 0 0 18c1.5 0 2-1 2-2s-.6-1.4-.6-2.2c0-.8.7-1.3 1.6-1.3H17a4 4 0 0 0 4-4c0-4.4-4-8.5-9-8.5z" /><circle cx="7.5" cy="11" r="1" fill="currentColor" stroke="none" /><circle cx="10" cy="7.5" r="1" fill="currentColor" stroke="none" /><circle cx="14" cy="7.5" r="1" fill="currentColor" stroke="none" /></SIcon>);
const IconStar = (p) => (<SIcon {...p}><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8-4.3-4.1 5.9-.9L12 3.5z" /></SIcon>);
const IconMic = (p) => (<SIcon {...p}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0" /><path d="M12 18v3" /></SIcon>);
const IconCode = (p) => (<SIcon {...p}><path d="M9 8l-4 4 4 4" /><path d="M15 8l4 4-4 4" /></SIcon>);
const IconChevron = (p) => (<SIcon {...p}><path d="M6 9l6 6 6-6" /></SIcon>);

// brand mark — hexagon ring with center node (Hyperion glyph, calmed down)
const BrandMark = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 2.5 20 7v10l-8 4.5L4 17V7l8-4.5z" stroke="currentColor" strokeWidth="1.4"
          strokeLinejoin="round" opacity="0.9" />
    <circle cx="12" cy="12" r="2.4" fill="currentColor" />
  </svg>
);

Object.assign(window, {
  SIcon, BrandMark,
  IconNfc, IconQr, IconArrowRight, IconCheck, IconBolt, IconLayers, IconRefresh,
  IconChart, IconShield, IconPhone, IconMail, IconGlobe, IconLinkedin, IconMapPin,
  IconPlus, IconDownload, IconFlip, IconBriefcase, IconCamera, IconUsers, IconHome,
  IconSparkle, IconPalette, IconStar, IconMic, IconCode, IconChevron,
});
