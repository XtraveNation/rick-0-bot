const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const logger = require('../logger');

class JerryDatabase {
  constructor() {
    const dbPath = process.env.JERRY_DB_PATH || path.join(__dirname, '..', 'data', 'jerry.db');
    
    // Ensure data directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        logger.error('Failed to connect to Jerry database:', err);
      } else {
        logger.info('Connected to Jerry SQLite database at:', dbPath);
      }
    });

    // Enable foreign keys
    this.db.run('PRAGMA foreign_keys = ON');
  }

  /**
   * Initialize database schema
   */
  async init() {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Messages table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
            content TEXT NOT NULL,
            tokens_used INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) reject(err);
        });

        // Messages index for performance
        this.db.run(`
          CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id)
        `, (err) => {
          if (err) reject(err);
        });

        this.db.run(`
          CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at)
        `, (err) => {
          if (err) reject(err);
        });

        // Entities table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS entities (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            value TEXT NOT NULL,
            last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(session_id, entity_type, value)
          )
        `, (err) => {
          if (err) reject(err);
        });

        // Entities index for performance
        this.db.run(`
          CREATE INDEX IF NOT EXISTS idx_entities_session_id ON entities(session_id)
        `, (err) => {
          if (err) reject(err);
        });

        this.db.run(`
          CREATE INDEX IF NOT EXISTS idx_entities_entity_type ON entities(entity_type)
        `, (err) => {
          if (err) reject(err);
        });

        // Summaries table for token summarization
        this.db.run(`
          CREATE TABLE IF NOT EXISTS summaries (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            turn_range TEXT NOT NULL,
            summary_text TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) reject(err);
        });

        // Summaries index for performance
        this.db.run(`
          CREATE INDEX IF NOT EXISTS idx_summaries_session_id ON summaries(session_id)
        `, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  }

  /**
   * Store a message with prepared statement (SQL injection protection)
   */
  storeMessage(sessionId, role, content, tokensUsed = 0) {
    return new Promise((resolve, reject) => {
      const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const stmt = this.db.prepare(`
        INSERT INTO messages (id, session_id, role, content, tokens_used)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      stmt.run(id, sessionId, role, content, tokensUsed, (err) => {
        stmt.finalize();
        if (err) {
          reject(err);
        } else {
          resolve({ id, session_id: sessionId, role, content, tokens_used: tokensUsed });
        }
      });
    });
  }

  /**
   * Retrieve message history for a session
   */
  getHistory(sessionId, limit = 50) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        SELECT id, session_id, role, content, tokens_used, created_at
        FROM messages
        WHERE session_id = ?
        ORDER BY created_at DESC
        LIMIT ?
      `);

      stmt.all(sessionId, limit, (err, rows) => {
        stmt.finalize();
        if (err) {
          reject(err);
        } else {
          resolve((rows || []).reverse()); // Return in chronological order
        }
      });
    });
  }

  /**
   * Upsert entity (insert if not exists, update last_seen if exists)
   */
  upsertEntity(sessionId, entityType, value) {
    return new Promise((resolve, reject) => {
      const id = `ent_${sessionId}_${entityType}_${value.substring(0, 20)}`.replace(/[^a-zA-Z0-9_-]/g, '_');
      
      const stmt = this.db.prepare(`
        INSERT INTO entities (id, session_id, entity_type, value, last_seen)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(session_id, entity_type, value) DO UPDATE SET
          last_seen = CURRENT_TIMESTAMP
      `);

      stmt.run(id, sessionId, entityType, value, (err) => {
        stmt.finalize();
        if (err) {
          reject(err);
        } else {
          resolve({ id, session_id: sessionId, entity_type: entityType, value });
        }
      });
    });
  }

  /**
   * Get entities for a session
   */
  getEntities(sessionId) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        SELECT id, session_id, entity_type, value, last_seen
        FROM entities
        WHERE session_id = ?
        ORDER BY entity_type, last_seen DESC
      `);

      stmt.all(sessionId, (err, rows) => {
        stmt.finalize();
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  /**
   * Store a summary
   */
  storeSummary(sessionId, turnRange, summaryText) {
    return new Promise((resolve, reject) => {
      const id = `sum_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const stmt = this.db.prepare(`
        INSERT INTO summaries (id, session_id, turn_range, summary_text)
        VALUES (?, ?, ?, ?)
      `);

      stmt.run(id, sessionId, turnRange, summaryText, (err) => {
        stmt.finalize();
        if (err) {
          reject(err);
        } else {
          resolve({ id, session_id: sessionId, turn_range: turnRange, summary_text: summaryText });
        }
      });
    });
  }

  /**
   * Close database connection
   */
  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          logger.info('Jerry database connection closed');
          resolve();
        }
      });
    });
  }
}

// Singleton instance
let instance = null;

function getDatabase() {
  if (!instance) {
    instance = new JerryDatabase();
  }
  return instance;
}

module.exports = {
  getDatabase,
  JerryDatabase
};
