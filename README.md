# RickiA - Multi-Agent AI Platform

A production-ready AI interface with autonomous agents, semantic search (RAG), and flexible token monetization. Built with Express.js backend, React frontend, SQLite persistence, and Qdrant vector search.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker (for Qdrant)
- Git

### Setup (5 minutes)

```bash
# Clone repo
git clone https://github.com/XtraveNation/rick-0-bot.git
cd rick-0-bot

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Install dependencies
cd backend && npm ci && cd ..
cd frontend && npm ci && cd ..

# Start Qdrant (in separate terminal)
docker-compose up -d qdrant

# Start backend (in separate terminal)
cd backend && npm run dev

# Start frontend (in separate terminal)
cd frontend && npm run dev
```

Open http://localhost:3000 in your browser.

## 📚 Architecture

### Four Core Agents (Rick, Jerry, Morty, Summer)

| Agent | Role | Technology | Features |
|-------|------|-----------|----------|
| **Rick** | Chat Interface | React + MUI | Token budgeting, message history, agent integration |
| **Jerry** | Context & Memory | SQLite | Message persistence, entity extraction, session management |
| **Morty** | Task Automation | Node.js | Agent registry, timeout enforcement, execution orchestration |
| **Summer** | Semantic Search | Qdrant + Embeddings | Document indexing, similarity search, metadata filtering |

## 🎯 Features

### Phase 1: MVP (✅ Complete)
- [x] **Rick Chat UI** - Send messages, track token budget
- [x] **Jerry Persistence** - Store messages in SQLite, extract entities
- [x] **Token System** - Balance tracking, per-message consumption
- [x] **Morty Agents** - Extensible agent framework
- [x] **Jest Scaffolding** - Unit test setup

### Phase 2: Enhancement (✅ Complete)
- [x] **Multi-Provider Payments**
  - Coinbase Commerce for crypto (BTC, ETH, USDC, etc.)
  - Stripe for credit/debit cards
  - Extensible for Razorpay, Gumroad, etc.
- [x] **Qdrant RAG Search**
  - Real HTTP client with OpenAI/Cohere embeddings
  - Document indexing & semantic search
  - Smart file scanning
- [x] **E2E Testing** - Playwright suite
- [x] **Webhook Processing** - Auto-add tokens on payment

### Phase 3: Future
- [ ] User authentication & persistent sessions
- [ ] Web3 wallet integration (MetaMask/Solana)
- [ ] Streaming chat & real-time UX
- [ ] Token leaderboard & analytics

## 🔧 Environment Configuration

### Backend (.env)
```bash
PORT=5000
NODE_ENV=development

# Payment Providers
PAYMENT_PROVIDER=coinbase
COINBASE_API_KEY=your_key
STRIPE_SECRET_KEY=your_key

# Vector Search
QDRANT_URL=http://localhost:6333
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=your_key
COHERE_API_KEY=your_key

# JWT
JWT_SECRET=your_secret
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:5000
BASE_URL=http://localhost:3000
```

## 🧪 Testing

```bash
# Backend unit tests
cd backend && npm test

# Frontend E2E tests
cd frontend && npm run test:e2e

# E2E interactive mode
cd frontend && npx playwright test --ui
```

## 🌐 API Endpoints

### Chat & Context (Jerry)
- `POST /api/jerry/store` - Store messages
- `GET /api/jerry/history/:session_id` - Get history
- `GET /api/jerry/entities/:session_id` - Get entities

### Tasks & Agents (Morty)
- `GET /api/morty/agents` - List agents
- `POST /api/morty/execute` - Execute agent

### Semantic Search (Summer)
- `POST /api/summer/index` - Index documents
- `GET /api/summer/search?q=query` - Search documents

### Token Management
- `GET /api/tokens/balance/:session_id` - Get balance
- `POST /api/tokens/consume` - Deduct tokens
- `POST /api/tokens/add` - Add tokens

### Payments
- `POST /api/payments/create-checkout` - Create session
- `POST /api/payments/webhook/coinbase` - Coinbase webhook
- `POST /api/payments/webhook/stripe` - Stripe webhook

## 📦 Project Structure

```
rick-0-bot/
├── backend/
│   ├── jerry/              # Context persistence
│   ├── morty/              # Task agents
│   ├── summer/             # RAG search
│   ├── payments/           # Multi-provider payments
│   ├── server.js           # Express app
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Router
│   │   ├── RickTab.jsx     # Chat
│   │   ├── JerryTab.jsx    # Marketplace
│   │   ├── MortyTab.jsx    # Agents
│   │   └── SummerTab.jsx   # Search
│   ├── e2e/                # Playwright tests
│   └── package.json
├── .github/
│   └── workflows/ci.yml    # GitHub Actions
├── docker-compose.yml      # Production
└── README.md
```

## 🚀 Deployment

### Docker
```bash
docker-compose up -d
```

### Production Checklist
- [ ] All API keys configured
- [ ] SSL/TLS certificates installed
- [ ] Error logging configured
- [ ] Database backups scheduled
- [ ] Webhook signatures verified

## 🔐 Security

- Never commit `.env` (use `.env.example`)
- Verify webhook signatures
- Rotate API keys quarterly
- Use HTTPS in production

## 📖 Documentation

- **PHASE2.md** - Detailed architecture
- **backend/payments/README.md** - Payment setup
- **backend/summer/README.md** - RAG integration

## 🐛 Troubleshooting

### Cannot find module
```bash
rm -rf node_modules && npm ci
```

### Qdrant connection refused
```bash
docker-compose up -d qdrant
curl http://localhost:6333/health
```

### Port already in use
```bash
# Kill process on port 5000 (backend) or 3000 (frontend)
lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

## 📄 License

MIT
|------|---------|
| Install frontend deps | `cd frontend && npm ci && npm run start` |
| Install backend deps | `cd backend && npm ci && npm run dev` |
| Run backend only | `cd backend && npm run start` |
| Re‑build frontend assets | `cd frontend && npm run build` |
| Lint (optional) | `npm run lint` (add your linter config) |

---

## 🔧 Environment Variables

Create a `.env` file in **backend/** with:

```env
JWT_SECRET=rick_sanchez_secret_jwt_key_2024
PORT=3000
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
TOKEN_FAUCET=1000
```

*Never commit `.env` to Git – it’s listed in `.gitignore`.*

---

## 🎨 Theme & UI

* **Rick’s Chat Tab** – neon‑slime gradient, instant chat with token‑budget warnings.  
* **Morty’s Tab** – one‑click task automation (fetch paint, set up canvas, etc.).  
* **Summer’s Tab** – RAG search bar that queries a simulated knowledge base.  
* **Jerry’s Dashboard** – token budget, wallet connect, “Buy Tokens” button (Stripe mock).  

All UI components live under `frontend/src/` and use **Material‑UI** with a custom `rickTheme`.

---

## 📦 Docker Details

* **`frontend/Dockerfile`** – multi‑stage build (Node → nginx).  
* **`docker-compose.yml`** defines two services:
  * `frontend` → built image from `frontend/Dockerfile`.  
  * `backend` → built from the `backend/` directory (Node).  

Feel free to tweak resources, env vars, or add more services (e.g., a vector‑store container).

---

## 💰 Monetization Sketch

* **Freemium** – free tier shows ads; paid tier removes ads and grants extra token budget.  
* **Token Marketplace** – users can purchase token bundles via Stripe (webhooks handled in `/api/buy-tokens`).  
* **Web3 Gate** – `Jerry` tab includes a **Connect Wallet** button (MetaMask) and a mock “Buy Tokens” flow. Future phases will support NFT‑gated VIP agents.

---

## 📚 Next Steps (Roadmap)

1. **Full RAG integration** – replace simulated search with a real vector store (Qdrant/FAISS).  
2. **Stripe Checkout** – complete payment flow for token purchases.  
3. **NFT/VIP Passes** – gate exclusive agents behind ERC‑721 tokens.  
4. **CI/CD** – GitHub Actions → Docker Hub → Cloud Deploy.  

---

## 🙋‍♂️ Need Help?

Open an issue on GitHub or ping me directly. Happy hacking! 🚀