require('express-async-errors');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'gateway', '.env') });

// Import services
const { getDatabase } = require('./jerry/db');
const { extractEntities, formatExtractedEntities } = require('./jerry/entityExtractor');
const QdrantService = require('./qdrant-service');
const stripeHandler = require('./stripe/checkoutHandler');

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize services
const db = getDatabase();
const qdrant = new QdrantService();

// Mount Stripe handler (placeholder)
app.use('/api/stripe', stripeHandler);

const morty = require('./morty');

// Placeholder authentication middleware
const authenticate = (req, res, next) => {
  // TODO: Implement actual authentication
  next();
};

// ============================================================================
// JERRY ENDPOINTS - Context Persistence Layer
// ============================================================================

/**
 * POST /api/jerry/store
 * Store a message and extract entities
 * Body: { session_id, role, content, tokens_used }
 * Response: { message_id, entities_extracted: [...] }
 */
app.post('/api/jerry/store', authenticate, async (req, res) => {
  const { session_id, role, content, tokens_used } = req.body;

  if (!session_id || !role || !content) {
    return res.status(400).json({
      error: 'Missing required fields: session_id, role, content'
    });
  }

  if (!['user', 'assistant'].includes(role)) {
    return res.status(400).json({
      error: 'Invalid role. Must be "user" or "assistant"'
    });
  }

  try {
    // Store message
    const message = await db.storeMessage(
      session_id,
      role,
      content,
      tokens_used || 0
    );

    // Extract entities
    const entities = extractEntities(content);
    const formattedEntities = formatExtractedEntities(entities);
    const extractedEntities = [];

    // Store entities
    for (const entity of formattedEntities) {
      const stored = await db.upsertEntity(session_id, entity.type, entity.value);
      extractedEntities.push(stored);
    }

    res.json({
      message_id: message.id,
      session_id: message.session_id,
      role: message.role,
      entities_extracted: extractedEntities.map(e => ({
        id: e.id,
        type: e.entity_type,
        value: e.value
      }))
    });
  } catch (error) {
    console.error('Error storing message:', error);
    res.status(500).json({ error: 'Failed to store message' });
  }
});

/**
 * GET /api/jerry/history?session_id=X&limit=50
 * Retrieve message history for a session
 * Returns: { messages: [...], total_tokens: N, session_id: X }
 */
app.get('/api/jerry/history', authenticate, async (req, res) => {
  const { session_id, limit = 50 } = req.query;

  if (!session_id) {
    return res.status(400).json({
      error: 'Missing required query parameter: session_id'
    });
  }

  try {
    const messages = await db.getHistory(session_id, parseInt(limit, 10));
    const totalTokens = messages.reduce((sum, msg) => sum + (msg.tokens_used || 0), 0);

    res.json({
      session_id,
      total_messages: messages.length,
      total_tokens: totalTokens,
      messages: messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        tokens_used: msg.tokens_used,
        created_at: msg.created_at
      }))
    });
  } catch (error) {
    console.error('Error retrieving history:', error);
    res.status(500).json({ error: 'Failed to retrieve history' });
  }
});

/**
 * GET /api/jerry/entities?session_id=X
 * Retrieve current entity state for a session
 * Returns: { session_id: X, entities: { api_key: [...], file_path: [...], ... } }
 */
app.get('/api/jerry/entities', authenticate, async (req, res) => {
  const { session_id } = req.query;

  if (!session_id) {
    return res.status(400).json({
      error: 'Missing required query parameter: session_id'
    });
  }

  try {
    const allEntities = await db.getEntities(session_id);
    
    // Group entities by type
    const groupedEntities = {};
    allEntities.forEach(entity => {
      if (!groupedEntities[entity.entity_type]) {
        groupedEntities[entity.entity_type] = [];
      }
      groupedEntities[entity.entity_type].push({
        id: entity.id,
        value: entity.value,
        last_seen: entity.last_seen
      });
    });

    res.json({
      session_id,
      total_entities: allEntities.length,
      entities: groupedEntities
    });
  } catch (error) {
    console.error('Error retrieving entities:', error);
    res.status(500).json({ error: 'Failed to retrieve entities' });
  }
});

// ============================================================================
// EXISTING ENDPOINTS
// ============================================================================

app.post('/api/search', authenticate, async (req, res) => {
  const { query, metadata } = req.body;
  if (!query) return res.status(400).json({ error: 'Missing query' });

  try {
    const results = await qdrant.searchVectors(query, 5);
    res.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

app.post('/api/upload', authenticate, async (req, res) => {
  const { text, metadata } = req.body;
  if (!text) return res.status(400).json({ error: 'No text provided' });

  try {
    await qdrant.upsertVector(text, metadata);
    res.json({ success: true, message: 'Document added to knowledge base' });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to add document' });
  }
});

// ============================================================================
// MORTY AGENT ENDPOINTS
// ============================================================================

// List available agents
app.get('/api/morty/agents', authenticate, async (req, res) => {
  try {
    const agents = morty.listAgents();
    res.json({ agents });
  } catch (err) {
    console.error('Morty list agents error:', err);
    res.status(500).json({ error: 'Failed to list agents' });
  }
});

// Execute an agent: { session_id, agent, input, timeout_ms }
app.post('/api/morty/execute', authenticate, async (req, res) => {
  const { session_id, agent, input, timeout_ms } = req.body;
  if (!session_id || !agent) return res.status(400).json({ error: 'Missing session_id or agent' });

  try {
    const output = await morty.execute(session_id, agent, input || {}, timeout_ms);
    res.json({ success: true, output });
  } catch (err) {
    console.error('Morty execute error:', err);
    if (err.message && err.message.includes('timed out')) {
      res.status(504).json({ error: 'Agent execution timed out' });
    } else if (err.message && err.message.includes('not found')) {
      res.status(404).json({ error: err.message });
    } else {
      res.status(500).json({ error: 'Agent execution failed' });
    }
  }
});

// ============================================================================
// TOKENS ENDPOINTS
// ============================================================================

const tokensService = require('./jerry/tokens');

// Ensure tokens table exists on startup
tokensService.ensureTokensTable().catch(err => console.warn('Tokens table init failed:', err));

// GET balance
app.get('/api/tokens/balance', authenticate, async (req, res) => {
  const { session_id } = req.query;
  if (!session_id) return res.status(400).json({ error: 'Missing session_id' });
  try {
    const balance = await tokensService.getBalance(session_id);
    res.json({ session_id, balance });
  } catch (err) {
    console.error('Error getting token balance:', err);
    res.status(500).json({ error: 'Failed to get balance' });
  }
});

// POST consume tokens
app.post('/api/tokens/consume', authenticate, async (req, res) => {
  const { session_id, amount } = req.body;
  if (!session_id || !amount) return res.status(400).json({ error: 'Missing session_id or amount' });
  try {
    const result = await tokensService.consumeTokens(session_id, parseInt(amount, 10));
    if (!result.success) return res.status(402).json({ success: false, balance: result.balance, message: result.message });
    res.json({ success: true, balance: result.balance });
  } catch (err) {
    console.error('Error consuming tokens:', err);
    res.status(500).json({ error: 'Failed to consume tokens' });
  }
});

// POST add tokens (admin or webhook)
app.post('/api/tokens/add', authenticate, async (req, res) => {
  const { session_id, amount } = req.body;
  if (!session_id || !amount) return res.status(400).json({ error: 'Missing session_id or amount' });
  try {
    const balance = await tokensService.addTokens(session_id, parseInt(amount, 10));
    res.json({ success: true, balance });
  } catch (err) {
    console.error('Error adding tokens:', err);
    res.status(500).json({ error: 'Failed to add tokens' });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'RickiA Backend' });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ============================================================================
// SERVER INITIALIZATION
// ============================================================================

async function startServer() {
  try {
    // Initialize Jerry database
    console.log('Initializing Jerry database...');
    await db.init();
    console.log('Jerry database initialized');

    // Initialize Morty agent framework
    try {
      await morty.init(db);
      console.log('Morty agent framework initialized');
    } catch (err) {
      console.error('Failed to initialize Morty:', err);
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`✓ RickiA Backend running on port ${PORT}`);
      console.log(`✓ Jerry persistence layer ready`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  try {
    await db.close();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };