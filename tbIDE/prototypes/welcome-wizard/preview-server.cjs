'use strict';
// Development preview only. Loopback, read-only, fixed file allowlist; no packages.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const ROOT = __dirname;
const PORT = 8765;
const ADDRESS = '127.0.0.1';
const FILES = Object.freeze({
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/index.html': ['index.html', 'text/html; charset=utf-8'],
  '/welcome.js': ['welcome.js', 'text/javascript; charset=utf-8'],
  '/controls.js': ['controls.js', 'text/javascript; charset=utf-8'],
  '/welcome.css': ['welcome.css', 'text/css; charset=utf-8'],
  '/master.css': ['master.css', 'text/css; charset=utf-8']
});

function openBrowser(url) {
  // Start the URL using the built-in Windows URL handler, never a remote shell command.
  if (process.platform !== 'win32') return;
  const child = spawn('rundll32.exe', ['url.dll,FileProtocolHandler', url], {
    detached: true, stdio: 'ignore', windowsHide: true
  });
  child.on('error', error => console.warn('Browser did not open automatically:', error.message));
  child.unref();
}
const server = http.createServer((req, res) => {
  let url;
  try { url = new URL(req.url, 'http://' + ADDRESS + ':' + PORT); }
  catch (_e) { res.writeHead(400); res.end('Bad request'); return; }
  const file = Object.prototype.hasOwnProperty.call(FILES, url.pathname) && FILES[url.pathname];
  if ((req.method !== 'GET' && req.method !== 'HEAD') || !file) {
    res.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'});
    res.end('Not found');
    return;
  }
  const filename = path.join(ROOT, file[0]);
  fs.readFile(filename, (error, data) => {
    if (error) {
      res.writeHead(500, {'Content-Type': 'text/plain; charset=utf-8'});
      res.end('Preview asset missing: ' + file[0]);
      return;
    }
    res.writeHead(200, {
      'Content-Type': file[1],
      'Content-Length': data.length,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; frame-src 'self'; img-src 'self' data:; font-src 'self' data:",
    });
    res.end(req.method === 'HEAD' ? undefined : data);
  });
});
server.on('error', error => {
  console.error('Unable to start local preview:', error.message);
  process.exitCode = 1;
});
server.listen(PORT, ADDRESS, () => {
  const url = 'http://' + ADDRESS + ':' + PORT + '/';
  console.log('Welcome Wizard preview ready at ' + url);
  console.log('Press Ctrl+C to stop.');
  openBrowser(url);
});
