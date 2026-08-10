const request = require('supertest');
const { app } = require('../../../server');
const { getDatabase } = require('../../../jerry/db');
const { createTestDbPath, cleanupTestDb } = require('../../helpers/testDb');

describe('GET /api/tokens/leaderboard', () => {
  let db;
  let testDbPath;

  beforeAll(async () => {
    // Set JERRY_DB_PATH before the getDatabase() singleton is first
    // constructed so this file's data lands in an isolated test db.
    testDbPath = createTestDbPath('test_leaderboard');
    db = getDatabase();
    await db.init();
  });

  afterAll(async () => {
    await db.close();
    cleanupTestDb(testDbPath);
  });

  describe('with no messages recorded', () => {
    it('returns an empty leaderboard', async () => {
      const response = await request(app).get('/api/tokens/leaderboard');

      expect(response.statusCode).toBe(200);
      expect(response.body.leaderboard).toEqual([]);
    });

    it('returns zeroed stats when includeStats=true', async () => {
      const response = await request(app)
        .get('/api/tokens/leaderboard')
        .query({ includeStats: 'true' });

      expect(response.statusCode).toBe(200);
      expect(response.body.stats).toEqual({
        total_tokens: 0,
        total_sessions: 0,
        average_tokens_per_session: 0
      });
    });
  });

  describe('with messages recorded across sessions', () => {
    beforeAll(async () => {
      // session-a: 2 messages, 30 + 70 = 100 tokens
      await db.storeMessage('session-a', 'user', 'hi', 30);
      await db.storeMessage('session-a', 'assistant', 'hello', 70);

      // session-b: 1 message, 500 tokens (top of leaderboard)
      await db.storeMessage('session-b', 'user', 'big question', 500);

      // session-c: 3 messages, 10 + 10 + 10 = 30 tokens (bottom)
      await db.storeMessage('session-c', 'user', 'x', 10);
      await db.storeMessage('session-c', 'assistant', 'y', 10);
      await db.storeMessage('session-c', 'user', 'z', 10);
    });

    it('ranks sessions descending by total tokens consumed', async () => {
      const response = await request(app).get('/api/tokens/leaderboard');

      expect(response.statusCode).toBe(200);
      const sessionIds = response.body.leaderboard.map(row => row.session_id);
      expect(sessionIds).toEqual(['session-b', 'session-a', 'session-c']);
    });

    it('returns session_id, total_tokens, and message_count per row', async () => {
      const response = await request(app).get('/api/tokens/leaderboard');

      expect(response.statusCode).toBe(200);
      const sessionA = response.body.leaderboard.find(row => row.session_id === 'session-a');
      expect(sessionA).toEqual({
        session_id: 'session-a',
        total_tokens: 100,
        message_count: 2
      });

      const sessionB = response.body.leaderboard.find(row => row.session_id === 'session-b');
      expect(sessionB).toEqual({
        session_id: 'session-b',
        total_tokens: 500,
        message_count: 1
      });
    });

    it('respects the limit query param', async () => {
      const response = await request(app)
        .get('/api/tokens/leaderboard')
        .query({ limit: 2 });

      expect(response.statusCode).toBe(200);
      expect(response.body.leaderboard.length).toBe(2);
      expect(response.body.leaderboard.map(row => row.session_id)).toEqual(['session-b', 'session-a']);
    });

    it('caps limit at 100 even if a larger value is requested', async () => {
      const response = await request(app)
        .get('/api/tokens/leaderboard')
        .query({ limit: 5000 });

      expect(response.statusCode).toBe(200);
      // Only 3 sessions exist, so this also confirms no error/crash at the cap.
      expect(response.body.leaderboard.length).toBe(3);
    });

    it('defaults to a limit of 10 when none is given', async () => {
      const response = await request(app).get('/api/tokens/leaderboard');

      expect(response.statusCode).toBe(200);
      expect(response.body.leaderboard.length).toBeLessThanOrEqual(10);
    });

    it('falls back to the default limit for an invalid limit value', async () => {
      const response = await request(app)
        .get('/api/tokens/leaderboard')
        .query({ limit: 'not-a-number' });

      expect(response.statusCode).toBe(200);
      expect(response.body.leaderboard.length).toBe(3);
    });

    it('does not include stats unless includeStats=true is passed', async () => {
      const response = await request(app).get('/api/tokens/leaderboard');

      expect(response.statusCode).toBe(200);
      expect(response.body.stats).toBeUndefined();
    });

    it('includes accurate aggregate stats when includeStats=true', async () => {
      const response = await request(app)
        .get('/api/tokens/leaderboard')
        .query({ includeStats: 'true' });

      expect(response.statusCode).toBe(200);
      expect(response.body.stats.total_tokens).toBe(630); // 100 + 500 + 30
      expect(response.body.stats.total_sessions).toBe(3);
      expect(response.body.stats.average_tokens_per_session).toBeCloseTo(210); // 630 / 3
    });

    it('GET /api/tokens/stats returns the same aggregate figures directly', async () => {
      const response = await request(app).get('/api/tokens/stats');

      expect(response.statusCode).toBe(200);
      expect(response.body.total_tokens).toBe(630);
      expect(response.body.total_sessions).toBe(3);
      expect(response.body.average_tokens_per_session).toBeCloseTo(210);
    });
  });
});

describe('GET /api/tokens/stats', () => {
  let db;
  let testDbPath;

  beforeAll(async () => {
    testDbPath = createTestDbPath('test_leaderboard_stats');
    db = new (require('../../../jerry/db').JerryDatabase)();
    await db.init();
  });

  afterAll(async () => {
    await db.close();
    cleanupTestDb(testDbPath);
  });

  it('returns zeroed stats for an empty database', async () => {
    // This describe uses its own JerryDatabase instance directly rather
    // than going through the app/supertest, since the app's getDatabase()
    // singleton is already bound to the leaderboard describe block's db
    // file above (singleton is cached for the process/worker lifetime).
    const stats = await db.getTokenStats();
    expect(stats).toEqual({
      total_tokens: 0,
      total_sessions: 0,
      average_tokens_per_session: 0
    });
  });

  it('computes accurate stats after messages are stored', async () => {
    await db.storeMessage('stats-session-1', 'user', 'a', 40);
    await db.storeMessage('stats-session-1', 'assistant', 'b', 60);
    await db.storeMessage('stats-session-2', 'user', 'c', 100);

    const stats = await db.getTokenStats();
    expect(stats.total_tokens).toBe(200);
    expect(stats.total_sessions).toBe(2);
    expect(stats.average_tokens_per_session).toBe(100);
  });
});
