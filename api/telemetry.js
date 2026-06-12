// Hyperion Radio telemetry ingest (Vercel serverless function).
// Stores anonymous event counters in Vercel KV (Upstash Redis). Degrades to a
// silent 204 if KV isn't provisioned yet, so the site never errors on beacons.
import { Redis } from '@upstash/redis';

const redis = (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
  ? new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN })
  : null;

const EVENTS = new Set(['visit', 'radio_open', 'play', 'complete', 'skip', 'seek', 'download', 'pause']);

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }
  try {
    const evt = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const e = String(evt.e || '').slice(0, 32);
    if (!EVENTS.has(e) || !redis) { res.status(204).end(); return; }

    const day = new Date().toISOString().slice(0, 10);
    const ops = [
      redis.hincrby('tel:totals', e, 1),
      redis.hincrby(`tel:day:${day}`, e, 1),
    ];
    if (evt.s) ops.push(redis.sadd('tel:sessions', String(evt.s).slice(0, 64)));
    if (evt.t) {
      const tid = String(evt.t).slice(0, 64);
      ops.push(redis.sadd('tel:tracks', tid));
      ops.push(redis.hincrby(`tel:track:${tid}`, e, 1));
      if (evt.title) ops.push(redis.hset(`tel:track:${tid}`, { title: String(evt.title).slice(0, 120) }));
    }
    await Promise.all(ops);
    res.status(204).end();
  } catch {
    // never surface telemetry errors to the visitor
    res.status(204).end();
  }
}
