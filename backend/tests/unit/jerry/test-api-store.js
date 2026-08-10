const request = require('supertest');
const path = require('path');
const fs = require('fs');
const { app } = require('../../../server');
const { getDatabase } = require('../../../jerry/db');

describe('POST /api/jerry/store', () => {
  let db;
  let testDbPath;

  beforeAll(async () => {
    // Use test database. JERRY_DB_PATH must be set before getDatabase() is
    // first called anywhere in this process, since JerryDatabase reads it
    // only at construction time and getDatabase() caches a singleton.
    const testDir = path.join(__dirname, '..', '..', '..', 'data', 'test');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    testDbPath = path.join(testDir, `api-test-${Date.now()}.db`);
    process.env.JERRY_DB_PATH = testDbPath;
    db = getDatabase();
  });

  beforeEach(async () => {
    // Initialize fresh database for each test
    try {
      await db.init();
    } catch (err) {
      // Schema might already exist
    }
  });

  afterAll(async () => {
    try {
      await db.close();
    } catch (err) {
      // Already closed
    }
    if (testDbPath && fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  it('should store a user message successfully', async () => {
    const response = await request(app)
      .post('/api/jerry/store')
      .send({
        session_id: 'test-session-1',
        role: 'user',
        content: 'Hello, assistant!',
        tokens_used: 5
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.message_id).toBeDefined();
    expect(response.body.session_id).toBe('test-session-1');
    expect(response.body.role).toBe('user');
    expect(response.body.entities_extracted).toBeDefined();
    expect(Array.isArray(response.body.entities_extracted)).toBe(true);
  });

  it('should store an assistant message successfully', async () => {
    const response = await request(app)
      .post('/api/jerry/store')
      .send({
        session_id: 'test-session-2',
        role: 'assistant',
        content: 'Hello, user!',
        tokens_used: 8
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.message_id).toBeDefined();
    expect(response.body.role).toBe('assistant');
  });

  it('should extract entities from message content', async () => {
    const response = await request(app)
      .post('/api/jerry/store')
      .send({
        session_id: 'test-session-3',
        role: 'user',
        content: 'Set API_KEY=sk_test_abc123 and check /var/log/app.log',
        tokens_used: 20
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.entities_extracted).toBeDefined();
    expect(Array.isArray(response.body.entities_extracted)).toBe(true);
    
    // Should have extracted entities
    const hasApiKey = response.body.entities_extracted.some(e => e.type === 'api_key');
    const hasFilePath = response.body.entities_extracted.some(e => e.type === 'file_path');
    expect(hasApiKey || hasFilePath).toBe(true);
  });

  it('should handle missing session_id', async () => {
    const response = await request(app)
      .post('/api/jerry/store')
      .send({
        role: 'user',
        content: 'Hello'
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  it('should handle missing role', async () => {
    const response = await request(app)
      .post('/api/jerry/store')
      .send({
        session_id: 'test-session-4',
        content: 'Hello'
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  it('should handle missing content', async () => {
    const response = await request(app)
      .post('/api/jerry/store')
      .send({
        session_id: 'test-session-5',
        role: 'user'
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  it('should reject invalid role', async () => {
    const response = await request(app)
      .post('/api/jerry/store')
      .send({
        session_id: 'test-session-6',
        role: 'invalid',
        content: 'Hello'
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBeDefined();
    expect(response.body.error).toContain('Invalid role');
  });

  it('should use default tokens_used if not provided', async () => {
    const response = await request(app)
      .post('/api/jerry/store')
      .send({
        session_id: 'test-session-7',
        role: 'user',
        content: 'Hello'
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.message_id).toBeDefined();
  });

  it('should handle empty content gracefully', async () => {
    const response = await request(app)
      .post('/api/jerry/store')
      .send({
        session_id: 'test-session-8',
        role: 'user',
        content: ''
      });

    // Should fail validation since empty content is not useful
    expect(response.statusCode).toBe(400);
  });

  it('should handle very long content', async () => {
    const longContent = 'A'.repeat(10000);
    const response = await request(app)
      .post('/api/jerry/store')
      .send({
        session_id: 'test-session-9',
        role: 'user',
        content: longContent,
        tokens_used: 3000
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.message_id).toBeDefined();
  });

  it('should store multiple messages in same session', async () => {
    const sessionId = 'test-session-10';
    
    const msg1 = await request(app)
      .post('/api/jerry/store')
      .send({
        session_id: sessionId,
        role: 'user',
        content: 'First message',
        tokens_used: 5
      });

    const msg2 = await request(app)
      .post('/api/jerry/store')
      .send({
        session_id: sessionId,
        role: 'assistant',
        content: 'Response',
        tokens_used: 10
      });

    expect(msg1.statusCode).toBe(200);
    expect(msg2.statusCode).toBe(200);
    expect(msg1.body.message_id).not.toBe(msg2.body.message_id);
  });
});
