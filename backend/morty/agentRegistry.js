class AgentRegistry {
  constructor() {
    this._agents = new Map();
  }

  register(name, meta, instance) {
    if (!name || !instance) throw new Error('Agent name and instance required');
    this._agents.set(name, { name, meta: meta || {}, instance });
  }

  get(name) {
    return this._agents.get(name);
  }

  list() {
    return Array.from(this._agents.values()).map(({ name, meta }) => ({ name, ...meta }));
  }
}

module.exports = AgentRegistry;
