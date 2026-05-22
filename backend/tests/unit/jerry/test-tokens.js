const path = require('path');
const fs = require('fs');
const { JerryDatabase } = require('../../../jerry/db');
const tokens = require('../../../jerry/tokens');

describe('Tokens table and operations', () => {
  let db;
  let testDbPath;

  beforeAll(async () => {
    const testDir = path.join(__dirname, '..', '..', '..', 'data', 'test_tokens');
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });
    testDbPath = path.join(testDir, `test-${Date.now()}.db`);
    process.env.JERRY_DB_PATH = testDbPath;
    db = new JerryDatabase();
    await db.init();
    // ensure tokens table
    await tokens.ensureTokensTable();
  });

  afterAll(async () => {
    await db.close();
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  });

  test('initial balance is zero', async () => {
    const bal = await tokens.getBalance('session-test-1');
    expect(bal).toBe(0);
  });

  test('add tokens increases balance', async () => {
    await tokens.addTokens('session-test-1', 100);
    const bal = await tokens.getBalance('session-test-1');
    expect(bal).toBe(100);
  });

  test('consume tokens decreases balance', async () => {
    const res = await tokens.consumeTokens('session-test-1', 30);
    expect(res.success).toBe(true);
    const bal = await tokens.getBalance('session-test-1');
    expect(bal).toBe(70);
  });

  test('consume tokens fails when insufficient', async () => {
    const res = await tokens.consumeTokens('session-test-1', 1000);
    expect(res.success).toBe(false);
  });
});
