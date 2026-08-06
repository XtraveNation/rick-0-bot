# ❓ DEPLOYMENT FAQ - Frequently Asked Questions

**Quick answers to common beginner questions about deploying RickiA**

---

## 🤔 GENERAL QUESTIONS

### Q: What exactly am I deploying?
**A:** You're deploying a complete AI chat platform with:
- **Frontend**: React web interface (runs in browser at http://your-server:3000)
- **Backend**: Node.js API server (handles requests on port 5000)
- **Database**: Qdrant vector database (for semantic search on port 6333)

All wrapped in Docker containers for easy deployment.

### Q: Do I need to know Docker well?
**A:** No! The automation scripts handle all the Docker complexity. You just need to:
1. Install Docker
2. Run one command (either `bash deploy.sh` or `deploy.bat`)
3. Wait for it to finish
4. Open http://localhost:3000

### Q: How long does deployment take?
**A:** ~10-15 minutes total:
- Docker Compose build: 2-3 minutes
- Container startup: 10-15 seconds
- Health checks: 5-10 seconds

### Q: Do I need coding experience?
**A:** No! If you can:
- Clone a GitHub repo
- Copy/paste into a text editor
- Run shell commands

...you can deploy RickiA.

### Q: What's the minimum server size needed?
**A:** 
- **RAM**: 2 GB minimum, 4 GB recommended
- **Disk**: 5 GB free (Docker images + data)
- **CPU**: Any modern processor (even 1 core works)
- **OS**: Linux, macOS, or Windows with Docker

---

## 💰 API KEYS & COSTS

### Q: How much do API keys cost?
**A:** 
- **OpenAI**: Pay-as-you-go ($0.02-0.20 per 1M tokens)
  - Free: $5 credit included
  - Perfect for testing
- **Coinbase Commerce**: Free (no fees for crypto)
- **Stripe**: Free account, 2.9% + $0.30 per transaction

### Q: Can I use RickiA without API keys?
**A:** Partially:
- **OpenAI key**: ❌ Required (for embeddings/search)
- **Coinbase/Stripe**: ✅ Optional (payments won't work, but chat still works)

### Q: How do I get a free OpenAI key?
**A:** 
1. Go to: https://platform.openai.com/signup
2. Create account (need email + phone)
3. Go to: https://platform.openai.com/api-keys
4. Click "Create new secret key"
5. Copy it immediately (you can't see it again!)
6. Use in backend/.env

**Cost**: First $5 free, then pay-as-you-go (~$0.0001 per token for embeddings)

### Q: What if I run out of OpenAI credits?
**A:** 
- Your API calls will fail
- You'll need to:
  1. Add a payment method to OpenAI account
  2. Wait for new credit
  3. Or switch to Cohere embeddings (also free tier available)

### Q: Can I switch embedding providers?
**A:** Yes! Edit backend/.env:
```
EMBEDDING_PROVIDER=openai    # (default)
EMBEDDING_PROVIDER=cohere    # Alternative
```

Both have free tiers for testing.

---

## 🐳 DOCKER QUESTIONS

### Q: What if Docker isn't installed?
**A:** 
- **Windows/Mac**: Download Docker Desktop
  - https://www.docker.com/products/docker-desktop
  - Run installer, restart computer
- **Linux (Ubuntu/Debian)**:
  ```bash
  sudo apt update
  sudo apt install docker.io docker-compose
  sudo usermod -aG docker $USER
  # Log out and back in
  ```

### Q: "Port 3000 already in use" - what do I do?
**A:** Another app is using port 3000. Options:
1. **Stop that app** (if you own it)
2. **Use a different port** (edit docker-compose.yml)
   ```yaml
   ports:
     - "8080:80"  # Use 8080 instead of 3000
   ```
   Then access at http://localhost:8080

3. **Find what's using port 3000**:
   ```bash
   # macOS/Linux:
   lsof -i :3000
   
   # Windows:
   netstat -ano | findstr :3000
   ```

### Q: How do I know if Docker is working?
**A:** Run:
```bash
docker --version          # Should show version
docker ps                 # Should show running containers
docker run hello-world    # Should print "Hello from Docker!"
```

### Q: What if I get "permission denied" errors?
**A:**
- **Linux**: Add your user to docker group:
  ```bash
  sudo usermod -aG docker $USER
  # Then log out and back in
  ```
- **Mac/Windows**: Docker Desktop should prompt for password

### Q: Can I run Docker without Admin/Root?
**A:** 
- **Linux**: Yes, add to docker group (see above)
- **Mac**: Not needed (Docker Desktop handles it)
- **Windows**: Requires Admin (one-time during install)

---

## 🌐 NETWORKING & ACCESS

### Q: How do I access from another machine?
**A:** Use your server's IP instead of localhost:
```
# On your server, find IP:
ip addr show    # Linux
ipconfig        # Windows
ifconfig        # macOS

# On another machine, use:
http://192.168.x.x:3000   # Replace with your server IP
```

### Q: Can I access from the internet (outside my network)?
**A:** Yes, but requires:
1. Open port 3000 on firewall (🔓 Security risk!)
2. Or use a reverse proxy (nginx/Cloudflare)
3. Or use SSH tunnel:
   ```bash
   ssh -L 3000:localhost:3000 user@server
   # Then access at http://localhost:3000
   ```

### Q: How do I set up a domain name?
**A:** 
1. Register domain (Namecheap, GoDaddy, etc.)
2. Point to your server IP
3. Configure firewall to allow port 80
4. Update docker-compose.yml to use port 80
5. (Optional) Add SSL with Let's Encrypt

### Q: Do I need HTTPS?
**A:** 
- **Local network**: No (HTTP is fine)
- **Internet**: Yes (certificate required)
- **Production**: Highly recommended

For free HTTPS:
```bash
sudo apt install certbot
sudo certbot certonly --standalone -d your-domain.com
```

---

## 📊 DATA & STORAGE

### Q: Where is my data stored?
**A:** Inside Docker volumes:
- **Database**: `/var/lib/docker/volumes/db-data`
- **Search index**: `/var/lib/docker/volumes/qdrant-storage`

### Q: What if I restart Docker?
**A:** Your data persists! Volumes survive container restarts.

### Q: How do I backup my data?
**A:**
```bash
# Backup:
docker-compose exec qdrant tar czf - /qdrant/storage > backup.tar.gz

# Restore (if disaster):
docker-compose down -v
docker-compose up -d
# (Then restore from backup - advanced)
```

### Q: How much storage does it need?
**A:**
- **Base images**: ~2 GB
- **Qdrant database**: Depends on documents (100 MB - 1 GB typical)
- **Logs**: ~100 MB per week (with old logs)

Total: 5-10 GB recommended

### Q: Can I delete old data?
**A:** Yes, but be careful:
```bash
# Remove all Docker data (WARNING: Deletes everything!)
docker-compose down -v

# Remove Docker images only (keeps volumes):
docker-compose down

# Clean up unused data:
docker system prune -a
```

---

## ⚡ PERFORMANCE & MONITORING

### Q: Is it slow?
**A:** Depends on:
- Server hardware (CPU/RAM)
- API response times (OpenAI, Coinbase, Stripe)
- Network latency

First message: 1-3 seconds (includes API call)  
Subsequent messages: <1 second (cached)

### Q: How do I make it faster?
**A:**
1. Use a faster server (more CPU/RAM)
2. Use cheaper embedding provider (Cohere vs OpenAI)
3. Cache results (already built in)
4. Use CDN (advanced)

### Q: How do I monitor performance?
**A:**
```bash
# Real-time stats:
docker stats

# View resource usage:
docker ps --format "table {{.Names}}\t{{.MemUsage}}\t{{.CPUPerc}}"

# Check logs for errors:
docker-compose logs backend | grep -i error
```

### Q: What if containers crash?
**A:** Check logs:
```bash
docker-compose logs backend
docker-compose logs frontend
docker-compose logs qdrant
```

Then restart:
```bash
docker-compose restart
```

---

## 🆘 TROUBLESHOOTING

### Q: "Container exited with code 1"
**A:** Something crashed. Check logs:
```bash
docker-compose logs backend --tail=50
```

Common causes:
- API key missing/wrong
- Port already in use
- Out of memory
- Database connection failed

### Q: "Cannot connect to localhost:3000"
**A:** 
1. Verify containers are running: `docker-compose ps`
2. Verify no firewall blocking: `telnet localhost 3000`
3. Check frontend logs: `docker-compose logs frontend`
4. Restart: `docker-compose restart frontend`

### Q: "Connection to API failed"
**A:**
1. Check backend is running: `docker-compose ps`
2. Test API: `curl http://localhost:5000/api/health`
3. Check logs: `docker-compose logs backend`
4. Verify ports: `netstat -tulpn | grep 5000`

### Q: "Invalid API key"
**A:**
1. Get correct key from provider
2. Edit backend/.env
3. **Exactly** copy-paste key (no extra spaces!)
4. Restart backend: `docker-compose restart backend`
5. Try again

### Q: Build fails with "out of memory"
**A:** 
1. Stop other apps
2. Increase Docker memory (Docker Desktop → Settings → Resources)
3. Or use `--build-arg` to optimize:
   ```bash
   docker-compose build --build-arg NODE_ENV=production
   ```

### Q: "git: command not found"
**A:** Install Git:
- **Ubuntu/Debian**: `sudo apt install git`
- **macOS**: `brew install git` or Xcode Command Line Tools
- **Windows**: https://git-scm.com/download/win

---

## 🔄 UPDATES & MAINTENANCE

### Q: How do I update to the latest version?
**A:**
```bash
git pull origin main          # Get latest code
docker-compose build          # Rebuild images
docker-compose up -d          # Restart with new version
```

### Q: How often should I update?
**A:** 
- **Security fixes**: Immediately
- **New features**: Monthly or as needed
- **Major versions**: When you have time

### Q: Can I roll back to old version?
**A:**
```bash
git log --oneline             # See previous versions
git checkout [commit-hash]    # Go back to that version
docker-compose build
docker-compose up -d
```

### Q: How do I stop it temporarily?
**A:**
```bash
docker-compose down           # Stops containers, keeps data
docker-compose up -d          # Starts again
```

### Q: How do I uninstall completely?
**A:**
```bash
docker-compose down -v        # Stop + delete volumes
docker-compose down           # Stop containers
docker system prune -a        # Remove images

# Then delete the repository folder
cd ..
rm -rf rick-0-bot
```

---

## 💻 OPERATING SYSTEM SPECIFIC

### Q: I'm on Windows - what's different?
**A:**
- Use `deploy.bat` instead of `deploy.sh`
- Or use Windows Subsystem for Linux (WSL) with `deploy.sh`
- PowerShell works, but Bash (via Git Bash or WSL) is easier

### Q: I'm on macOS - any special setup?
**A:** 
- Install Docker Desktop for Mac
- Rest is the same as Linux
- Use `deploy.sh`

### Q: I'm on Linux - which distro?
**A:**
- Ubuntu/Debian/Fedora: All work identically
- Alpine: Supported (lightweight)
- Use `deploy.sh` on all

---

## 🎓 LEARNING & CUSTOMIZATION

### Q: How do I add my own agents?
**A:** See backend/morty/agents/ directory. Example:
```javascript
// Create new agent
class MyAgent {
  async execute(context) {
    // Your logic here
    return { success: true, output: 'result' };
  }
}
```

### Q: Can I use different LLM providers?
**A:** Yes! Edit backend/.env:
```
EMBEDDING_PROVIDER=openai    # or cohere
```

### Q: How do I customize the UI?
**A:** Edit frontend/src/App.jsx and components

### Q: Can I run without Docker?
**A:** Yes, but not recommended for beginners. Requires:
- Node.js 18+
- SQLite3
- Qdrant server
- Manual dependency management

---

## 🆘 GETTING HELP

### Q: Where do I report bugs?
**A:** GitHub Issues: https://github.com/XtraveNation/rick-0-bot/issues

### Q: How do I ask for help?
**A:** Include:
1. What you were trying to do
2. Error message (exact text)
3. Your OS and Docker version
4. Output of `docker-compose ps`
5. Relevant logs: `docker-compose logs backend`

### Q: Is there a Discord community?
**A:** Check GitHub repository for links to community

### Q: Can I contact the developers?
**A:** GitHub discussions or issues on the repository

---

## ✅ VERIFICATION CHECKLIST

If something isn't working, go through this:

```bash
# 1. Docker working?
docker ps

# 2. Containers running?
docker-compose ps

# 3. All containers healthy?
docker-compose ps | grep -i healthy

# 4. Can reach frontend?
curl http://localhost:3000

# 5. Can reach API?
curl http://localhost:5000/api/health

# 6. Check logs?
docker-compose logs

# 7. Restart and try again?
docker-compose restart
```

If all pass ✅, your deployment is working!

---

## 🎉 YOU'RE READY!

If you've read through these FAQs and your deployment is working, **congratulations!** 🎉

You've successfully deployed a production-grade AI platform. 

**Next steps:**
1. Add your OpenAI API key
2. Try sending a message on Rick tab
3. Explore the other agents (Jerry, Morty, Summer)
4. (Optional) Set up payments via Coinbase or Stripe

**Happy deploying! 🚀**

---

*Last updated: May 25, 2026*  
*For latest info, see: https://github.com/XtraveNation/rick-0-bot*
