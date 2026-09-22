'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {
  getState,
  updateOrganization,
  createInitiative,
  updateInitiative,
  addMeasurement,
  addEvidence,
  saveStrategy,
  databasePath
} = require('./src/database');
const { calculatePortfolio, buildStrategy, buildValueFlows } = require('./src/engine');

const port = Number(process.env.PORT) || 4310;
const host = process.env.HOST || '127.0.0.1';
const publicDirectory = path.join(__dirname, 'public');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

function sendJson(response, status, payload) {
  const body = JSON.stringify(payload, (_, value) => typeof value === 'bigint' ? Number(value) : value);
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  response.end(body);
}

function sendText(response, status, body, contentType = 'text/plain; charset=utf-8', extraHeaders = {}) {
  response.writeHead(status, {
    'Content-Type': contentType,
    'Content-Length': Buffer.byteLength(body),
    'X-Content-Type-Options': 'nosniff',
    ...extraHeaders
  });
  response.end(body);
}

function parseBody(request) {
  return new Promise((resolve, reject) => {
    let raw = '';
    request.on('data', chunk => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error('Payload too large'));
        request.destroy();
      }
    });
    request.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    request.on('error', reject);
  });
}

function fullState() {
  const state = getState();
  const portfolio = calculatePortfolio(state.initiatives);
  const strategy = buildStrategy(state.organization, state.departments, portfolio);
  const flows = buildValueFlows(state.initiatives);
  return { ...state, portfolio, strategy, flows, database: { engine: 'SQLite', mode: 'local-first' } };
}

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function initiativesCsv(state) {
  const columns = [
    'id', 'name', 'department_name', 'owner', 'status', 'stage', 'mechanism', 'value_type',
    'investment', 'run_cost', 'internal_hours', 'annualized_value', 'actual_value', 'confidence',
    'attribution', 'adoption', 'evidence_level', 'risk_adjusted_value', 'net_value', 'roi'
  ];
  return [columns.join(','), ...state.portfolio.initiatives.map(item => columns.map(key => csvCell(item[key])).join(','))].join('\n');
}

async function handleApi(request, response, url) {
  const pathname = url.pathname;
  if (request.method === 'GET' && pathname === '/api/health') {
    return sendJson(response, 200, { ok: true, service: 'STRATEGY OS', database: path.basename(databasePath), time: new Date().toISOString() });
  }
  if (request.method === 'GET' && pathname === '/api/state') {
    return sendJson(response, 200, fullState());
  }
  if (request.method === 'GET' && pathname === '/api/export') {
    const state = fullState();
    if (url.searchParams.get('format') === 'csv') {
      return sendText(response, 200, initiativesCsv(state), 'text/csv; charset=utf-8', {
        'Content-Disposition': 'attachment; filename="strategy-os-portfolio.csv"'
      });
    }
    return sendText(response, 200, JSON.stringify(state, null, 2), 'application/json; charset=utf-8', {
      'Content-Disposition': 'attachment; filename="strategy-os-export.json"'
    });
  }
  if (request.method === 'POST' && pathname === '/api/profile') {
    const body = await parseBody(request);
    return sendJson(response, 200, { organization: updateOrganization(body), state: fullState() });
  }
  if (request.method === 'POST' && pathname === '/api/initiatives') {
    const body = await parseBody(request);
    if (!String(body.name || '').trim()) return sendJson(response, 422, { error: 'Le nom de l’initiative est obligatoire.' });
    const item = createInitiative(body);
    return sendJson(response, 201, { initiative: item, state: fullState() });
  }

  const initiativeMatch = pathname.match(/^\/api\/initiatives\/(\d+)$/);
  if (initiativeMatch && request.method === 'PATCH') {
    const body = await parseBody(request);
    const item = updateInitiative(Number(initiativeMatch[1]), body);
    return item ? sendJson(response, 200, { initiative: item, state: fullState() }) : sendJson(response, 404, { error: 'Initiative introuvable.' });
  }

  const measurementMatch = pathname.match(/^\/api\/initiatives\/(\d+)\/measurements$/);
  if (measurementMatch && request.method === 'POST') {
    const body = await parseBody(request);
    const measurement = addMeasurement(Number(measurementMatch[1]), body);
    return measurement ? sendJson(response, 201, { measurement, state: fullState() }) : sendJson(response, 404, { error: 'Initiative introuvable.' });
  }

  const evidenceMatch = pathname.match(/^\/api\/initiatives\/(\d+)\/evidence$/);
  if (evidenceMatch && request.method === 'POST') {
    const body = await parseBody(request);
    const item = addEvidence(Number(evidenceMatch[1]), body);
    return item ? sendJson(response, 201, { evidence: item, state: fullState() }) : sendJson(response, 404, { error: 'Initiative introuvable.' });
  }

  if (request.method === 'POST' && pathname === '/api/strategy/generate') {
    const state = fullState();
    const snapshotId = saveStrategy(state.strategy);
    return sendJson(response, 201, { snapshot_id: snapshotId, strategy: state.strategy, state: fullState() });
  }

  return sendJson(response, 404, { error: 'Route API introuvable.' });
}

function serveStatic(response, url) {
  const requested = url.pathname === '/' ? '/index.html' : url.pathname;
  const relativePath = path.normalize(decodeURIComponent(requested)).replace(/^([.][.][/\\])+/, '');
  const filePath = path.resolve(publicDirectory, `.${path.sep}${relativePath.replace(/^[/\\]/, '')}`);
  if (!filePath.startsWith(publicDirectory)) return sendJson(response, 403, { error: 'Accès refusé.' });

  fs.readFile(filePath, (error, data) => {
    if (error) {
      if (path.extname(requested)) return sendJson(response, 404, { error: 'Fichier introuvable.' });
      return fs.readFile(path.join(publicDirectory, 'index.html'), (fallbackError, fallback) => {
        if (fallbackError) return sendJson(response, 404, { error: 'Page introuvable.' });
        sendText(response, 200, fallback, 'text/html; charset=utf-8', { 'Cache-Control': 'no-cache' });
      });
    }
    const extension = path.extname(filePath).toLowerCase();
    const cacheControl = ['.html', '.js', '.css', '.webmanifest'].includes(extension) ? 'no-cache' : 'public, max-age=86400';
    response.writeHead(200, {
      'Content-Type': mimeTypes[extension] || 'application/octet-stream',
      'Content-Length': data.length,
      'Cache-Control': cacheControl,
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'Cross-Origin-Opener-Policy': 'same-origin'
    });
    response.end(data);
  });
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || `${host}:${port}`}`);
  try {
    if (url.pathname.startsWith('/api/')) return await handleApi(request, response, url);
    if (request.method !== 'GET' && request.method !== 'HEAD') return sendJson(response, 405, { error: 'Méthode non autorisée.' });
    return serveStatic(response, url);
  } catch (error) {
    console.error(error);
    return sendJson(response, error.message === 'Payload too large' ? 413 : 500, { error: error.message || 'Erreur interne.' });
  }
});

server.listen(port, host, () => {
  console.log(`STRATEGY OS · Transformation Intelligence & ROI`);
  console.log(`http://${host}:${port}`);
  console.log(`SQLite: ${databasePath}`);
});

module.exports = server;
