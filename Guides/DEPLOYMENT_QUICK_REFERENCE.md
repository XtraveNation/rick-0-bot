# ⚡ DEPLOYMENT QUICK REFERENCE (1-Page Cheat Sheet)

## Copy & Paste Commands

### 1️⃣ CLONE & SETUP (90 seconds)
```bash
# Clone repo
git clone https://github.com/XtraveNation/rick-0-bot.git && cd rick-0-bot

# Create config files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit configs (add your OpenAI API key)
nano backend/.env
# Add: OPENAI_API_KEY=sk-your-key-here
# Save: Ctrl+O, Enter, Ctrl+X
```

### 2️⃣ GET API KEY (5 minutes)
1. Go to: https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy it
4. Paste into backend/.env

### 3️⃣ BUILD & DEPLOY (2-3 minutes)
```bash
# Build Docker images
docker-compose build

# Start containers
docker-compose up -d

# Verify healthy
docker-compose ps
# All 3 containers should show "Up (healthy)"
```

### 4️⃣ ACCESS YOUR APP
```bash
# In browser, open:
http://your-server-ip:3000

# Test API:
curl http://your-server-ip:5000/api/health
# Should respond: {"status":"ok"}
```

---

## 🆘 TROUBLESHOOTING FAST

| Problem | Fix |
|---------|-----|
| "docker not found" | `sudo apt install docker.io` |
| "Port 3000 in use" | Edit `docker-compose.yml`, change `3000:80` to `8080:80` |
| "Container not starting" | `docker-compose logs backend` |
| "API key error" | Check `cat backend/.env` has your key |
| "Can't connect" | `docker-compose restart && wait 10s` |
| "Out of disk space" | `docker system prune -a` |

---

## 📊 VERIFY WORKING

```bash
# All containers healthy?
docker-compose ps | grep -i healthy

# Backend responsive?
curl http://localhost:5000/api/health

# Frontend loading?
curl -I http://localhost:3000 | grep 200

# Database ready?
curl http://localhost:6333/health
```

---

## 🛑 STOP / START / RESTART

```bash
docker-compose down          # Stop (data persists)
docker-compose up -d         # Start
docker-compose restart       # Restart
docker-compose logs -f       # Watch logs
```

---

## 📱 WHAT TO TEST FIRST

1. **Go to Rick tab** → Type "hello" → Should consume 5 tokens
2. **Go to Jerry tab** → Buy tokens via Coinbase (if set up)
3. **Go to Morty tab** → Run PaintAgent
4. **Go to Summer tab** → Index and search docs

---

## 🔑 REQUIRED API KEYS

| Key | Free? | Optional? | How to Get |
|-----|-------|-----------|-----------|
| `OPENAI_API_KEY` | ❌ $5 credit | ❌ Required | https://platform.openai.com |
| `COINBASE_API_KEY` | ✅ Yes | ✅ Optional | https://dashboard.coinbase.com |
| `STRIPE_SECRET_KEY` | ✅ Yes | ✅ Optional | https://dashboard.stripe.com |

---

## 📁 YOUR DIRECTORY STRUCTURE

```
rick-0-bot/
├── backend/
│   ├── .env              # ← Add your API keys here
│   ├── server.js         # Main API server
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── .env              # ← Optional, usually empty
│   ├── src/
│   └── Dockerfile
├── docker-compose.yml    # ← Starts all 3 services
└── README.md
```

---

## 🌐 URLS AFTER DEPLOYMENT

```
Frontend: http://your-server-ip:3000
Backend:  http://your-server-ip:5000
Database: http://your-server-ip:6333 (internal only)
```

---

## 💾 BACKUP YOUR DATA

```bash
# Backup database and data:
docker-compose exec qdrant tar czf - /qdrant/storage > backup.tar.gz

# If disaster happens, restore:
docker-compose down -v
docker-compose up -d
# Restore from backup (advanced)
```

---

## 📝 COMMON .ENV ENTRIES

**backend/.env:**
```
OPENAI_API_KEY=sk-xxxxxxxxxxxx
COINBASE_API_KEY=xxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxx
PORT=5000
NODE_ENV=production
```

**frontend/.env:**
```
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_xxxx
```

---

## 🚨 IF SOMETHING BREAKS

```bash
# Step 1: Check logs
docker-compose logs backend --tail=50

# Step 2: Restart
docker-compose restart

# Step 3: Full rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Step 4: Check status
docker-compose ps
```

---

## 📞 NEED HELP?

- See: `DEPLOYMENT_FOR_BEGINNERS.md` (full guide)
- See: `DEPLOYMENT.md` (advanced operations)
- See: `README.md` (overview)
- GitHub: https://github.com/XtraveNation/rick-0-bot/issues

---

**Total time to working deployment: ~10 minutes**
