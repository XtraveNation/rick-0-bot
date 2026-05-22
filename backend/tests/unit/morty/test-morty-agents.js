const request = require('supertest');
const { app } = require('../../../server');
const morty = require('../../../morty');
const { getDatabase } = require('../../../jerry/db');

beforeAll(async () => {
  const db = getDatabase();
  await db.init();
  await morty.init(db);
});

test('GET /api/morty/agents returns demo agents', async () => {
  const res = await request(app).get('/api/morty/agents');
  expect(res.statusCode).toBe(200);
  expect(Array.isArray(res.body.agents)).toBe(true);
  expect(res.body.agents.length).toBeGreaterThanOrEqual(3);
});
