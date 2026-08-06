# ✅ PRE-DEPLOYMENT CHECKLIST FOR BEGINNERS

**Use this checklist before deploying to ensure you have everything ready.**

---

## 🔧 SYSTEM REQUIREMENTS

- [ ] Docker installed (`docker --version` returns version)
- [ ] Docker Compose installed (`docker-compose --version` returns version)
- [ ] Git installed (`git --version` returns version)
- [ ] At least 2 GB free disk space (`df -h` shows available space)
- [ ] Ports 3000, 5000, 6333 are available (no other apps using them)
- [ ] 30+ GB recommended for production deployments
- [ ] Docker daemon is running (`docker ps` works without errors)

---

## 📦 REPOSITORY SETUP

- [ ] Repository cloned: `git clone https://github.com/XtraveNation/rick-0-bot.git`
- [ ] Changed to repo directory: `cd rick-0-bot`
- [ ] Verified structure:
  - [ ] `backend/` directory exists
  - [ ] `frontend/` directory exists
  - [ ] `docker-compose.yml` exists
  - [ ] `docker-compose.override.yml` exists
- [ ] Run: `ls -la` to verify

---

## 🔑 API KEYS (REQUIRED)

### OpenAI API Key (Required for embeddings)
- [ ] Have an OpenAI account (https://openai.com)
- [ ] Have API credits ($5+ recommended)
- [ ] Got API key from: https://platform.openai.com/api-keys
- [ ] Key format: `sk-xxxxxxxxxxxxxxxx` (starts with `sk-`)
- [ ] Key is safely stored (not shared, not in GitHub)

### Payment Provider Keys (Optional but recommended)

#### Coinbase Commerce (Crypto payments)
- [ ] Have a Coinbase account (https://coinbase.com)
- [ ] Activated Commerce API
- [ ] Got API key from: https://dashboard.coinbase.com
- [ ] Key is ready to paste into .env

#### Stripe (Credit card payments)
- [ ] Have a Stripe account (https://stripe.com)
- [ ] Got publishable key: `pk_test_xxxxx`
- [ ] Got secret key: `sk_test_xxxxx`
- [ ] Both keys are ready to paste into .env

---

## ⚙️ CONFIGURATION FILES

- [ ] Created `backend/.env` from `backend/.env.example`
  ```bash
  cp backend/.env.example backend/.env
  ```

- [ ] Created `frontend/.env` from `frontend/.env.example`
  ```bash
  cp frontend/.env.example frontend/.env
  ```

- [ ] Edited `backend/.env` and filled:
  - [ ] `OPENAI_API_KEY=sk-xxxxxxxxxxxx`
  - [ ] `COINBASE_API_KEY=xxxxx` (if using Coinbase)
  - [ ] `STRIPE_SECRET_KEY=sk_test_xxxx` (if using Stripe)
  - [ ] Other fields can stay as defaults

- [ ] Edited `frontend/.env` and verified:
  - [ ] `VITE_API_URL=http://localhost:5000` (or your server IP)
  - [ ] Other fields can stay as defaults

- [ ] Verified no secrets in `.env` files match any public repos
- [ ] Confirmed `.gitignore` includes `.env` (don't commit secrets!)

---

## 🐳 DOCKER VERIFICATION (Before Building)

- [ ] Verified Docker can reach the internet:
  ```bash
  docker pull hello-world
  docker run hello-world
  ```

- [ ] Docker daemon is responsive:
  ```bash
  docker ps
  ```

- [ ] No stuck Docker processes:
  ```bash
  docker-compose down  # Clean slate
  ```

---

## 🔨 BUILD & DEPLOYMENT

### Building
- [ ] Ran build command:
  ```bash
  docker-compose build
  ```
- [ ] Build completed without errors
- [ ] All 3 images built (backend, frontend, qdrant)

### Starting Services
- [ ] Ran start command:
  ```bash
  docker-compose up -d
  ```
- [ ] All 3 containers started

### Health Check
- [ ] Waited 10-15 seconds for services to become healthy
- [ ] Ran status check:
  ```bash
  docker-compose ps
  ```
- [ ] All 3 containers show "Up (healthy)"
- [ ] No containers in "Restarting" state

---

## ✅ VERIFICATION TESTS

### Frontend
- [ ] Browser opens to `http://localhost:3000`
- [ ] See 4 tabs: Rick, Jerry, Morty, Summer
- [ ] Page loads without JavaScript errors (check browser console)

### Backend API
- [ ] API health check works:
  ```bash
  curl http://localhost:5000/api/health
  ```
- [ ] Response: `{"status":"ok"}`

- [ ] Get agents endpoint works:
  ```bash
  curl http://localhost:5000/api/morty/agents
  ```
- [ ] Response includes list of agents

### Database
- [ ] Qdrant database is accessible:
  ```bash
  curl http://localhost:6333/health
  ```
- [ ] Response indicates database is healthy

---

## 🧪 FUNCTIONAL TESTS

- [ ] Sent a test message on Rick tab
  - [ ] Message appeared in chat
  - [ ] Tokens consumed (5 tokens)
  - [ ] No errors in backend logs

- [ ] Attempted to view available agents on Morty tab
  - [ ] Agent list displays
  - [ ] Can select an agent

- [ ] Viewed available search options on Summer tab
  - [ ] Tab loads without errors

- [ ] (Optional) Attempted token purchase on Jerry tab
  - [ ] Can see payment providers (if keys configured)

---

## 🚀 PRODUCTION-SPECIFIC CHECKS

### If Deploying to Production Server

- [ ] Server has static IP address or domain name
- [ ] Firewall allows ports 3000, 5000 (adjust if needed)
- [ ] Have backup strategy planned:
  ```bash
  docker-compose exec qdrant tar czf - /qdrant/storage > backup.tar.gz
  ```
- [ ] Have monitoring/alerting set up (optional)
- [ ] Have restart script if needed:
  ```bash
  docker-compose up -d
  ```

---

## 📋 TROUBLESHOOTING PREVENTION

- [ ] Checked disk space (`df -h`)
  - [ ] At least 500 MB free after Docker images
- [ ] Verified port conflicts:
  ```bash
  netstat -tulpn | grep -E "3000|5000|6333"
  ```
- [ ] Verified Docker can reach internet (for API calls)
- [ ] Set up log rotation if needed
- [ ] Planned for storage cleanup if running 24/7

---

## 📝 DOCUMENTATION & RECOVERY

- [ ] Saved API keys in secure location (password manager)
- [ ] Downloaded/printed deployment guides:
  - [ ] DEPLOYMENT_FOR_BEGINNERS.md
  - [ ] DEPLOYMENT_QUICK_REFERENCE.md
  - [ ] This checklist
- [ ] Have recovery plan if container dies
- [ ] Have plan to update (git pull + rebuild)

---

## 🎯 PRE-LAUNCH SIGN-OFF

- [ ] All checks above completed ✅
- [ ] System is running and tested ✅
- [ ] Ready for users ✅
- [ ] Have monitoring in place ✅
- [ ] Have backup plan ✅

**Status**: Ready for Production ✅

---

## 📞 IF SOMETHING GOES WRONG

**Immediate troubleshooting:**
```bash
# Check status
docker-compose ps

# View logs
docker-compose logs backend --tail=50

# Restart everything
docker-compose restart

# Full rebuild if needed
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

**Get help:**
- DEPLOYMENT_FOR_BEGINNERS.md (troubleshooting section)
- DEPLOYMENT_QUICK_REFERENCE.md (common commands)
- GitHub Issues: https://github.com/XtraveNation/rick-0-bot/issues

---

## ✨ DEPLOYMENT COMPLETE!

Once you've checked all boxes above, your RickiA deployment is ready! 🎉

- Frontend: http://your-server:3000
- Backend: http://your-server:5000
- Database: Qdrant at localhost:6333 (internal)

**Monitor with:** `docker-compose logs -f`  
**Stop with:** `docker-compose down`  
**Restart with:** `docker-compose up -d`
