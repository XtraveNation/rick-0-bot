const path = require('path');
const fs = require('fs');

/**
 * Generates a unique, isolated SQLite DB path for a test file/suite and
 * points JERRY_DB_PATH at it so any subsequently-constructed JerryDatabase
 * (including the singleton returned by getDatabase()) opens this file
 * instead of the shared default backend/data/jerry.db.
 *
 * @param {string} subdir - subdirectory under backend/data to place the
 *   test db in (keeps different test suites from colliding on disk).
 * @returns {string} the absolute path to the generated test db file.
 */
function createTestDbPath(subdir = 'test') {
  const testDir = path.join(__dirname, '..', '..', 'data', subdir);
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const dbPath = path.join(testDir, `test-${uniqueSuffix}.db`);
  process.env.JERRY_DB_PATH = dbPath;
  return dbPath;
}

/**
 * Deletes the given test db file if it exists. Safe to call multiple times.
 */
function cleanupTestDb(dbPath) {
  if (dbPath && fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
}

module.exports = { createTestDbPath, cleanupTestDb };
