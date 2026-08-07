// Real Qdrant HTTP client with embedding support
const axios = require('axios');
const logger = require('../logger');

class QdrantClient {
  constructor(qdrantUrl = process.env.QDRANT_URL || 'http://localhost:6333', embeddingProvider = 'openai') {
    this.qdrantUrl = qdrantUrl;
    this.embeddingProvider = embeddingProvider;
    this.collectionName = 'documents';
  }

  async embedText(text) {
    if (this.embeddingProvider === 'openai') {
      return this.embedWithOpenAI(text);
    } else if (this.embeddingProvider === 'cohere') {
      return this.embedWithCohere(text);
    }
    throw new Error(`Unknown embedding provider: ${this.embeddingProvider}`);
  }

  async embedWithOpenAI(text) {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/embeddings',
        {
          model: 'text-embedding-ada-002',
          input: text
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data.data[0].embedding;
    } catch (err) {
      logger.error('OpenAI embedding error:', err.message);
      throw err;
    }
  }

  async embedWithCohere(text) {
    try {
      const response = await axios.post(
        'https://api.cohere.ai/v1/embed',
        {
          model: 'embed-english-light-v3.0',
          texts: [text],
          input_type: 'search_document'
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.COHERE_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data.embeddings[0];
    } catch (err) {
      logger.error('Cohere embedding error:', err.message);
      throw err;
    }
  }

  async ensureCollection() {
    try {
      await axios.get(`${this.qdrantUrl}/collections/${this.collectionName}`);
    } catch (err) {
      if (err.response?.status === 404) {
        // Create collection
        await axios.put(
          `${this.qdrantUrl}/collections/${this.collectionName}`,
          {
            vectors: {
              size: 1536, // Ada embedding size
              distance: 'Cosine'
            }
          }
        );
      } else {
        throw err;
      }
    }
  }

  async upsertDocument(docId, docText, metadata = {}) {
    await this.ensureCollection();
    const embedding = await this.embedText(docText);
    
    const response = await axios.put(
      `${this.qdrantUrl}/collections/${this.collectionName}/points?wait=true`,
      {
        points: [{
          id: this.hashString(docId),
          vector: embedding,
          payload: {
            doc_id: docId,
            text: docText.slice(0, 1000), // Store first 1000 chars
            ...metadata
          }
        }]
      }
    );

    return response.data;
  }

  async search(query, limit = 5) {
    await this.ensureCollection();
    const embedding = await this.embedText(query);

    const response = await axios.post(
      `${this.qdrantUrl}/collections/${this.collectionName}/points/search`,
      {
        vector: embedding,
        limit,
        with_payload: true
      }
    );

    return response.data.result.map(hit => ({
      id: hit.payload.doc_id,
      text: hit.payload.text,
      score: hit.score,
      ...hit.payload
    }));
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}

module.exports = QdrantClient;
