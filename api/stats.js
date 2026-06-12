// Hyperion Radio telemetry stats (Vercel serverless function).
// Reads the aggregate counters from Vercel KV (Upstash Redis) for the dashboard.
// Token-gated via STATS_TOKEN so the numbers aren't world-readable.
import { Redis } from '@upstash/redis';

const redis = (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
  ? new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN })
  : null;

export default async function handler(req, res) {
  // The private admin launcher is an off-site local file (origin null); allow it
  // to read the token-gated stats. The STATS_TOKEN is the actual gate, not origin.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  const token = (req.query && req.query.token) || '';
  if (process.env.STATS_TOKEN && token !== process.env.STATS_TOKEN) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  res.setHeader('Cache-Control', 'no-store');
  if (!redis) {
    res.status(200).json({ totals: {}, uniqueSessions: 0, completionRate: 0, tracks: [], byDay: {}, note: 'KV not configured', updated: Date.now() });
    return;
  }
  try {
    const [totals, sessions, trackIds] = await Promise.all([
      redis.hgetall('tel:totals'),
      redis.scard('tel:sessions'),
      redis.smembers('tel:tracks'),
    ]);
    const tracks = [];
    for (const id of (trackIds || [])) {
      const h = (await redis.hgetall(`tel:track:${id}`)) || {};
      tracks.push({
        id, title: h.title || id,
        play: +(h.play || 0), complete: +(h.complete || 0), skip: +(h.skip || 0), download: +(h.download || 0),
      });
    }
    tracks.sort((a, b) => b.play - a.play);

    const byDay = {};
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today); d.setUTCDate(d.getUTCDate() - i);
      const key = d.toISOString().slice(0, 10);
      byDay[key] = (await redis.hgetall(`tel:day:${key}`)) || {};
    }

    const t = totals || {};
    const plays = +(t.play || 0); const completes = +(t.complete || 0);
    res.status(200).json({
      totals: t,
      uniqueSessions: sessions || 0,
      completionRate: plays ? +(completes / plays).toFixed(3) : 0,
      tracks, byDay, updated: Date.now(),
    });
  } catch (err) {
    res.status(500).json({ error: String((err && err.message) || err) });
  }
}
