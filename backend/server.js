// ... existing imports and setup ...

const QdrantService = require('./qdrant-service');
const qdrant = new QdrantService();

// ... existing code ...

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

// ... rest of server.js