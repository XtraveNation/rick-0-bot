const AgentRegistry = require('./agentRegistry');
const MortyExecutor = require('./executor');
const PaintAgent = require('./agents/PaintAgent');
const CanvasAgent = require('./agents/CanvasAgent');
const PaletteAgent = require('./agents/PaletteAgent');

const registry = new AgentRegistry();
let executor = null;

async function init(db, options = {}) {
  if (!db) throw new Error('Database instance required to init Morty');

  // Register demo agents
  registry.register('PaintAgent', { description: 'Paint demo' }, new PaintAgent());
  registry.register('CanvasAgent', { description: 'Canvas demo' }, new CanvasAgent());
  registry.register('PaletteAgent', { description: 'Palette demo' }, new PaletteAgent());

  executor = new MortyExecutor(registry, db, options);
}

function listAgents() {
  return registry.list();
}

async function execute(sessionId, agentName, input, timeoutMs) {
  if (!executor) throw new Error('Morty not initialized');
  return executor.execute(sessionId, agentName, input, timeoutMs);
}

module.exports = {
  init,
  listAgents,
  execute,
  _registry: registry
};
