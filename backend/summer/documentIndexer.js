const fs = require('fs');
const path = require('path');
const logger = require('../logger');

async function readFileSafe(filePath) {
  try {
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) return null;
    const content = fs.readFileSync(filePath, 'utf8');
    return content;
  } catch (e) {
    return null;
  }
}

function walk(dir, exts = ['.md', '.txt', '.html', '.js', '.jsx', '.py']) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const p = path.join(dir, file);
    try {
      const stat = fs.statSync(p);
      if (stat && stat.isDirectory()) {
        results.push(...walk(p, exts));
      } else {
        if (exts.includes(path.extname(p))) results.push(p);
      }
    } catch (e) {
      // Skip files that can't be read
    }
  });
  return results;
}

async function indexPaths(paths = [], qdrantClient) {
  // default paths to index
  const repoRoot = path.resolve(__dirname, '..', '..');
  const toIndex = new Set();
  if (!paths || paths.length === 0) {
    ['README.md', 'frontend', 'backend', 'Projects'].forEach(p => {
      const full = path.join(repoRoot, p);
      if (fs.existsSync(full)) toIndex.add(full);
    });
  } else {
    paths.forEach(p => {
      const full = path.isAbsolute(p) ? p : path.join(repoRoot, p);
      if (fs.existsSync(full)) toIndex.add(full);
    });
  }

  const files = [];
  for (const p of Array.from(toIndex)) {
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      files.push(...walk(p));
    } else if (stat.isFile()) {
      files.push(p);
    }
  }

  const summary = { indexed: 0, errors: 0 };
  for (const f of files) {
    const content = await readFileSafe(f);
    if (!content) { summary.errors++; continue; }
    try {
      await qdrantClient.upsertDocument(f, content.substring(0, 20000), { path: f });
      summary.indexed++;
    } catch (e) {
      logger.error('Failed to index', f, e.message);
      summary.errors++;
    }
  }

  return `Indexed ${summary.indexed} documents, ${summary.errors} errors`;
}

module.exports = { indexPaths };
