import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const ALLOWED_UPLOAD_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif',
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/flac',
  'audio/aac',
  'audio/mp4',
  'audio/x-m4a',
  'audio/ogg',
]);

const IMAGE_RE = /\.(png|jpe?g|webp|gif|svg|avif)$/i;
const VIDEO_RE = /\.(mp4|webm|ogg|mov)$/i;
const AUDIO_RE = /\.(mp3|wav|flac|aac|m4a|oga)$/i;

function safeAssetName(filename) {
  const ext = path.extname(filename || '').toLowerCase();
  const stem = path.basename(filename || 'asset', ext)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'asset';
  return `${Date.now()}-${stem}${ext}`;
}

function mediaTypeForPath(assetPath) {
  if (VIDEO_RE.test(assetPath)) return 'video';
  if (AUDIO_RE.test(assetPath)) return 'audio';
  if (/youtube\.com|youtu\.be|vimeo\.com/i.test(assetPath)) return 'embed';
  return 'image';
}

function listMediaFiles(rootDir, publicPrefix) {
  if (!fs.existsSync(rootDir)) return [];
  return fs.readdirSync(rootDir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(rootDir, entry.name);
    const relPath = `${publicPrefix}/${entry.name}`.replace(/\\/g, '/');
    if (entry.isDirectory()) return listMediaFiles(fullPath, relPath);
    if (!IMAGE_RE.test(entry.name) && !VIDEO_RE.test(entry.name) && !AUDIO_RE.test(entry.name)) return [];
    const stat = fs.statSync(fullPath);
    const type = mediaTypeForPath(entry.name);
    return [{
      name: entry.name,
      path: relPath,
      type,
      size: stat.size,
      modified: stat.mtimeMs,
      media: {
        type,
        src: relPath,
        controls: type === 'video',
        muted: type === 'video',
      },
    }];
  });
}

// ── Telemetry dev sink (mirrors the Vercel KV function in production) ──
const TEL_FILE = path.resolve(__dirname, 'telemetry/events.ndjson');
function appendTelemetry(evt) {
  try {
    fs.mkdirSync(path.dirname(TEL_FILE), { recursive: true });
    fs.appendFileSync(TEL_FILE, JSON.stringify(evt) + '\n');
  } catch { /* ignore */ }
}
function readTelemetry() {
  try {
    return fs.readFileSync(TEL_FILE, 'utf-8').split('\n').filter(Boolean)
      .map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  } catch { return []; }
}
function aggregate(events) {
  const totals = {}; const sessions = new Set(); const tracks = {}; const byDay = {};
  for (const ev of events) {
    const e = ev.e || 'unknown';
    totals[e] = (totals[e] || 0) + 1;
    if (ev.s) sessions.add(ev.s);
    const day = new Date(ev.ts || Date.now()).toISOString().slice(0, 10);
    byDay[day] = byDay[day] || {};
    byDay[day][e] = (byDay[day][e] || 0) + 1;
    if (ev.t) {
      const tr = tracks[ev.t] || (tracks[ev.t] = { id: ev.t, title: ev.title || ev.t, play: 0, complete: 0, skip: 0, download: 0 });
      if (tr[e] !== undefined) tr[e] += 1;
      if (ev.title) tr.title = ev.title;
    }
  }
  const plays = totals.play || 0; const completes = totals.complete || 0;
  return {
    totals, uniqueSessions: sessions.size, events: events.length,
    completionRate: plays ? +(completes / plays).toFixed(3) : 0,
    tracks: Object.values(tracks).sort((a, b) => b.play - a.play),
    byDay, updated: Date.now(),
  };
}

function localCmsPlugin() {
  return {
    name: 'local-cms',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Handle CORS just in case, though it's same-origin typically
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }

        if (req.url.startsWith('/api/data/')) {
          const model = req.url.replace('/api/data/', '');
          const filePath = path.resolve(__dirname, `src/data/${model}.json`);

          if (req.method === 'GET') {
            if (fs.existsSync(filePath)) {
              res.setHeader('Content-Type', 'application/json');
              res.end(fs.readFileSync(filePath, 'utf-8'));
            } else {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: 'Not found' }));
            }
            return;
          }

          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString() });
            req.on('end', () => {
              try {
                // Ensure valid JSON before writing
                JSON.parse(body);
                fs.writeFileSync(filePath, body, 'utf-8');
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true }));
              } catch {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
              }
            });
            return;
          }
        }

        if (req.url === '/api/media' && req.method === 'GET') {
          const roots = [
            [path.resolve(__dirname, 'public/assets/uploads'), '/assets/uploads'],
            [path.resolve(__dirname, 'public/assets/radio'), '/assets/radio'],
            [path.resolve(__dirname, 'public/assets/builds'), '/assets/builds'],
            [path.resolve(__dirname, 'public/assets/operators'), '/assets/operators'],
            [path.resolve(__dirname, 'public/assets/branding'), '/assets/branding'],
          ];
          const items = roots
            .flatMap(([root, prefix]) => listMediaFiles(root, prefix))
            .sort((a, b) => b.modified - a.modified);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, items }));
          return;
        }

        if (req.url === '/api/upload' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk.toString() });
          req.on('end', () => {
            try {
              const { filename, data, mimeType } = JSON.parse(body);
              if (!filename || !data) throw new Error('Missing file data');
              const detectedMime = mimeType || data.match(/^data:([^;]+);base64,/)?.[1] || '';
              if (!ALLOWED_UPLOAD_MIME.has(detectedMime)) {
                throw new Error(`Unsupported media type: ${detectedMime || 'unknown'}`);
              }
              
              const base64Content = data.split(';base64,').pop();
              const fileType = detectedMime.startsWith('video/') ? 'video'
                : detectedMime.startsWith('audio/') ? 'audio' : 'image';
              const subdir = fileType === 'audio' ? 'radio' : 'uploads';
              const uploadDir = path.resolve(__dirname, `public/assets/${subdir}`);
              
              if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
              }
              
              const safeName = safeAssetName(filename);
              const targetPath = path.resolve(uploadDir, safeName);
              fs.writeFileSync(targetPath, base64Content, { encoding: 'base64' });
              const assetPath = `/assets/${subdir}/${safeName}`;
              const type = fileType;
              
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: true,
                path: assetPath,
                media: {
                  type,
                  src: assetPath,
                  controls: type === 'video' || type === 'audio',
                  muted: type === 'video',
                },
              }));
            } catch (e) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Upload failed', details: e.message }));
            }
          });
          return;
        }

        if (req.url === '/api/commit' && req.method === 'POST') {
          exec('git status --porcelain src/data/ public/assets/', (statusErr, statusStdout) => {
            if (statusErr) {
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, error: statusErr.message }));
            }
            if (!statusStdout.trim()) {
              // Nothing to commit
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: true, stdout: 'No changes to commit. Already up to date.' }));
            }
            exec('git add src/data/ public/assets/ && git commit -m "Content and assets updated via Editor" && git push', (error, stdout, stderr) => {
              res.setHeader('Content-Type', 'application/json');
              if (error) {
                res.end(JSON.stringify({ success: false, error: error.message, stderr }));
              } else {
                res.end(JSON.stringify({ success: true, stdout }));
              }
            });
          });
          return;
        }

        if (req.url === '/api/telemetry' && req.method === 'POST') {
          let tbody = '';
          req.on('data', (c) => { tbody += c; });
          req.on('end', () => {
            try { const evt = JSON.parse(tbody || '{}'); evt.ts = evt.ts || Date.now(); appendTelemetry(evt); } catch { /* ignore */ }
            res.statusCode = 204; res.end();
          });
          return;
        }

        if (req.url.startsWith('/api/stats') && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(aggregate(readTelemetry())));
          return;
        }

        next();
      });
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    { enforce: 'pre', ...mdx() },
    react(),
    localCmsPlugin()
  ],
})
