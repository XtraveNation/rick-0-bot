const { getDatabase } = require('../../../jerry/db');
const AgentRegistry = require('../../../morty/agentRegistry');
const executor = require('../../../morty/executor');

describe('Morty Agent Registry and Executor', () => {
  let registry;
  beforeAll(async () => {
    const db = getDatabase();
    await db.init();
    registry = new AgentRegistry();
  });

  test('register and invoke demo agents', async () => {
    // Register dummy agent
    class DummyAgent { async execute(input){ return { success:true, output: input }; } }
    registry.register('dummy', DummyAgent);
    const list = registry.list();
    expect(list).toContain('dummy');

    const result = await registry.invoke('dummy', { msg: 'hi' });
    expect(result.success).toBe(true);
  });
});
