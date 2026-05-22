// Placeholder Qdrant client wrapper
// Replace with real Qdrant HTTP client when embedding service is available

class QdrantService {
  constructor(options = {}) {
    this.url = process.env.QDRANT_URL || options.url || 'http://localhost:6333';
    this.collection = options.collection || 'rickia';
    if (!process.env.QDRANT_URL) {
      console.warn('Qdrant URL not set; QdrantService will operate in no-op mode');
      this.noop = true;
    }
  }

  async searchVectors(query, topK = 5) {
    if (this.noop) return [];
    // TODO: Implement actual Qdrant query logic using axios or node-fetch
    // For now, return empty array to keep API stable
    return [];
  }

  async upsertVector(text, metadata = {}) {
    if (this.noop) return { success: true, note: 'noop' };
    // TODO: Implement actual upsert logic
    return { success: true };
  }
}

module.exports = QdrantService;
