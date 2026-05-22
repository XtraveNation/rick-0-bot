const request = require('supertest');
const { app } = require('../../../server');
const morty = require('../../../morty');
const { getDatabase } = require('../../../jerry/db');

beforeAll(async () => {
  const db = getDatabase();
  await db.init();
  await morty.init(db);
});

test('POST /api/morty/execute runs an agent and stores output', async () => {
  const sessionId = 'test-session-1';
  const res = await request(app)
    .post('/api/morty/execute')
    .send({ session_id: sessionId, agent: 'PaletteAgent', input: { base: 'primary' } });

  expect(res.statusCode).toBe(200);
  expect(res.body.output).toBeDefined();
  expect(res.body.output.result).toBeDefined();
  expect(Array.isArray(res.body.output.result.colors)).toBe(true);

  // Confirm message stored in Jerry
  const db = getDatabase();
  const history = await db.getHistory(sessionId, 10);
  expect(history.length).toBeGreaterThan(0);
  const last = history[history.length - 1];
  expect(last.role).toBe('assistant');
});
