const { getDatabase } = require('./db');

async function ensureTokensTable() {
  const dbInst = getDatabase();
  // Ensure DB init
  await dbInst.init();
  const db = dbInst.db;

  return new Promise((resolve, reject) => {
    db.run(`
      CREATE TABLE IF NOT EXISTS tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL UNIQUE,
        balance INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

async function getBalance(sessionId) {
  const dbInst = getDatabase();
  await dbInst.init();
  const db = dbInst.db;

  return new Promise((resolve, reject) => {
    db.get(`SELECT balance FROM tokens WHERE session_id = ?`, [sessionId], (err, row) => {
      if (err) return reject(err);
      if (!row) return resolve(0);
      resolve(row.balance || 0);
    });
  });
}

async function addTokens(sessionId, amount) {
  const dbInst = getDatabase();
  await dbInst.init();
  const db = dbInst.db;

  return new Promise((resolve, reject) => {
    db.run(`
      INSERT INTO tokens (session_id, balance)
      VALUES (?, ?)
      ON CONFLICT(session_id) DO UPDATE SET balance = balance + excluded.balance, updated_at = CURRENT_TIMESTAMP;
    `, [sessionId, amount], function (err) {
      if (err) return reject(err);
      getBalance(sessionId).then(resolve).catch(reject);
    });
  });
}

async function consumeTokens(sessionId, amount) {
  const dbInst = getDatabase();
  await dbInst.init();
  const db = dbInst.db;

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.get(`SELECT balance FROM tokens WHERE session_id = ?`, [sessionId], (err, row) => {
        if (err) return reject(err);
        const current = (row && row.balance) ? row.balance : 0;
        if (current < amount) return resolve({ success: false, balance: current, message: 'Insufficient tokens' });

        db.run(`UPDATE tokens SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE session_id = ?`, [amount, sessionId], function (err2) {
          if (err2) return reject(err2);
          getBalance(sessionId).then(newBal => resolve({ success: true, balance: newBal })).catch(reject);
        });
      });
    });
  });
}

module.exports = { ensureTokensTable, getBalance, addTokens, consumeTokens };
