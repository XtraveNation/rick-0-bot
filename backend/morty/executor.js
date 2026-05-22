const { promisify } = require('util');

class MortyExecutor {
  constructor(registry, db, options = {}) {
    this.registry = registry;
    this.db = db;
    this.timeoutMs = options.timeoutMs || 5000;
  }

  async execute(sessionId, agentName, input, timeoutMs) {
    if (!sessionId || !agentName) throw new Error('sessionId and agentName required');

    const entry = this.registry.get(agentName);
    if (!entry) throw new Error(`Agent not found: ${agentName}`);

    const agent = entry.instance;

    // Enforce timeout
    const t = timeoutMs || this.timeoutMs;
    const agentPromise = (async () => {
      console.log(`Morty: executing agent ${agentName} for session ${sessionId}`);
      const out = await agent.execute({ input, sessionId, db: this.db });
      console.log(`Morty: agent ${agentName} completed for session ${sessionId}`);
      return out;
    })();

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Agent execution timed out')), t);
    });

    let result;
    try {
      result = await Promise.race([agentPromise, timeoutPromise]);
    } catch (err) {
      console.error('Morty execution error:', err.message || err);
      throw err;
    }

    // Persist agent output to Jerry
    try {
      const content = JSON.stringify({ agent: agentName, output: result });
      await this.db.storeMessage(sessionId, 'assistant', content, 0);
      await this.db.upsertEntity(sessionId, 'morty_agent', agentName);
      // store a truncated output entity for quick reference
      const outVal = (typeof result === 'object') ? JSON.stringify(result).substring(0, 200) : String(result);
      await this.db.upsertEntity(sessionId, 'morty_output', outVal);
    } catch (err) {
      console.error('Morty persistence error:', err.message || err);
    }

    return result;
  }
}

module.exports = MortyExecutor;
