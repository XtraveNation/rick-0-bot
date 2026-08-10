const path = require('path');
const fs = require('fs');
const util = require('util');
const { JerryDatabase } = require('../../../jerry/db');

describe('Jerry Database Initialization', () => {
  let db;
  let testDbPath;

  beforeEach(() => {
    // Create a test database with unique path
    const testDir = path.join(__dirname, '..', '..', '..', 'data', 'test');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    testDbPath = path.join(testDir, `test-${Date.now()}.db`);
    process.env.JERRY_DB_PATH = testDbPath;
    db = new JerryDatabase();
  });

  afterEach(async () => {
    if (db) {
      await db.close();
    }
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  // Promisified helper so assertion failures inside the sqlite3 callback
  // reject the returned promise instead of throwing across the N-API
  // callback boundary (which crashes the whole Jest worker process).
  function dbAll(sql) {
    return util.promisify(db.db.all).bind(db.db)(sql);
  }

  describe('Schema Creation', () => {
    it('should create messages table', async () => {
      await db.init();

      const rows = await dbAll(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='messages'
      `);
      expect(rows.length).toBe(1);
      expect(rows[0].name).toBe('messages');
    });

    it('should create entities table', async () => {
      await db.init();

      const rows = await dbAll(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='entities'
      `);
      expect(rows.length).toBe(1);
      expect(rows[0].name).toBe('entities');
    });

    it('should create summaries table', async () => {
      await db.init();

      const rows = await dbAll(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='summaries'
      `);
      expect(rows.length).toBe(1);
      expect(rows[0].name).toBe('summaries');
    });

    it('should create indexes for performance', async () => {
      await db.init();

      const rows = await dbAll(`
        SELECT name FROM sqlite_master
        WHERE type='index' AND name LIKE 'idx_%'
      `);
      // 2 for messages, 2 for entities, 2 for summaries
      expect(rows.length).toBeGreaterThanOrEqual(6);
    });

    it('should have correct columns in messages table', async () => {
      await db.init();

      const rows = await dbAll(`PRAGMA table_info(messages)`);
      const columns = rows.map(r => r.name);
      expect(columns).toContain('id');
      expect(columns).toContain('session_id');
      expect(columns).toContain('role');
      expect(columns).toContain('content');
      expect(columns).toContain('tokens_used');
      expect(columns).toContain('created_at');
    });

    it('should have correct columns in entities table', async () => {
      await db.init();

      const rows = await dbAll(`PRAGMA table_info(entities)`);
      const columns = rows.map(r => r.name);
      expect(columns).toContain('id');
      expect(columns).toContain('session_id');
      expect(columns).toContain('entity_type');
      expect(columns).toContain('value');
      expect(columns).toContain('last_seen');
    });

    it('should have correct columns in summaries table', async () => {
      await db.init();

      const rows = await dbAll(`PRAGMA table_info(summaries)`);
      const columns = rows.map(r => r.name);
      expect(columns).toContain('id');
      expect(columns).toContain('session_id');
      expect(columns).toContain('turn_range');
      expect(columns).toContain('summary_text');
      expect(columns).toContain('created_at');
    });

    it('should enforce role check constraint', async () => {
      await db.init();
      const sessionId = 'test-session-1';

      // Valid roles should work
      await expect(db.storeMessage(sessionId, 'user', 'Hello')).resolves.toBeDefined();
      await expect(db.storeMessage(sessionId, 'assistant', 'Hi there')).resolves.toBeDefined();

      // Invalid role should fail
      return new Promise((resolve, reject) => {
        db.storeMessage(sessionId, 'invalid_role', 'test')
          .catch(err => {
            expect(err).toBeDefined();
            resolve();
          });
      });
    });

    it('should allow multiple table creations without error (idempotent)', async () => {
      // First initialization
      await db.init();

      // Second initialization should not fail
      await expect(db.init()).resolves.not.toThrow();
    });
  });

  describe('Data Storage and Retrieval', () => {
    beforeEach(async () => {
      await db.init();
    });

    it('should store messages successfully', async () => {
      const message = await db.storeMessage('session-1', 'user', 'Hello', 10);
      
      expect(message.id).toBeDefined();
      expect(message.session_id).toBe('session-1');
      expect(message.role).toBe('user');
      expect(message.content).toBe('Hello');
      expect(message.tokens_used).toBe(10);
    });

    it('should store entities successfully', async () => {
      const entity = await db.upsertEntity('session-1', 'api_key', 'sk_test_12345');
      
      expect(entity.id).toBeDefined();
      expect(entity.session_id).toBe('session-1');
      expect(entity.entity_type).toBe('api_key');
      expect(entity.value).toBe('sk_test_12345');
    });

    it('should store summaries successfully', async () => {
      const summary = await db.storeSummary('session-1', '1-10', 'Summary of first 10 turns');
      
      expect(summary.id).toBeDefined();
      expect(summary.session_id).toBe('session-1');
      expect(summary.turn_range).toBe('1-10');
      expect(summary.summary_text).toBe('Summary of first 10 turns');
    });

    it('should retrieve history in correct order', async () => {
      await db.storeMessage('session-1', 'user', 'First message', 5);
      await new Promise(resolve => setTimeout(resolve, 10));
      await db.storeMessage('session-1', 'assistant', 'Response', 15);

      const history = await db.getHistory('session-1');
      
      expect(history.length).toBe(2);
      expect(history[0].content).toBe('First message');
      expect(history[1].content).toBe('Response');
    });

    it('should retrieve entities for a session', async () => {
      await db.upsertEntity('session-1', 'api_key', 'key1');
      await db.upsertEntity('session-1', 'file_path', 'path1');

      const entities = await db.getEntities('session-1');
      
      expect(entities.length).toBe(2);
      expect(entities.some(e => e.entity_type === 'api_key')).toBe(true);
      expect(entities.some(e => e.entity_type === 'file_path')).toBe(true);
    });
  });
});
