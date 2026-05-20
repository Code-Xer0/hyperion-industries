import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'

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
              } catch (e) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
              }
            });
            return;
          }
        }

        if (req.url === '/api/upload' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk.toString() });
          req.on('end', () => {
            try {
              const { filename, data } = JSON.parse(body);
              if (!filename || !data) throw new Error('Missing file data');
              
              const base64Content = data.split(';base64,').pop();
              const uploadDir = path.resolve(__dirname, 'public/assets/uploads');
              
              if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
              }
              
              const targetPath = path.resolve(uploadDir, filename);
              fs.writeFileSync(targetPath, base64Content, { encoding: 'base64' });
              
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, path: `/assets/uploads/${filename}` }));
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
