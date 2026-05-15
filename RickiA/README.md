# RickiA Prototype – Multi‑Agent AI Platform

**Demo URL**: *(local dev)* `http://localhost:3000`  
**Repo**: `https://github.com/XtraveNation/rick-0-bot`

---

## 📁 Folder Structure

```
RickiA/
├─ frontend/               # React source (src/)
├─ backend/                # Express API (server.js)
├─ Dockerfile              # Frontend build & nginx container
├─ docker-compose.yml      # Spins up frontend + backend
├─ .env                    # JWT secret, PORT, Stripe keys, etc.
└─ README.md               # 👈 This file
```

---

## 🚀 Quick Start (Docker)

1. **Clone & CD**

```bash
git clone https://github.com/XtraveNation/rick-0-bot.git
cd AI/Projects/RickiA
```

2. **Build & Run**

```bash
docker compose up --build
```

* Frontend: http://localhost:3000 (served by Nginx)  
* Backend API: http://localhost:5000  

3. **Stop**

```bash
docker compose down
```

---

## 🛠️ Development Workflow

| Task | Command |
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