const { JerryDatabase } = require('../../../jerry/db');
const tokens = require('../../../jerry/tokens');
const { createTestDbPath, cleanupTestDb } = require('../../helpers/testDb');

describe('Tokens table and operations', () => {
  let db;
  let testDbPath;

  beforeAll(async () => {
    testDbPath = createTestDbPath('test_tokens');
    db = new JerryDatabase();
    await db.init();
    // ensure tokens table
    await tokens.ensureTokensTable(db);
  });

  afterAll(async () => {
    await db.close();
    cleanupTestDb(testDbPath);
  });

  test('initial balance is zero', async () => {
    const bal = await tokens.getBalance('session-test-1', db);
    expect(bal).toBe(0);
  });

  test('add tokens increases balance', async () => {
    await tokens.addTokens('session-test-1', 100, db);
    const bal = await tokens.getBalance('session-test-1', db);
    expect(bal).toBe(100);
  });

  test('consume tokens decreases balance', async () => {
    const res = await tokens.consumeTokens('session-test-1', 30, db);
    expect(res.success).toBe(true);
    const bal = await tokens.getBalance('session-test-1', db);
    expect(bal).toBe(70);
  });

  test('consume tokens fails when insufficient', async () => {
    const res = await tokens.consumeTokens('session-test-1', 1000, db);
    expect(res.success).toBe(false);
  });
});
