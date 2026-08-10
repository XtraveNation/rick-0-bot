const request = require('supertest');
const { createTestDbPath, cleanupTestDb } = require('../../helpers/testDb');

// JERRY_DB_PATH must be set before server.js (and anything that transitively
// calls getDatabase()) is required, since JerryDatabase reads the env var
// only at construction time and getDatabase() caches a singleton per process.
const testDbPath = createTestDbPath('test_morty');

const { app } = require('../../../server');
const morty = require('../../../morty');
const { getDatabase } = require('../../../jerry/db');

let db;

beforeAll(async () => {
  db = getDatabase();
  await db.init();
  await morty.init(db);
});

afterAll(async () => {
  await db.close();
  cleanupTestDb(testDbPath);
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
  const history = await db.getHistory(sessionId, 10);
  expect(history.length).toBeGreaterThan(0);
  const last = history[history.length - 1];
  expect(last.role).toBe('assistant');
});
