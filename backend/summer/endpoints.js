const express = require('express');
const router = express.Router();
const QdrantClient = require('./qdrantClient');
const documentIndexer = require('./documentIndexer');
const logger = require('../logger');

const qdrant = new QdrantClient(
  process.env.QDRANT_URL || 'http://localhost:6333',
  process.env.EMBEDDING_PROVIDER || 'openai'
);

// Index documents
router.post('/index', async (req, res) => {
  const { paths } = req.body || {};
  try {
    const summary = await documentIndexer.indexPaths(paths, qdrant);
    res.json({ success: true, summary });
  } catch (err) {
    logger.error('Indexing error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Search documents
router.get('/search', async (req, res) => {
  const { q, limit } = req.query;
  if (!q) return res.status(400).json({ error: 'Missing query parameter' });

  try {
    const results = await qdrant.search(q, parseInt(limit) || 5);
    res.json({ success: true, results });
  } catch (err) {
    logger.error('Search error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
