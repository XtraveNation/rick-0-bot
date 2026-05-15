require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQLite DB
const db = new sqlite3.Database('./data/rickai.db', (err) => {
  if (err) {
    console.error('Failed to open DB:', err);
    process.exit(1);
  }
});

// Create tables if they don't exist
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    token_limit INTEGER DEFAULT 100000,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Token usage tracking
  db.run(`CREATE TABLE IF NOT EXISTS token_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    tokens_used INTEGER DEFAULT 0,
    last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Settings table
  db.run(`CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    key TEXT,
    value TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Chat history
  db.run(`CREATE TABLE IF NOT EXISTS chat_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    token_cost INTEGER DEFAULT 0,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Semantic cache
  db.run(`CREATE TABLE IF NOT EXISTS semantic_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query_hash TEXT NOT NULL,
    response TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(query_hash)
  )`);

  // Simple task routing
  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT,
    result TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Buy tokens
  db.run(`CREATE TABLE IF NOT EXISTS token_purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    tokens_bought INTEGER,
    amount_paid REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
});

// Helper: Estimate token cost from message length
function estimateTokenCost(text) {
  // Rough heuristic: 4 chars ≈ 1 token in English
  return Math.max(1, Math.ceil(text.length / 4));
}

// Helper: Generate hash for semantic caching
function hashQuery(query) {
  return crypto.createHash('sha256').update(query.toLowerCase()).digest('hex');
}

function hashBody(body) {
  return crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
}

// Helper: Get user's remaining token budget
async function getTokenBudget(userId) {
  const user = await getUserById(userId);
  if (!user) return 0;

  const usage = await getTokenUsage(userId);
  return Math.max(0, user.token_limit - usage.tokens_used);
}

// Helper functions
function getUserById(id) {
  return new Promise((resolve) => {
    db.get(`SELECT * FROM users WHERE id = ?`, [id], (err, row) => {
      resolve(err ? null : row);
    });
  });
}

function getTokenUsage(userId) {
  return new Promise((resolve) => {
    db.get(`SELECT * FROM token_usage WHERE user_id = ? ORDER BY timestamp DESC LIMIT 1`, [userId], (err, row) => {
      resolve(err ? { tokens_used: 0 } : row);
    });
  });
}

async function recordTokenUsage(userId, tokens) {
  // Increment tokens used
  const today = new Date().toISOString().split('T')[0];
  const query = `INSERT INTO token_usage (user_id, tokens_used) VALUES (?, ?)
                 ON CONFLICT(user_id) DO UPDATE SET tokens_used = tokens_used + ?, timestamp = ?`;
  db.run(query, [userId, tokens, tokens, today], (err) => {
    if (err) console.error('Failed to record token usage:', err);
  });
}

function recordTokenPurchase(userId, tokens, amount) {
  db.run(`INSERT INTO token_purchases (user_id, tokens_bought, amount_paid) VALUES (?, ?, ?)`,
         [userId, tokens, amount], (err) => {
    if (err) console.error('Failed to record token purchase:', err);
  });
}

async function addChatMessage(userId, role, content) {
  const tokenCost = estimateTokenCost(content);
  try {
    const query = `INSERT INTO chat_history (user_id, role, content, token_cost) VALUES (?, ?, ?, ?)`;
    db.run(query, [userId, role, content, tokenCost], function(err) {
      if (err) console.error('Failed to add chat message:', err);
      else console.log('Chat message added with tokenCost:', tokenCost);
    });
  } catch (err) {
    console.error('Add chat message error:', err);
  }
}

// Routes
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

  const hash = await bcrypt.hash(password, 10);
  db.run(`INSERT INTO users (username, password_hash) VALUES (?, ?)`,
         [username, hash], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ userId: this.lastID });
  });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

  db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, row.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    // Generate simple JWT (in real app store in token cookie)
    const token = jwt.sign({ userId: row.id }, process.env.JWT_SECRET || 'rick_secret');
    res.json({ token, userId: row.id });
  });
});

// Middleware to protect routes
async function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'rick_secret');
    req.userId = decoded.userId;
    next();
  } catch (e) {
    res.status(400).json({ error: 'Invalid token' });
  }
}

// Protected routes
app.post('/api/settings', authenticate, (req, res) => {
  const { userId } = req;
  const { key, value } = req.body;
  if (!key || value === undefined) return res.status(400).json({ error: 'Invalid data' });

  db.run(`INSERT INTO settings (user_id, key, value)
          VALUES (?, ?, ?)
          ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value`,
         [userId, key, value], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.get('/api/settings', authenticate, (req, res) => {
  const { userId } = req;
  db.all(`SELECT key, value FROM settings WHERE user_id = ?`, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const settings = {};
    rows.forEach(r => settings[r.key] = r.value);
    res.json(settings);
  });
});

app.post('/api/chat', authenticate, async (req, res) => {
  const { userId, role, content } = req.body;
  if (!content) return res.status(400).json({ error: 'Empty message' });

  // Check token budget
  const remaining = await getTokenBudget(userId);
  if (remaining <= 0) {
    return res.status(403).json({ error: 'Token budget exhausted' });
  }

  // Check semantic cache
  const queryHash = hashBody(req.body);
  db.get(`SELECT response FROM semantic_cache WHERE query_hash = ?`, [queryHash], async (err, cacheRow) => {
    if (cacheRow) {
      console.log('Cache hit!');
      // Still need to record usage but use cached response
      const fakeMessage = { role, content: cacheRow.response, token_cost: 0 };
      return addChatMessage(userId, role, fakeMessage);
    }

    // Process real response
    const fakeResponse = {
      role,
      content: `Rick says: ${content} (processed)`,
      token_cost: estimateTokenCost(content)
    };

    // Record usage and add to chat
    await addChatMessage(userId, role, fakeResponse);

    // Store in cache (simple hash -> response)
    db.run(`INSERT INTO semantic_cache (query_hash, response) VALUES (?, ?)`,
           [queryHash, fakeResponse.content], (err) => {
      if (err) console.error('Cache insert error:', err);
    });

    res.json(fakeResponse);
  });
});

app.post('/api/task', authenticate, (req, res) => {
  const { userId, action } = req.body;
  if (!action) return res.status(400).json({ error: 'Missing action' });

  // Simple task routing
  const task = {
    ids: 1,
    action,
    result: `Task ${action} completed by Morty!`
  };

  db.run(`INSERT INTO tasks (user_id, action, result) VALUES (?, ?, ?)`,
         [userId, action, task.result], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, result: task.result });
  });
});

app.post('/api/search', authenticate, (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'Missing query' });

  // Simple RAG simulation
  const fakeResults = [
    `Result 1: ${query} - This is a simulated knowledge base entry.`,
    `Result 2: ${query.toUpperCase()} - Another simulated result.`,
    `Result 3: Hemmer! You found the Hemmer reference!`
  ];

  // Return up to 2 results
  res.json({ results: fakeResults.slice(0, 2) });
});

app.post('/api/buy-tokens', authenticate, async (req, res) => {
  const { userId } = req;
  const { amount } = req.body; // Amount in USD

  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

  // Simulate token purchase (1 USD = 1000 tokens)
  const tokensBought = Math.floor(amount * 1000);

  try {
    const response = await fetch('/api/pay', {  // Mock payment endpoint
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });

    const data = await response.json();
    if (data.success) {
      // Record purchase
      recordTokenPurchase(userId, tokensBought, amount);

      // Update token usage tracking
      const currentUsage = await getTokenUsage(userId);
      const newUsage = {
        ...currentUsage,
        tokens_used: currentUsage.tokens_used + tokensBought
      };

      db.run(`UPDATE token_usage SET tokens_used = ?, last_used = CURRENT_TIMESTAMP
              WHERE user_id = ?`, [newUsage.tokens_used, userId]);

      res.json({ success: true, tokensBought, remaining: (await getTokenBudget(userId)).toLocaleString() });
    } else {
      res.status(400).json({ error: data.error || 'Payment failed' });
    }
  } catch (e) {
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

// Serve built React app in production
app.use(express.static(path.join(__dirname, '../frontend/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));