const { QdrantClient } = require('qdrant-client');
const { AutoTokenizer, AutoModel } = require('sentence-transformers');
const torch = require('torch');

class QdrantService {
  constructor() {
    this.client = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
      timeout: 60000
    });
    this.tokenizer = AutoTokenizer.from_pretrained('sentence-transformers/all-MiniLM-L6-v2');
    this.model = AutoModel.from_pretrained('sentence-transformers/all-MiniLM-L6-v2');
    this.collectionName = 'ricki-knowledge';
    this.ensureCollection();
  }

  async ensureCollection() {
    try {
      await this.client.getCollection(this.collectionName);
    } catch (e) {
      await this.client.createCollection({
        name: this.collectionName,
        vectors_config: { size: 384, distance: 'cosine' },
        payload_config: ['text', 'metadata']
      });
    }
  }

  async embedText(text) {
    const inputs = this.tokenizer(text, { padding: true, truncation: true, return_tensors: 'pt' });
    const outputs = await this.model(inputs, { output_attentions: false });
    return outputs.last_hidden_state.mean(dim: 1).squeeze().tolist();
  }

  async upsertVector(text, metadata) {
    const vector = await this.embedText(text);
    const payload = { text, metadata };
    await this.client.upsert({
      collection_name: this.collectionName,
      points: [{
        id: Buffer.from(text).toString('hex'), // simple hash
        vector: vector,
        payload: payload
      }]
    });
  }

  async searchVectors(query, limit = 5) {
    const queryVector = await this.embedText(query);
    const results = await this.client.search({
      collection_name: this.collectionName,
      query_vector: queryVector,
      limit: limit
    });
    return results.points.map(point => ({
      text: point.payload.text,
      metadata: point.payload.metadata,
      score: point.score
    }));
  }
}

module.exports = new QdrantService();