# 🚀 RickiA Deployment Guide for Beginners

**Goal**: Deploy rick-0-bot to your Docker server in 15 minutes  
**Difficulty**: ⭐ Easy  
**Requirements**: Docker + Docker Compose installed on your server

---

## 📋 PREREQUISITES

### On Your Server
- ✅ Docker installed: `docker --version`
- ✅ Docker Compose installed: `docker-compose --version`
- ✅ Git installed: `git --version`
- ✅ At least 2GB free disk space
- ✅ Ports available: 3000 (frontend), 5000 (backend), 6333 (Qdrant)

### API Keys You'll Need (5 minutes to get)
1. **OpenAI API Key** (for embeddings)
   - Go to: https://platform.openai.com/api-keys
   - Click "Create new secret key"
   - Copy it (save somewhere safe)

2. **Coinbase Commerce Key** (for crypto payments - optional but recommended)
   - Go to: https://dashboard.coinbase.com/login
   - Create a merchant account
   - Generate API key
   - Copy it

3. **Stripe Key** (for credit card payments - optional)
   - Go to: https://dashboard.stripe.com
   - Create account
   - Get publishable + secret keys

---

## ⚡ QUICK START (5 STEPS)

### Step 1: Clone the Repository
```bash
cd /home/youruser    # Go to your home directory
git clone https://github.com/XtraveNation/rick-0-bot.git
cd rick-0-bot
ls -la              # You should see: backend/, frontend/, docker-compose.yml
```

### Step 2: Create Configuration Files
```bash
# Copy template files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# See what we need to fill in:
cat backend/.env
cat frontend/.env
```

### Step 3: Fill in Your API Keys
**Use your favorite text editor (nano, vim, or VS Code):**

```bash
nano backend/.env
```

**Find and fill these lines:**
```
OPENAI_API_KEY=sk-xxxxxxxxxxxx          # Your OpenAI API key
COINBASE_API_KEY=xxxxxxxxxxxx           # Your Coinbase key (or leave blank)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx  # Your Stripe key (or leave blank)
STRIPE_PUBLISHABLE_KEY=pk_test_xx       # Your Stripe publishable key
```

**Save file**: Press `Ctrl+O`, then `Enter`, then `Ctrl+X`

Then do the same for frontend:
```bash
nano frontend/.env
```

**Fill these lines:**
```
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_xx  # Same as above (or leave blank)
```

**Save file**: Press `Ctrl+O`, then `Enter`, then `Ctrl+X`

### Step 4: Build and Start
```bash
# This will take 2-3 minutes (building Docker images)
docker-compose build

# Start all services (3 containers)
docker-compose up -d

# Verify everything started
docker-compose ps
```

**You should see:**
```
CONTAINER ID   IMAGE              COMMAND              STATUS
xxx            rick-0-bot-backend  "node server.js"     Up (healthy)
xxx            rick-0-bot-frontend "nginx -g daemon"    Up (healthy)
xxx            qdrant              "qdrant --v=1"       Up (healthy)
```

### Step 5: Access Your App
```bash
# Open in browser on your local machine:
http://<your-server-ip>:3000

# Test the backend API:
curl http://<your-server-ip>:5000/api/health
```

**You should see:** `{"status":"ok"}`

---

## ✅ VERIFICATION CHECKLIST

After startup, verify everything works:

```bash
# 1. Check if all containers are running
docker-compose ps
# Expected: All 3 containers "Up" and "healthy"

# 2. Check backend logs (any errors?)
docker-compose logs backend --tail=20

# 3. Check frontend logs (any errors?)
docker-compose logs frontend --tail=20

# 4. Test API endpoints
curl http://localhost:5000/api/health           # Should return {"status":"ok"}
curl http://localhost:5000/api/morty/agents     # Should return list of agents

# 5. Open browser and test UI
# Visit: http://<your-server-ip>:3000
# Should see 4 tabs: Rick, Jerry, Morty, Summer
```

---

## 🐛 TROUBLESHOOTING

### Problem: "docker-compose: command not found"
**Solution**: Install Docker Compose
```bash
# On Ubuntu/Debian:
sudo apt update
sudo apt install docker-compose

# On Mac:
brew install docker-compose

# Verify:
docker-compose --version
```

### Problem: "Port 3000 already in use"
**Solution**: Change the port in docker-compose.yml
```bash
nano docker-compose.yml
# Find this line:
#   - "3000:80"
# Change to:
#   - "8080:80"   # Now use http://localhost:8080
```

### Problem: "Container exits with error"
**Solution**: Check logs
```bash
docker-compose logs backend    # See backend errors
docker-compose logs frontend   # See frontend errors
docker-compose logs qdrant     # See database errors

# Restart if needed:
docker-compose restart
```

### Problem: "Cannot connect to API"
**Solution**: Verify containers are running
```bash
# Check if backend is running:
docker-compose ps backend
# Should show "Up"

# Check if ports are open:
sudo netstat -tulpn | grep LISTEN
# Should see :3000 and :5000
```

### Problem: "OpenAI API key error"
**Solution**: Verify .env file
```bash
# Check backend .env
cat backend/.env

# Make sure OPENAI_API_KEY is set correctly:
grep OPENAI_API_KEY backend/.env

# Restart containers:
docker-compose restart backend
```

### Problem: "Cannot find image"
**Solution**: Build images first
```bash
docker-compose build --no-cache
docker-compose up -d
```

---

## 📱 USAGE (Once Running)

### Rick Tab - Chat Interface
1. Open http://your-server:3000
2. Type a message
3. Click Send
4. Watch tokens get consumed (5 per message)

### Jerry Tab - Token Marketplace
1. Click "Jerry" tab
2. Select payment provider (Coinbase or Stripe)
3. Choose token package (e.g., 1000 tokens)
4. Complete payment
5. Tokens appear in your balance

### Morty Tab - Agent Executor
1. Click "Morty" tab
2. Select an agent from dropdown
3. Enter task (e.g., "paint red circle")
4. Click Execute
5. Watch agent run

### Summer Tab - Search
1. Click "Summer" tab
2. Index a directory (backend documents)
3. Search semantic queries (e.g., "How do tokens work?")
4. Get relevant results

---

## 🔧 COMMON COMMANDS

### View Running Services
```bash
docker-compose ps                    # See all containers
docker-compose logs backend          # See backend logs
docker-compose logs frontend --tail=50  # Last 50 lines
```

### Stop Everything
```bash
docker-compose down                  # Stop all (data persists)
docker-compose down -v               # Stop + remove volumes (delete data)
```

### Start Again
```bash
docker-compose up -d                 # Start in background
docker-compose logs -f               # Follow logs (Ctrl+C to exit)
```

### Update Code (Git Pull)
```bash
# Get latest version from GitHub:
git pull origin main

# Rebuild containers:
docker-compose build

# Restart:
docker-compose restart
```

### Check Disk Space
```bash
docker ps -a                         # List all containers
docker images                        # List all images
docker system df                     # Total disk usage
docker system prune                  # Clean up unused data
```

---

## 🌐 NETWORK SETUP (For External Access)

### If Your Server Has a Domain
```bash
# Update docker-compose.yml:
nano docker-compose.yml

# Change this line (frontend service):
# ports:
#   - "3000:80"
# To use your domain's port (e.g., 80 for http):
# ports:
#   - "80:80"

# Restart:
docker-compose restart
```

### If You Need HTTPS (SSL Certificate)
This requires a bit more setup. For now, use HTTP. To add HTTPS later:

```bash
# Generate a free certificate (Let's Encrypt):
sudo apt install certbot
sudo certbot certonly --standalone -d your-domain.com

# Update nginx.conf to use certificate
# (This is advanced - skip for now)
```

---

## 📊 MONITORING

### Check Memory Usage
```bash
docker stats          # Real-time resource usage (Ctrl+C to exit)
docker ps --format "table {{.Names}}\t{{.MemUsage}}"
```

### Check Disk Usage
```bash
docker system df
# Output shows total, used, and unused disk space

# Clean up if needed:
docker system prune -a          # Remove unused images
docker volume prune             # Remove unused volumes
```

### View Container Logs
```bash
# Real-time backend logs:
docker-compose logs -f backend

# Real-time all logs:
docker-compose logs -f

# Just frontend errors:
docker-compose logs frontend | grep -i error

# Last 100 lines of backend:
docker-compose logs backend --tail=100
```

---

## 🔐 SECURITY TIPS

### 1. Change Default Ports
```bash
# Don't expose to the internet on default ports
# Update docker-compose.yml to use different ports
nano docker-compose.yml
```

### 2. Use Environment Variables
```bash
# Never put secrets in code
# Always use .env files (which are in .gitignore)
cat backend/.env    # Secret keys here (not on GitHub)
```

### 3. Firewall Configuration
```bash
# On your server, restrict who can access:
sudo ufw allow from 192.168.1.0/24 to any port 3000   # Only local network
sudo ufw allow from 192.168.1.100 to any port 3000    # Only one IP
```

### 4. Regular Updates
```bash
# Keep base images updated:
docker-compose down
docker-compose build --pull
docker-compose up -d
```

---

## 🆘 GETTING HELP

### Check These Files for Documentation
1. **README.md** - Overview and features
2. **PHASE2.md** - Technical architecture
3. **DEPLOYMENT.md** - Advanced operations guide
4. **Integration-test.js** - API endpoint reference

### Test API Endpoints Manually
```bash
# Get all agents:
curl http://localhost:5000/api/morty/agents

# Get token balance (example session):
curl http://localhost:5000/api/tokens/balance/test-session

# Test health check:
curl http://localhost:5000/api/health
```

### Check GitHub Issues
- https://github.com/XtraveNation/rick-0-bot/issues

---

## 📈 SCALING UP LATER

Once you're comfortable, you can:

### Option A: Add More Workers
```bash
# Scale backend to 3 instances:
docker-compose up -d --scale backend=3
```

### Option B: Add a Load Balancer
```bash
# Use nginx, HAProxy, or cloud provider's load balancer
# (Advanced - ask for help if needed)
```

### Option C: Move to Cloud
```bash
# Deploy to Heroku, Railway, AWS, DigitalOcean, etc.
# See DEPLOYMENT.md for specific instructions
```

---

## 🎯 NEXT STEPS AFTER DEPLOYMENT

1. **Send token payment to yourself**
   - Go to Jerry tab
   - Buy 1000 tokens via Coinbase or Stripe
   - See tokens appear in balance

2. **Test a chat with Rick**
   - Go to Rick tab
   - Type "Hello" and send
   - Watch it consume tokens

3. **Run a Morty agent**
   - Go to Morty tab
   - Run PaintAgent to paint something
   - See results in chat

4. **Index and search with Summer**
   - Go to Summer tab
   - Index your backend code
   - Search for "token system"
   - Get relevant code snippets

5. **Monitor and maintain**
   - Check `docker-compose logs` daily
   - Keep Docker images updated
   - Backup your data regularly

---

## ✅ DEPLOYMENT CHECKLIST

- [ ] Docker and Docker Compose installed
- [ ] API keys obtained (at least OpenAI)
- [ ] Repository cloned
- [ ] .env files created and filled
- [ ] `docker-compose build` successful
- [ ] `docker-compose up -d` started all containers
- [ ] All containers show "healthy"
- [ ] Browser access works (http://your-server:3000)
- [ ] `/api/health` returns ok
- [ ] At least one test completed (chat or agent)

**If all checked ✅, your deployment is complete!**

---

## 🎉 YOU'RE DONE!

Your rick-0-bot is now running on your server!

**Summary:**
- **Frontend**: http://your-server:3000
- **Backend API**: http://your-server:5000
- **Database**: Qdrant at localhost:6333 (internal)

**To stop**: `docker-compose down`  
**To start**: `docker-compose up -d`  
**To see logs**: `docker-compose logs -f`

**Questions?** Check DEPLOYMENT.md or GitHub issues.

---

**Happy deploying! 🚀**
