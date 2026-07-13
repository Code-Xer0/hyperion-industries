/* ── Hyperion Radio telemetry (client) ──────────────────────────────────────
 * Fire-and-forget event beacons to /api/telemetry. Anonymous: a random session
 * id in localStorage, no PII, and it stays silent if the visitor has Do-Not-Track
 * on. Events: visit, radio_open, play, complete, skip, seek, download.
 * The same /api/telemetry endpoint is served by the Vite dev middleware (local
 * NDJSON sink) and by the Vercel function (Vercel KV) in production. */

const SID_KEY = 'hyperion_sid';
const TELEMETRY_ENDPOINT = import.meta.env.VITE_TELEMETRY_ENDPOINT || '';

function dnt() {
  try {
    return navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.msDoNotTrack === '1';
  } catch { return false; }
}

function sessionId() {
  try {
    let s = localStorage.getItem(SID_KEY);
    if (!s) {
      s = (crypto && crypto.randomUUID) ? crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).slice(2));
      localStorage.setItem(SID_KEY, s);
    }
    return s;
  } catch { return 'anon'; }
}

export function track(event, props = {}) {
  if (dnt() || !TELEMETRY_ENDPOINT) return;
  try {
    const body = JSON.stringify({ e: event, s: sessionId(), ts: Date.now(), ...props });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(TELEMETRY_ENDPOINT, new Blob([body], { type: 'application/json' }));
    } else {
      fetch(TELEMETRY_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
    }
  } catch { /* never let telemetry break playback */ }
}
