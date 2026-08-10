require('express-async-errors');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env (see backend/.env.example
// and DEPLOYMENT.md for the documented variable set).
dotenv.config({ path: path.join(__dirname, '.env') });

const logger = require('./logger');
const { webhookLimiter, apiLimiter } = require('./rateLimiters');

// Import services
const { getDatabase } = require('./jerry/db');
const tokensService = require('./jerry/tokens');
const { extractEntities, formatExtractedEntities } = require('./jerry/entityExtractor');
const QdrantClient = require('./summer/qdrantClient');
const stripeHandler = require('./stripe/checkoutHandler');
const { PaymentManager, CoinbaseCommerceProvider, StripeProvider } = require('./payments/paymentManager');
const paymentHandler = require('./payments/paymentHandler');
const summerRouter = require('./summer/endpoints');

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize services
// Note: getDatabase() is NOT called eagerly here. JerryDatabase reads
// JERRY_DB_PATH from the environment only once, at construction time, and
// getDatabase() caches a singleton after the first call. Calling it at
// module-require time would bind the singleton to whatever JERRY_DB_PATH
// happens to be set (or not) at require() time - which, in tests, is
// always before test setup code gets a chance to point it at an isolated
// db file. Route handlers below call getDatabase() individually so the
// first real call happens at request time instead.
const qdrant = new QdrantClient(
  process.env.QDRANT_URL || 'http://localhost:6333',
  process.env.EMBEDDING_PROVIDER || 'openai'
);

// Initialize payment manager
const paymentMgr = new PaymentManager();
paymentMgr.register('coinbase', new CoinbaseCommerceProvider(process.env.COINBASE_API_KEY));
paymentMgr.register('stripe', new StripeProvider(process.env.STRIPE_SECRET_KEY));
paymentHandler.setPaymentManager(paymentMgr);

// Rate limiting: stricter limiter on payment webhook routes, general limiter
// on public API routes. Applied before routes are mounted/defined below.
app.use('/api/payments/webhook/coinbase', webhookLimiter);
app.use('/api/payments/webhook/stripe', webhookLimiter);
app.use('/api/payments/create-checkout', apiLimiter);
app.use('/api/jerry', apiLimiter);
app.use('/api/search', apiLimiter);
app.use('/api/upload', apiLimiter);
app.use('/api/morty/execute', apiLimiter);
app.use('/api/tokens', apiLimiter);

// Mount handlers
app.use('/api/stripe', stripeHandler);
app.use('/api/payments', paymentHandler.router);
app.use('/api/summer', summerRouter);

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
    const db = getDatabase();

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
    logger.error('Error storing message:', error);
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
    const messages = await getDatabase().getHistory(session_id, parseInt(limit, 10));
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
    logger.error('Error retrieving history:', error);
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
    const allEntities = await getDatabase().getEntities(session_id);
    
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
    logger.error('Error retrieving entities:', error);
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
    logger.error('Search error:', error);
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
    logger.error('Upload error:', error);
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
    logger.error('Morty list agents error:', err);
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
    logger.error('Morty execute error:', err);
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

// GET balance
app.get('/api/tokens/balance', authenticate, async (req, res) => {
  const { session_id } = req.query;
  if (!session_id) return res.status(400).json({ error: 'Missing session_id' });
  try {
    const balance = await tokensService.getBalance(session_id);
    res.json({ session_id, balance });
  } catch (err) {
    logger.error('Error getting token balance:', err);
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
    logger.error('Error consuming tokens:', err);
    res.status(500).json({ error: 'Failed to consume tokens' });
  }
});

// GET leaderboard - top sessions ranked by total tokens consumed, sourced
// from messages.tokens_used (real per-message usage already recorded by
// /api/jerry/store). Sessions are the only identity we have (no auth/user
// system), so this ranks sessions, not users.
app.get('/api/tokens/leaderboard', authenticate, async (req, res) => {
  const { limit = 10, includeStats } = req.query;
  let parsedLimit = parseInt(limit, 10);
  if (Number.isNaN(parsedLimit) || parsedLimit <= 0) parsedLimit = 10;
  if (parsedLimit > 100) parsedLimit = 100;

  try {
    const db = getDatabase();
    const leaderboard = await db.getTokenLeaderboard(parsedLimit);
    const response = { leaderboard };

    if (includeStats === 'true' || includeStats === '1') {
      response.stats = await db.getTokenStats();
    }

    res.json(response);
  } catch (err) {
    logger.error('Error retrieving token leaderboard:', err);
    res.status(500).json({ error: 'Failed to retrieve leaderboard' });
  }
});

// GET stats - aggregate token usage analytics across all sessions
app.get('/api/tokens/stats', authenticate, async (req, res) => {
  try {
    const stats = await getDatabase().getTokenStats();
    res.json(stats);
  } catch (err) {
    logger.error('Error retrieving token stats:', err);
    res.status(500).json({ error: 'Failed to retrieve stats' });
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
    logger.error('Error adding tokens:', err);
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
  logger.error('Unhandled error:', err);
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
    logger.info('Initializing Jerry database...');
    const db = getDatabase();
    await db.init();
    logger.info('Jerry database initialized');

    // Initialize Morty agent framework
    try {
      await morty.init(db);
      logger.info('Morty agent framework initialized');
    } catch (err) {
      logger.error('Failed to initialize Morty:', err);
    }

    // Start server
    app.listen(PORT, () => {
      logger.info(`✓ RickiA Backend running on port ${PORT}`);
      logger.info(`✓ Jerry persistence layer ready`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  try {
    await getDatabase().close();
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };