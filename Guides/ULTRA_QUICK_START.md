# 🚀 RICK-0-BOT DEPLOYMENT - ULTRA QUICK START

**Everything you need on one page**

---

## ⚡ 5-STEP DEPLOYMENT (15 minutes)

### Step 1: Clone & Setup (90 seconds)
```bash
git clone https://github.com/XtraveNation/rick-0-bot.git
cd rick-0-bot
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### Step 2: Add API Key (2 minutes)
```bash
# 1. Get free OpenAI key: https://platform.openai.com/api-keys
# 2. Edit file:
nano backend/.env

# 3. Find this line:
OPENAI_API_KEY=your_openai_api_key_here

# 4. Replace with your actual key:
OPENAI_API_KEY=sk-xxxxxxxxxxxx

# 5. Save: Ctrl+O, Enter, Ctrl+X
```

### Step 3: Deploy (5-10 minutes)
```bash
# EITHER this (automatic):
bash deploy.sh                    # Linux/macOS
deploy.bat                        # Windows

# OR these manual commands:
docker-compose build
docker-compose up -d
```

### Step 4: Wait for Health Checks (30 seconds)
```bash
# Wait ~10 seconds, then check:
docker-compose ps

# You should see 3 "healthy" containers
```

### Step 5: Open Browser (1 minute)
```
Visit: http://localhost:3000
Click: Try sending a message
Enjoy! 🎉
```

---

## 🎯 WHAT YOU GET

```
Frontend    → http://localhost:3000  (Chat UI)
Backend     → http://localhost:5000  (API)
Database    → http://localhost:6333  (Search)
```

---

## ✅ VERIFY WORKING

```bash
# 1. Check containers
docker-compose ps
# Should see: frontend, backend, qdrant (all "Up (healthy)")

# 2. Test API
curl http://localhost:5000/api/health
# Should return: {"status":"ok"}

# 3. Open browser
http://localhost:3000
# Should see chat interface
```

---

## 🆘 IF SOMETHING BREAKS

| Problem | Fix |
|---------|-----|
| "docker not found" | Install Docker Desktop |
| "Port 3000 in use" | Change port in docker-compose.yml |
| "Container exited" | `docker-compose logs backend` |
| "API key error" | Check backend/.env has your key |
| "Can't connect" | Wait 10s, then `docker-compose restart` |

**For more help**: See DEPLOYMENT_FAQ.md

---

## 🛠️ COMMON COMMANDS

```bash
# View status
docker-compose ps

# View logs (live)
docker-compose logs -f

# Restart everything
docker-compose restart

# Stop services
docker-compose down

# Start services
docker-compose up -d

# Remove everything (caution!)
docker-compose down -v
```

---

## 🔑 REQUIRED API KEYS

| Key | Free? | Where |
|-----|-------|-------|
| OpenAI | ✅ $5 credit | https://platform.openai.com |
| Coinbase | ✅ Yes | https://dashboard.coinbase.com |
| Stripe | ✅ Yes | https://dashboard.stripe.com |

---

## 📋 REQUIREMENTS

- ✅ Docker installed
- ✅ 2 GB RAM
- ✅ 5 GB disk space
- ✅ OpenAI API key (get in 2 min)

---

## 🎓 USAGE AFTER DEPLOYMENT

### Rick Tab (Chat)
1. Type a message
2. Click Send
3. Watch tokens consumed (5 per message)

### Jerry Tab (Buy Tokens)
1. Select payment provider
2. Choose token package
3. Complete payment
4. Tokens appear in balance

### Morty Tab (Run Agents)
1. Select agent from dropdown
2. Enter task
3. Click Execute
4. See results

### Summer Tab (Search)
1. Index your documents
2. Ask semantic queries
3. Get relevant snippets back

---

## 📝 .env FILE TEMPLATE

**backend/.env:**
```
PORT=5000
NODE_ENV=production
OPENAI_API_KEY=sk-xxxxxxxxxxxx
COINBASE_API_KEY=xxxxxxxxxxxx  # optional
STRIPE_SECRET_KEY=sk_test_xxxx # optional
QDRANT_URL=http://localhost:6333
```

**frontend/.env:**
```
VITE_API_URL=http://localhost:5000
BASE_URL=http://localhost:3000
```

---

## 🌐 WHAT NEXT?

1. ✅ Deploy (follow 5 steps above)
2. ⚙️ Add your OpenAI API key
3. 🧪 Send a test message
4. 💰 Buy tokens (optional)
5. 🤖 Try other agents
6. 🔍 Search documents (optional)

---

## 📚 NEED HELP?

| Question | Answer In |
|----------|-----------|
| Step-by-step guide | DEPLOYMENT_FOR_BEGINNERS.md |
| Quick commands | DEPLOYMENT_QUICK_REFERENCE.md |
| Common issues | DEPLOYMENT_FAQ.md |
| Getting started | DEPLOYMENT_INDEX.md |
| Pre-checks | PRE_DEPLOYMENT_CHECKLIST.md |

---

## 🚀 DEPLOY NOW!

```bash
bash deploy.sh        # Linux/macOS (automatic)
deploy.bat           # Windows (automatic)
```

Or manually:
```bash
docker-compose build && docker-compose up -d
```

**In 15 minutes your platform will be live!** 🎉

---

## ⚡ TLDR: SUPER QUICK VERSION

```bash
# 1. Clone
git clone https://github.com/XtraveNation/rick-0-bot.git && cd rick-0-bot

# 2. Configure
cp backend/.env.example backend/.env
nano backend/.env    # add your OpenAI key

# 3. Deploy
bash deploy.sh       # (or deploy.bat on Windows)

# 4. Access
# Open: http://localhost:3000
# Done! 🚀
```

---

**Total time: 15 minutes from zero to running! ✅**

For detailed help, see the other documentation files in this folder.
