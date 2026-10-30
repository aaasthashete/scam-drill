#!/usr/bin/env node
/*
  Scam Drill - local server (optional)
  ------------------------------------
  Serves the app on http://localhost:8080 and proxies /api/ollama/chat to the
  Ollama instance on this machine. The proxy exists so the browser can reach
  Ollama without CORS trouble and without opening Ollama to other origins.

  Usage:   node tools/serve.js
  Options: PORT=8080  OLLAMA_URL=http://127.0.0.1:11434/api/chat  node tools/serve.js

  Node 18 or newer. No dependencies, no build step.
*/
'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || '127.0.0.1';
const OLLAMA_URL = new URL(process.env.OLLAMA_URL || 'http://127.0.0.1:11434/api/chat');
const MAX_BODY = 200 * 1024;
/*
  Just above the browser's own 360 s generation deadline
  (window.SCAM_DRILL_AI_TIMEOUT), so the app always decides when to stop and
  keeps the scenarios that already arrived. Override with OLLAMA_TIMEOUT_MS if
  you raise the client deadline.
*/
const UPSTREAM_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS) || 365 * 1000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

function send(res, status, body, type) {
  if (res.headersSent) { res.end(); return; }
  res.writeHead(status, {
    'Content-Type': type || 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(body);
}

function proxyToOllama(req, res) {
  let size = 0;
  const chunks = [];
  let aborted = false;

  req.on('data', (chunk) => {
    size += chunk.length;
    if (size > MAX_BODY) {
      aborted = true;
      send(res, 413, JSON.stringify({ error: 'Request body too large.' }), 'application/json; charset=utf-8');
      req.destroy();
      return;
    }
    chunks.push(chunk);
  });

  req.on('end', () => {
    if (aborted) { return; }
    const body = Buffer.concat(chunks);

    const upstream = http.request({
      protocol: OLLAMA_URL.protocol,
      hostname: OLLAMA_URL.hostname,
      port: OLLAMA_URL.port || 11434,
      path: OLLAMA_URL.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': body.length
      }
    }, (upstreamRes) => {
      const status = upstreamRes.statusCode || 502;
      const type = upstreamRes.headers['content-type'] || 'application/json; charset=utf-8';
      if (!res.headersSent) {
        res.writeHead(status, {
          'Content-Type': type,
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff'
        });
      }
      upstreamRes.pipe(res);
    });

    upstream.setTimeout(UPSTREAM_TIMEOUT_MS, () => {
      if (!res.headersSent) {
        res.writeHead(504, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff'
        });
        res.end(JSON.stringify({ error: 'Ollama took too long. The app will use its built-in set.' }));
      } else {
        upstream.destroy(new Error('timeout'));
      }
    });

    upstream.on('error', (err) => {
      if (res.headersSent) { res.end(); return; }
      const message = err && err.code === 'ECONNREFUSED'
        ? 'Ollama is not running. Start it with "ollama serve", then try again.'
        : 'Could not reach Ollama: ' + (err && err.message ? err.message : 'unknown error');
      send(res, 502, JSON.stringify({ error: message }), 'application/json; charset=utf-8');
    });

    upstream.end(body);
  });
}

function serveFile(req, res, pathname) {
  let relative;
  try {
    relative = decodeURIComponent(pathname);
  } catch (err) {
    send(res, 400, 'Bad request');
    return;
  }
  if (relative === '/' || relative === '') { relative = '/index.html'; }
  if (relative.includes('\0')) { send(res, 400, 'Bad request'); return; }

  const filePath = path.join(ROOT, relative);
  if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) {
    send(res, 403, 'Forbidden');
    return;
  }

  const segments = path.relative(ROOT, filePath).split(path.sep);
  if (segments.some((segment) => segment.startsWith('.')) || segments[0] === 'tools') {
    send(res, 404, 'Not found');
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      send(res, 404, 'Not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Content-Length': stat.size,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    });
    if (req.method === 'HEAD') { res.end(); return; }
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  if (!req.url) { send(res, 400, 'Bad request'); return; }
  const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));

  if (url.pathname === '/api/ollama/chat') {
    if (req.method !== 'POST') {
      send(res, 405, JSON.stringify({ error: 'Use POST.' }), 'application/json; charset=utf-8');
      return;
    }
    proxyToOllama(req, res);
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    send(res, 405, 'Method not allowed');
    return;
  }

  serveFile(req, res, url.pathname);
});

server.listen(PORT, HOST, () => {
  console.log('Scam Drill is running at http://localhost:' + PORT);
  console.log('Serving files from ' + ROOT);
  console.log('Ollama proxy: http://localhost:' + PORT + '/api/ollama/chat -> ' + OLLAMA_URL.href);
  console.log('Stop with Ctrl+C.');
});
