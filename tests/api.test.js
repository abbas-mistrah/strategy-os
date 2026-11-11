'use strict';

// STRATEGY OS — HTTP API smoke tests.
// Starts the real server on a free local port with a throwaway SQLite file,
// so the developer database in data/ is never touched.

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');

const root = path.join(__dirname, '..');
let child;
let base;
let tmpDir;

function freePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.unref();
    probe.on('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

async function waitForHealth(url, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${url}/api/health`);
      if (response.ok) return;
    } catch { /* server not up yet */ }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('STRATEGY OS server did not become healthy in time');
}

test.before(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'strategy-os-test-'));
  const port = await freePort();
  base = `http://127.0.0.1:${port}`;
  child = spawn(process.execPath, ['server.js'], {
    cwd: root,
    env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', STRATEGY_OS_DB: path.join(tmpDir, 'test.db') },
    stdio: 'ignore'
  });
  await waitForHealth(base);
});

test.after(() => {
  if (child) child.kill();
  if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('GET /api/health reports the service and the test database', async () => {
  const response = await fetch(`${base}/api/health`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.service, 'STRATEGY OS');
  assert.equal(body.database, 'test.db');
});

test('GET /api/state returns a seeded portfolio and a strategy', async () => {
  const response = await fetch(`${base}/api/state`);
  assert.equal(response.status, 200);
  const state = await response.json();
  assert.ok(Array.isArray(state.portfolio.initiatives));
  assert.ok(state.portfolio.initiatives.length > 0, 'demo data should be seeded');
  assert.ok(state.strategy, 'strategy should be computed');
});

test('POST /api/initiatives rejects a missing name with 422', async () => {
  const response = await fetch(`${base}/api/initiatives`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({})
  });
  assert.equal(response.status, 422);
});

test('POST /api/initiatives creates an initiative that appears in the portfolio', async () => {
  const name = 'API smoke test initiative';
  const response = await fetch(`${base}/api/initiatives`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, investment: 1000, annualized_value: 5000 })
  });
  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(body.initiative.name, name);
  assert.ok(body.state.portfolio.initiatives.some(item => item.name === name));
});

test('unknown initiative returns 404 on measurement and evidence routes', async () => {
  for (const route of ['measurements', 'evidence']) {
    const response = await fetch(`${base}/api/initiatives/999999/${route}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({})
    });
    assert.equal(response.status, 404, route);
  }
});

test('GET /api/export?format=csv returns a CSV attachment', async () => {
  const response = await fetch(`${base}/api/export?format=csv`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/csv/);
  assert.match(response.headers.get('content-disposition'), /strategy-os-portfolio\.csv/);
  const csv = await response.text();
  assert.ok(csv.split('\n').length > 1, 'CSV should have a header and rows');
});

test('unknown API route returns 404 JSON', async () => {
  const response = await fetch(`${base}/api/does-not-exist`);
  assert.equal(response.status, 404);
  assert.ok((await response.json()).error);
});

test('static server does not serve files outside public/', async () => {
  const response = await fetch(`${base}/..%2fpackage.json`);
  assert.notEqual(response.status, 200);
  const response2 = await fetch(`${base}/%2e%2e/server.js`);
  const text = await response2.text();
  assert.ok(!text.includes('handleApi'), 'server source must never be served');
});
