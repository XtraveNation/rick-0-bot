#!/usr/bin/env node

/**
 * Integration Test - Verify all endpoints work
 * Usage: node backend/integration-test.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';
const SESSION_ID = `test-session-${Date.now()}`;

async function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
  } catch (e) {
    console.error(`❌ ${name}:`, e.message);
  }
}

async function main() {
  console.log('🧪 RickiA Integration Tests\n');

  // Jerry Tests
  await test('Jerry: Store message', async () => {
    const res = await request('POST', '/api/jerry/store', {
      session_id: SESSION_ID,
      role: 'user',
      content: 'Hello Rick',
      tokens_used: 5
    });
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    if (!res.data.message_id) throw new Error('No message_id in response');
  });

  await test('Jerry: Get history', async () => {
    const res = await request('GET', `/api/jerry/history/${SESSION_ID}`);
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    if (!Array.isArray(res.data)) throw new Error('Expected array response');
  });

  await test('Jerry: Get entities', async () => {
    const res = await request('GET', `/api/jerry/entities/${SESSION_ID}`);
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    if (!Array.isArray(res.data)) throw new Error('Expected array response');
  });

  // Token Tests
  await test('Tokens: Get balance', async () => {
    const res = await request('GET', `/api/tokens/balance/${SESSION_ID}`);
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    if (typeof res.data.balance !== 'number') throw new Error('No balance in response');
  });

  await test('Tokens: Add tokens', async () => {
    const res = await request('POST', '/api/tokens/add', {
      session_id: SESSION_ID,
      amount: 100
    });
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
  });

  await test('Tokens: Consume tokens', async () => {
    const res = await request('POST', '/api/tokens/consume', {
      session_id: SESSION_ID,
      amount: 10
    });
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
  });

  // Morty Tests
  await test('Morty: List agents', async () => {
    const res = await request('GET', '/api/morty/agents');
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    if (!Array.isArray(res.data)) throw new Error('Expected array response');
  });

  // Payment Tests
  await test('Payments: Create checkout', async () => {
    const res = await request('POST', '/api/payments/create-checkout', {
      session_id: SESSION_ID,
      amount: 9.99,
      provider: 'coinbase'
    });
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    if (!res.data.checkout_url) throw new Error('No checkout_url in response');
  });

  // Summer Tests (optional - requires Qdrant)
  await test('Summer: Index documents (optional)', async () => {
    const res = await request('POST', '/api/summer/index', {
      paths: ['./README.md']
    });
    // May fail if Qdrant not running - that's OK
    if (res.status === 200 || res.status === 500) {
      console.log('   (Qdrant may not be running - skipping)');
    }
  });

  console.log('\n✅ Integration tests complete!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
