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

test('GET /api/morty/agents returns demo agents', async () => {
  const res = await request(app).get('/api/morty/agents');
  expect(res.statusCode).toBe(200);
  expect(Array.isArray(res.body.agents)).toBe(true);
  expect(res.body.agents.length).toBeGreaterThanOrEqual(3);
});
