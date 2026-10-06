/* Servidor estático opcional. Ejecutar: node serve.js. Sin paquetes externos. */
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const files = new Set(['/index.html', '/styles.css', '/js/appearance.js', '/js/domain.js', '/js/storage.js', '/js/app.js', '/js/music-print.js']);
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' };
http.createServer((request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1:8080');
  const file = url.pathname === '/' ? '/index.html' : url.pathname;
  if (!files.has(file) || !['GET', 'HEAD'].includes(request.method)) { response.writeHead(404); response.end('No encontrado'); return; }
  response.setHeader('Content-Type', `${mime[path.extname(file)]}; charset=utf-8`);
  response.setHeader('Cache-Control', 'no-cache');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  if (request.method === 'HEAD') { response.end(); return; }
  const stream = fs.createReadStream(path.join(root, file));
  stream.on('error', () => { response.writeHead(500); response.end('No se pudo leer el archivo'); });
  stream.pipe(response);
}).listen(8080, '127.0.0.1', () => console.log('Bingo 90: http://127.0.0.1:8080 · Ctrl+C para cerrar.'));

