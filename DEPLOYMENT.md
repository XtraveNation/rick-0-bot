# Deployment & Operations Guide

## Pre-Deployment Checklist

### Environment & Secrets
- [ ] `.env` file created in `backend/` (use `.env.example` as template)
- [ ] `.env` file created in `frontend/` (use `.env.example` as template)
- [ ] All API keys populated:
  - `OPENAI_API_KEY` or `COHERE_API_KEY` (for embeddings)
  - `COINBASE_API_KEY` (for crypto payments)
  - `STRIPE_SECRET_KEY` (for card payments)
  - `JWT_SECRET` (for authentication)
- [ ] `PAYMENT_PROVIDER` set to preferred provider (default: `coinbase`)
- [ ] `EMBEDDING_PROVIDER` set to preferred service (default: `openai`)
- [ ] `.env` files NOT committed to git (check `.gitignore`)

### Database & Storage
- [ ] SQLite database directory writable: `backend/data/`
- [ ] Qdrant instance running and accessible at `QDRANT_URL`
- [ ] Qdrant persistent storage volume mounted (if using Docker)
- [ ] Automatic backups configured for SQLite

### Dependencies
- [ ] Node.js 20+ installed: `node --version`
- [ ] Docker installed (for Qdrant): `docker --version`
- [ ] All packages installed: `npm ci` (not `npm install`)

### Security
- [ ] SSL/TLS certificates ready (for production)
- [ ] CORS origin configured for frontend domain
- [ ] Rate limiting enabled on API endpoints
- [ ] Webhook signatures verified before processing
- [ ] Error logging configured (Sentry, LogRocket, etc.)

### Testing
- [ ] Unit tests pass: `npm test`
- [ ] E2E tests pass: `npm run test:e2e`
- [ ] Integration test passes: `node backend/integration-test.js`
- [ ] No console errors when running `npm run dev`

---

## Local Startup (Development)

### Step 1: Install Dependencies
```bash
cd backend && npm ci && cd ..
cd frontend && npm ci && cd ..
```

### Step 2: Configure Environment
```bash
# Copy templates
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit and add your API keys
nano backend/.env      # or use your editor
nano frontend/.env
```

### Step 3: Start Services

**Terminal 1 - Qdrant** (if using Summer search):
```bash
docker-compose up -d qdrant
# Verify: curl http://localhost:6333/health
```

**Terminal 2 - Backend**:
```bash
cd backend
npm run dev
# Output: listening on port 5000
```

**Terminal 3 - Frontend**:
```bash
cd frontend
npm run dev
# Output: ready at http://localhost:3000
```

### Step 4: Verify

```bash
# Check backend health
curl http://localhost:5000/api/jerry/history/test-session

# Open frontend
open http://localhost:3000  # macOS
# or xdg-open http://localhost:3000  # Linux
# or start http://localhost:3000  # Windows

# Run integration tests
node backend/integration-test.js
```

---

## Docker Deployment (Production)

### Build Images
```bash
docker-compose build
```

### Start All Services
```bash
docker-compose up -d
# View logs: docker-compose logs -f
```

### Health Checks
```bash
# Backend health
curl http://localhost:5000/api/tokens/balance/test

# Frontend (nginx)
curl http://localhost:3000/

# Qdrant (if enabled)
curl http://localhost:6333/health

# View container status
docker-compose ps
```

### Stop Services
```bash
docker-compose down
# Remove data too: docker-compose down -v
```

---

## Database Management

### SQLite Backup
```bash
# Manual backup
cp backend/data/jerry.db backend/data/jerry.db.backup

# Restore from backup
cp backend/data/jerry.db.backup backend/data/jerry.db
```

### Inspect Database
```bash
sqlite3 backend/data/jerry.db

# List tables
.tables

# Check schema
.schema messages

# Query
SELECT COUNT(*) FROM messages;
.exit
```

---

## Monitoring & Logs

### View Logs (Docker)
```bash
docker-compose logs backend    # Backend only
docker-compose logs frontend   # Frontend only
docker-compose logs qdrant     # Qdrant only
docker-compose logs -f         # All services, follow mode
```

### View Logs (Local)
```bash
# Backend: watch console output (process already running)
# Frontend: watch console output (process already running)

# Or redirect to files
cd backend && npm run dev > backend.log 2>&1 &
cd frontend && npm run dev > frontend.log 2>&1 &
tail -f backend.log
```

### Check Disk Usage
```bash
du -sh backend/data/jerry.db
du -sh qdrant/storage          # If using Docker volume
```

---

## Troubleshooting

### Backend won't start
```bash
# Check if port 5000 is in use
lsof -i :5000

# Kill process if needed
kill -9 <PID>

# Check for missing dependencies
npm ci
npm list

# Test database connection
sqlite3 backend/data/jerry.db "SELECT 1;"
```

### Frontend won't start
```bash
# Check if port 3000 is in use
lsof -i :3000

# Clear cache
rm -rf frontend/.parcel-cache
npm ci
npm run dev
```

### Qdrant connection fails
```bash
# Check if Qdrant is running
docker ps | grep qdrant

# Start Qdrant
docker-compose up -d qdrant

# Check Qdrant health
curl http://localhost:6333/health

# View Qdrant logs
docker-compose logs qdrant
```

### Tests fail
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm ci

# Run tests with verbose output
npm test -- --verbose
npm run test:e2e -- --headed  # See browser
```

### Payments not working
```bash
# Check webhook logs
tail -f backend.log | grep webhook

# Test payment creation
curl -X POST http://localhost:5000/api/payments/create-checkout \
  -H "Content-Type: application/json" \
  -d '{"session_id":"test","amount":9.99,"provider":"coinbase"}'

# Verify API keys are set
echo $COINBASE_API_KEY
echo $STRIPE_SECRET_KEY
```

### Search not working (Summer)
```bash
# Verify Qdrant is running
curl http://localhost:6333/health

# Check if collection exists
curl http://localhost:6333/collections/documents

# Try indexing documents
curl -X POST http://localhost:5000/api/summer/index \
  -H "Content-Type: application/json" \
  -d '{"paths":["./README.md"]}'

# Try search
curl "http://localhost:5000/api/summer/search?q=test"
```

---

## Performance Tuning

### SQLite Optimization
```sql
-- Create indexes for faster queries
CREATE INDEX idx_messages_session ON messages(session_id);
CREATE INDEX idx_entities_session ON entities(session_id);

-- Enable WAL mode (faster writes)
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
```

### Qdrant Optimization
- Increase `vector_cache_size` if memory available
- Use `batch_size: 100` for bulk indexing
- Enable compression for vectors

### Node.js Optimization
```bash
# Increase memory limit
NODE_OPTIONS="--max-old-space-size=2048" npm run dev

# Use clustering (multiple cores)
# Already in server.js if NODE_ENV=production
```

---

## Deployment Platforms

### Heroku
```bash
heroku create rick-0-bot
heroku config:set OPENAI_API_KEY=... COINBASE_API_KEY=...
git push heroku main
```

### Railway
1. Connect GitHub repo to Railway
2. Add environment variables
3. Set build command: `npm ci`
4. Set start command: `npm start`

### Render
1. New Web Service → Connect GitHub repo
2. Runtime: Node
3. Build: `npm ci`
4. Start: `npm start`
5. Add environment variables

### AWS ECS
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
docker build -t rick-0-bot .
docker tag rick-0-bot:latest <account>.dkr.ecr.us-east-1.amazonaws.com/rick-0-bot:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/rick-0-bot:latest
```

---

## Incident Response

### Service Down
1. Check logs: `docker-compose logs -f`
2. Restart service: `docker-compose restart`
3. If still down, check database: `sqlite3 backend/data/jerry.db "SELECT 1;"`
4. Check dependencies: `docker-compose ps`

### High Error Rate
1. Check recent changes: `git log --oneline -10`
2. Revert if needed: `git revert <commit>`
3. Monitor logs: `docker-compose logs -f backend | grep error`
4. Check rate limits: `grep "rate limit" backend.log`

### Database Corruption
1. Stop services: `docker-compose down`
2. Restore backup: `cp backend/data/jerry.db.backup backend/data/jerry.db`
3. Restart: `docker-compose up`

---

## Maintenance Schedule

| Task | Frequency | Command |
|------|-----------|---------|
| Database backup | Daily | `cp backend/data/jerry.db backup/` |
| Dependency updates | Monthly | `npm outdated` then `npm update` |
| Security audit | Monthly | `npm audit` |
| Log cleanup | Weekly | `rm logs/old*.log` |
| Health check | Hourly | `curl http://localhost:5000/health` |

---

## Support & Resources

- **Documentation**: See `README.md`, `PHASE2.md`, backend `README.md` files
- **Issues**: GitHub Issues
- **Logs**: Check `docker-compose logs` or local console output
- **Tests**: Run `npm test` and `npm run test:e2e`
