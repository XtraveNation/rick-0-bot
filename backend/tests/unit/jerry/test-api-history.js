const request = require('supertest');
const path = require('path');
const fs = require('fs');
const { app } = require('../../../server');
const { getDatabase } = require('../../../jerry/db');

describe('GET /api/jerry/history', () => {
  let db;
  const testSessionId = 'history-test-session';

  beforeAll(async () => {
    db = getDatabase();
    const testDir = path.join(__dirname, '..', '..', '..', 'data', 'test');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    process.env.JERRY_DB_PATH = path.join(testDir, `history-test-${Date.now()}.db`);
  });

  beforeEach(async () => {
    try {
      await db.init();
    } catch (err) {
      // Schema might already exist
    }

    // Store test messages
    await db.storeMessage(testSessionId, 'user', 'First message', 10);
    await new Promise(resolve => setTimeout(resolve, 10));
    await db.storeMessage(testSessionId, 'assistant', 'First response', 20);
    await new Promise(resolve => setTimeout(resolve, 10));
    await db.storeMessage(testSessionId, 'user', 'Second message', 15);
    await new Promise(resolve => setTimeout(resolve, 10));
    await db.storeMessage(testSessionId, 'assistant', 'Second response', 25);
  });

  afterAll(async () => {
    try {
      await db.close();
    } catch (err) {
      // Already closed
    }
  });

  it('should retrieve message history for a session', async () => {
    const response = await request(app)
      .get('/api/jerry/history')
      .query({ session_id: testSessionId });

    expect(response.statusCode).toBe(200);
    expect(response.body.session_id).toBe(testSessionId);
    expect(response.body.total_messages).toBe(4);
    expect(Array.isArray(response.body.messages)).toBe(true);
  });

  it('should return messages in chronological order', async () => {
    const response = await request(app)
      .get('/api/jerry/history')
      .query({ session_id: testSessionId });

    expect(response.statusCode).toBe(200);
    expect(response.body.messages.length).toBeGreaterThan(0);
    
    // Check messages are in order
    for (let i = 1; i < response.body.messages.length; i++) {
      const prevTime = new Date(response.body.messages[i - 1].created_at);
      const currTime = new Date(response.body.messages[i].created_at);
      expect(currTime.getTime()).toBeGreaterThanOrEqual(prevTime.getTime());
    }
  });

  it('should include all message fields', async () => {
    const response = await request(app)
      .get('/api/jerry/history')
      .query({ session_id: testSessionId });

    expect(response.statusCode).toBe(200);
    const message = response.body.messages[0];
    
    expect(message.id).toBeDefined();
    expect(message.role).toBeDefined();
    expect(message.content).toBeDefined();
    expect(message.tokens_used).toBeDefined();
    expect(message.created_at).toBeDefined();
  });

  it('should calculate total tokens correctly', async () => {
    const response = await request(app)
      .get('/api/jerry/history')
      .query({ session_id: testSessionId });

    expect(response.statusCode).toBe(200);
    // 10 + 20 + 15 + 25 = 70
    expect(response.body.total_tokens).toBe(70);
  });

  it('should respect limit parameter', async () => {
    const response = await request(app)
      .get('/api/jerry/history')
      .query({ session_id: testSessionId, limit: 2 });

    expect(response.statusCode).toBe(200);
    expect(response.body.total_messages).toBeLessThanOrEqual(2);
  });

  it('should return last N messages when limit is specified', async () => {
    const response = await request(app)
      .get('/api/jerry/history')
      .query({ session_id: testSessionId, limit: 2 });

    expect(response.statusCode).toBe(200);
    expect(response.body.messages.length).toBe(2);
    
    // Should return the last two messages (in chronological order)
    expect(response.body.messages[0].content).toBe('Second message');
    expect(response.body.messages[1].content).toBe('Second response');
  });

  it('should handle missing session_id parameter', async () => {
    const response = await request(app)
      .get('/api/jerry/history');

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  it('should return empty array for non-existent session', async () => {
    const response = await request(app)
      .get('/api/jerry/history')
      .query({ session_id: 'non-existent-session' });

    expect(response.statusCode).toBe(200);
    expect(response.body.messages.length).toBe(0);
    expect(response.body.total_messages).toBe(0);
  });

  it('should handle various limit values', async () => {
    // Default limit
    const response1 = await request(app)
      .get('/api/jerry/history')
      .query({ session_id: testSessionId });
    expect(response1.statusCode).toBe(200);

    // Large limit
    const response2 = await request(app)
      .get('/api/jerry/history')
      .query({ session_id: testSessionId, limit: 1000 });
    expect(response2.statusCode).toBe(200);
    expect(response2.body.messages.length).toBeLessThanOrEqual(1000);

    // Limit of 1
    const response3 = await request(app)
      .get('/api/jerry/history')
      .query({ session_id: testSessionId, limit: 1 });
    expect(response3.statusCode).toBe(200);
    expect(response3.body.messages.length).toBeLessThanOrEqual(1);
  });

  it('should return correct message content', async () => {
    const response = await request(app)
      .get('/api/jerry/history')
      .query({ session_id: testSessionId });

    expect(response.statusCode).toBe(200);
    const contents = response.body.messages.map(m => m.content);
    
    expect(contents).toContain('First message');
    expect(contents).toContain('First response');
    expect(contents).toContain('Second message');
    expect(contents).toContain('Second response');
  });

  it('should include role information', async () => {
    const response = await request(app)
      .get('/api/jerry/history')
      .query({ session_id: testSessionId });

    expect(response.statusCode).toBe(200);
    const roles = response.body.messages.map(m => m.role);
    
    expect(roles).toContain('user');
    expect(roles).toContain('assistant');
  });
});

describe('GET /api/jerry/entities', () => {
  let db;
  const testSessionId = 'entities-test-session';

  beforeAll(async () => {
    db = getDatabase();
    const testDir = path.join(__dirname, '..', '..', '..', 'data', 'test');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    process.env.JERRY_DB_PATH = path.join(testDir, `entities-test-${Date.now()}.db`);
  });

  beforeEach(async () => {
    try {
      await db.init();
    } catch (err) {
      // Schema might already exist
    }

    // Store test entities
    await db.upsertEntity(testSessionId, 'api_key', 'sk_test_key1');
    await db.upsertEntity(testSessionId, 'api_key', 'sk_test_key2');
    await db.upsertEntity(testSessionId, 'file_path', '/path/to/file.js');
    await db.upsertEntity(testSessionId, 'var_name', 'DATABASE_URL');
  });

  afterAll(async () => {
    try {
      await db.close();
    } catch (err) {
      // Already closed
    }
  });

  it('should retrieve entities for a session', async () => {
    const response = await request(app)
      .get('/api/jerry/entities')
      .query({ session_id: testSessionId });

    expect(response.statusCode).toBe(200);
    expect(response.body.session_id).toBe(testSessionId);
    expect(response.body.total_entities).toBeGreaterThan(0);
    expect(response.body.entities).toBeDefined();
  });

  it('should group entities by type', async () => {
    const response = await request(app)
      .get('/api/jerry/entities')
      .query({ session_id: testSessionId });

    expect(response.statusCode).toBe(200);
    expect(response.body.entities.api_key).toBeDefined();
    expect(response.body.entities.file_path).toBeDefined();
    expect(response.body.entities.var_name).toBeDefined();
  });

  it('should include all entities by type', async () => {
    const response = await request(app)
      .get('/api/jerry/entities')
      .query({ session_id: testSessionId });

    expect(response.statusCode).toBe(200);
    expect(response.body.entities.api_key.length).toBeGreaterThan(0);
    expect(response.body.entities.file_path.length).toBeGreaterThan(0);
    expect(response.body.entities.var_name.length).toBeGreaterThan(0);
  });

  it('should include entity values', async () => {
    const response = await request(app)
      .get('/api/jerry/entities')
      .query({ session_id: testSessionId });

    expect(response.statusCode).toBe(200);
    const apiKeys = response.body.entities.api_key;
    const values = apiKeys.map(k => k.value);
    
    expect(values).toContain('sk_test_key1');
    expect(values).toContain('sk_test_key2');
  });

  it('should include last_seen timestamps', async () => {
    const response = await request(app)
      .get('/api/jerry/entities')
      .query({ session_id: testSessionId });

    expect(response.statusCode).toBe(200);
    const apiKeys = response.body.entities.api_key;
    
    apiKeys.forEach(key => {
      expect(key.last_seen).toBeDefined();
      expect(typeof key.last_seen).toBe('string');
    });
  });

  it('should handle missing session_id parameter', async () => {
    const response = await request(app)
      .get('/api/jerry/entities');

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  it('should return empty entities for non-existent session', async () => {
    const response = await request(app)
      .get('/api/jerry/entities')
      .query({ session_id: 'non-existent-session' });

    expect(response.statusCode).toBe(200);
    expect(response.body.total_entities).toBe(0);
    expect(response.body.entities).toBeDefined();
  });
});
