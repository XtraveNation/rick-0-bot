const { getDatabase } = require('../../../jerry/db');
const AgentRegistry = require('../../../morty/agentRegistry');
const MortyExecutor = require('../../../morty/executor');
const { createTestDbPath, cleanupTestDb } = require('../../helpers/testDb');

describe('Morty Agent Registry and Executor', () => {
  let registry;
  let db;
  let testDbPath;

  beforeAll(async () => {
    testDbPath = createTestDbPath('test_morty');
    db = getDatabase();
    await db.init();
    registry = new AgentRegistry();
  });

  afterAll(async () => {
    await db.close();
    cleanupTestDb(testDbPath);
  });

  test('register and invoke demo agents', async () => {
    // Register dummy agent. AgentRegistry.register(name, meta, instance)
    // requires an actual instance (not the class itself), and executor
    // calls agent.execute({ input, sessionId, db }).
    class DummyAgent {
      async execute({ input }) {
        return { success: true, output: input };
      }
    }
    registry.register('dummy', {}, new DummyAgent());

    const list = registry.list();
    expect(list.some(a => a.name === 'dummy')).toBe(true);

    const executor = new MortyExecutor(registry, db);
    const result = await executor.execute('test-session-registry', 'dummy', { msg: 'hi' });
    expect(result.success).toBe(true);
    expect(result.output).toEqual({ msg: 'hi' });
  });
});
