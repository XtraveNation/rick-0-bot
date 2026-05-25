# Phase 2 Implementation: Crypto Payments & RAG Search

## New Features

### 1. Multi-Provider Payment System
- **Coinbase Commerce**: Native crypto support (BTC, ETH, USDC, etc.)
- **Stripe**: Traditional card payments
- Extensible architecture for Razorpay, Gumroad, and others
- Webhook support for payment confirmation & token dispensing

**Files**:
- `backend/payments/paymentManager.js` - Provider abstraction
- `backend/payments/paymentHandler.js` - Express routes
- `frontend/src/JerryTab.jsx` - Token marketplace UI

### 2. Qdrant RAG Integration
- Real Qdrant HTTP client with embedding support
- **Embedding providers**: OpenAI (text-embedding-ada-002) or Cohere (embed-english-light-v3.0)
- Document indexing: scans repo for .md, .txt, .html, .js, .jsx, .py files
- Semantic search with relevance scoring

**Files**:
- `backend/summer/qdrantClient.js` - Qdrant client
- `backend/summer/endpoints.js` - Search/indexing routes
- `backend/summer/documentIndexer.js` - File scanning & embedding
- `frontend/src/SummerTab.jsx` - Search UI

### 3. E2E Testing (Playwright)
- Chat flow tests (message send, token consumption, Jerry persistence)
- Morty agent execution tests
- Summer search indexing & querying tests
- Payment provider selection & token package tests

**Files**:
- `frontend/e2e/rick-e2e.spec.ts` - All E2E tests
- `frontend/playwright.config.ts` - Playwright configuration

## Setup Instructions

### Prerequisites
```bash
# Install Node 20+
node --version

# Install dependencies
cd backend && npm ci
cd ../frontend && npm ci
```

### Configuration
1. Copy `.env.example` to `.env` in both backend and frontend
2. Add API keys:
   - `OPENAI_API_KEY` or `COHERE_API_KEY` for embeddings
   - `COINBASE_API_KEY` or `STRIPE_SECRET_KEY` for payments
   - `QDRANT_URL` (default: http://localhost:6333)

### Running Locally

**Start Qdrant** (Docker):
```bash
docker-compose up -d qdrant
```

**Start Backend**:
```bash
cd backend
npm run dev  # Runs on http://localhost:5000
```

**Start Frontend**:
```bash
cd frontend
npm run dev  # Runs on http://localhost:3000
```

### Testing

**Run E2E tests**:
```bash
cd frontend
npm run test:e2e
```

**Run unit tests** (backend):
```bash
cd backend
npm test
```

## API Endpoints

### Payments
- `POST /api/payments/create-checkout` - Create payment session
- `POST /api/payments/webhook` - Webhook handler (Stripe/Coinbase)

### Summer (RAG Search)
- `POST /api/summer/index` - Index documents
- `GET /api/summer/search?q=query` - Search indexed documents

### Jerry (History/Entities)
- `POST /api/jerry/store` - Store message & extract entities
- `GET /api/jerry/history/:session_id` - Retrieve session history
- `GET /api/jerry/entities/:session_id` - Get extracted entities

### Morty (Agents)
- `GET /api/morty/agents` - List available agents
- `POST /api/morty/execute` - Execute agent

### Tokens
- `GET /api/tokens/balance/:session_id` - Get token balance
- `POST /api/tokens/consume` - Consume tokens
- `POST /api/tokens/add` - Add tokens

## Environment Variables

### Backend
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| PORT | No | 5000 | Server port |
| PAYMENT_PROVIDER | No | coinbase | Default payment provider |
| QDRANT_URL | No | http://localhost:6333 | Qdrant server URL |
| EMBEDDING_PROVIDER | No | openai | Embedding service |
| OPENAI_API_KEY | For OpenAI embeddings | - | OpenAI API key |
| COHERE_API_KEY | For Cohere embeddings | - | Cohere API key |
| COINBASE_API_KEY | For Coinbase | - | Coinbase API key |
| STRIPE_SECRET_KEY | For Stripe | - | Stripe secret key |

### Frontend
| Variable | Default | Description |
|----------|---------|-------------|
| VITE_API_URL | http://localhost:5000 | Backend API URL |
| BASE_URL | http://localhost:3000 | Frontend base URL (E2E tests) |

## Architecture Overview

```
Rick (Chat UI)
  ├─ Tokens consumed per message
  ├─ Messages stored in Jerry
  └─ Results from Morty agents

Jerry (Context Persistence)
  ├─ SQLite message history
  ├─ Entity extraction (API keys, paths, etc.)
  └─ Session summaries

Morty (Task Agents)
  ├─ Agent registry & execution
  ├─ Timeout enforcement (30s)
  └─ Result persistence to Jerry

Summer (RAG Search)
  ├─ Qdrant vector store
  ├─ Document indexing (repo scan)
  └─ Semantic search with embeddings

Token System
  ├─ SQLite persistence
  ├─ Per-message consumption (5 tokens)
  └─ Purchase via crypto/cards

Payment System
  ├─ Coinbase Commerce (crypto)
  ├─ Stripe (cards)
  └─ Webhook handlers for token dispensing
```

## Future Enhancements

1. **Real Webhook Processing**: Process payment confirmations and add tokens automatically
2. **Custom Token Pricing**: Different token costs for different operations
3. **Token Leaderboard**: Track token usage per session
4. **Advanced RAG**: Chunk documents, metadata filtering, reranking
5. **Web3 Wallet Integration**: Direct MetaMask/Solana wallet payments
6. **Persistent Sessions**: User authentication & session management
7. **Streaming Chat**: Real-time message streaming for faster UX
8. **GPU-accelerated Embeddings**: Local embedding inference for privacy

## Deployment

See `docker-compose.yml` for multi-container orchestration.

**Production checklist**:
- [ ] All API keys configured
- [ ] Qdrant persistent storage
- [ ] SSL/TLS certificates
- [ ] Rate limiting enabled
- [ ] Webhook signatures verified
- [ ] Error logging configured
