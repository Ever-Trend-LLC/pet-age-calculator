'use strict';

/**
 * Minimal zero-dependency static server for the AgePaws site.
 *
 * The project is a static site, so there is no build step: `npm start` serves
 * the repository root as-is. There are no third-party dependencies, which keeps
 * the container image small and the startup instant.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3000;

// AnySites probes the container on its own health-check port as well. Listening
// on both keeps the probe green whether the platform injects PORT or keeps 3000.
const HEALTHCHECK_PORT = Number(process.env.HEALTHCHECK_PORT) || 10031;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json'
};

function send(res, status, body, headers) {
  res.writeHead(status, Object.assign({ 'Content-Type': 'text/plain; charset=utf-8' }, headers));
  res.end(body);
}

function isInsideRoot(target) {
  const relative = path.relative(ROOT, target);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function statOrNull(target) {
  try {
    return fs.statSync(target);
  } catch (error) {
    return null;
  }
}

function resolveFile(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch (error) {
    return null;
  }

  if (decoded.includes('\0')) return null;

  const cleaned = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  const target = path.join(ROOT, cleaned);

  if (!isInsideRoot(target)) return null;

  const stats = statOrNull(target);
  if (!stats) return null;

  if (stats.isDirectory()) {
    const indexFile = path.join(target, 'index.html');
    return statOrNull(indexFile) ? { file: indexFile, stats: statOrNull(indexFile) } : null;
  }

  return { file: target, stats };
}

function handle(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    send(res, 405, 'Method Not Allowed', { Allow: 'GET, HEAD' });
    return;
  }

  let pathname;
  try {
    pathname = new URL(req.url, 'http://localhost').pathname;
  } catch (error) {
    send(res, 400, 'Bad Request');
    return;
  }

  if (pathname === '/healthz') {
    send(res, 200, 'ok');
    return;
  }

  // Canonical URLs use trailing slashes, so redirect the slashless form.
  const lastSegment = pathname.split('/').pop();
  if (pathname !== '/' && !pathname.endsWith('/') && !lastSegment.includes('.')) {
    const dirStats = statOrNull(path.join(ROOT, pathname));
    if (dirStats && dirStats.isDirectory()) {
      res.writeHead(301, { Location: pathname + '/' });
      res.end();
      return;
    }
  }

  const resolved = resolveFile(pathname);
  if (!resolved) {
    const notFound = path.join(ROOT, '404.html');
    if (statOrNull(notFound)) {
      fs.readFile(notFound, (error, data) => {
        if (error) {
          send(res, 404, 'Not Found');
          return;
        }
        res.writeHead(404, { 'Content-Type': MIME_TYPES['.html'] });
        res.end(req.method === 'HEAD' ? undefined : data);
      });
      return;
    }
    send(res, 404, 'Not Found');
    return;
  }

  const ext = path.extname(resolved.file).toLowerCase();
  const isAsset = pathname.startsWith('/assets/');
  const cacheControl = ext === '.html'
    ? 'public, max-age=0, must-revalidate'
    : isAsset
      ? 'public, max-age=31536000, immutable'
      : 'public, max-age=3600';

  res.writeHead(200, {
    'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
    'Content-Length': resolved.stats.size,
    'Cache-Control': cacheControl
  });

  if (req.method === 'HEAD') {
    res.end();
    return;
  }

  const stream = fs.createReadStream(resolved.file);
  stream.on('error', () => {
    res.destroy();
  });
  stream.pipe(res);
}

const server = http.createServer(handle);

server.listen(PORT, () => {
  console.log(`AgePaws static server listening on ${PORT}`);
});

if (HEALTHCHECK_PORT !== PORT) {
  const healthServer = http.createServer(handle);

  healthServer.on('error', (error) => {
    // A second listener is a safety net; never take the app down over it.
    console.warn(`Health-check listener on ${HEALTHCHECK_PORT} unavailable: ${error.code}`);
  });

  healthServer.listen(HEALTHCHECK_PORT, () => {
    console.log(`Health-check listener on ${HEALTHCHECK_PORT}`);
  });
}

function shutdown(signal) {
  console.log(`Received ${signal}, shutting down`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
