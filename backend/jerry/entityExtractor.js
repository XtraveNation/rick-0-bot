/**
 * Entity Extractor - Identifies and extracts entities from message content
 * Handles API keys, file paths, variable names, and folder names
 */

const ENTITY_PATTERNS = {
  api_key: [
    /sk_test_\w+/g,
    /pk_test_\w+/g,
    /sk_live_\w+/g,
    /pk_live_\w+/g,
    /\b[A-Za-z0-9_-]{40,}\b/g // Generic long API key pattern
  ],
  file_path: [
    /([A-Za-z]:)?[\\/](?:[^\s\\/:*?"<>|]+[\\/])*[^\s\\/:*?"<>|]+\.[a-zA-Z0-9]+/g,
    /(?:\/|\\)[\w\-\.\/\\]+\.[a-zA-Z0-9]+/g
  ],
  var_name: [
    /^[A-Z_][A-Z0-9_]*\s*=/m,
    /\b[A-Z_][A-Z0-9_]*\b(?:\s*=\s*[^\s;,)}\]]+)?/g
  ],
  folder_name: [
    /\/([a-z][a-z0-9_-]*)\//g,
    /\\([a-z][a-z0-9_-]*)\\/g,
    /(?:^|\s)\.\/([a-z][a-z0-9_-]*)/g,
    /(?:^|\s)\.\\([a-z][a-z0-9_-]*)/g
  ]
};

/**
 * Extract API keys from content
 */
function extractApiKeys(content) {
  const keys = [];
  const seen = new Set();

  for (const pattern of ENTITY_PATTERNS.api_key) {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        if (!seen.has(match)) {
          keys.push(match);
          seen.add(match);
        }
      });
    }
  }

  return keys;
}

/**
 * Extract file paths from content
 */
function extractFilePaths(content) {
  const paths = [];
  const seen = new Set();

  for (const pattern of ENTITY_PATTERNS.file_path) {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const cleaned = match.trim();
        if (cleaned && !seen.has(cleaned) && cleaned.length > 4) {
          paths.push(cleaned);
          seen.add(cleaned);
        }
      });
    }
  }

  return paths;
}

/**
 * Extract variable names from content
 */
function extractVarNames(content) {
  const vars = [];
  const seen = new Set();

  for (const pattern of ENTITY_PATTERNS.var_name) {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const cleaned = match.split('=')[0].trim();
        if (cleaned && /^[A-Z_][A-Z0-9_]*$/.test(cleaned) && !seen.has(cleaned)) {
          vars.push(cleaned);
          seen.add(cleaned);
        }
      });
    }
  }

  return vars;
}

/**
 * Extract folder names from content
 */
function extractFolderNames(content) {
  const folders = [];
  const seen = new Set();

  for (const pattern of ENTITY_PATTERNS.folder_name) {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        // Extract folder name from the match
        let folder = match.replace(/[/\\\.]/g, '').trim();
        if (folder && /^[a-z][a-z0-9_-]*$/.test(folder) && !seen.has(folder)) {
          folders.push(folder);
          seen.add(folder);
        }
      });
    }
  }

  return folders;
}

/**
 * Main function: Extract all entities from message content
 * Returns object with entity types as keys and arrays of values
 */
function extractEntities(content) {
  if (!content || typeof content !== 'string') {
    return {
      api_key: [],
      file_path: [],
      var_name: [],
      folder_name: []
    };
  }

  return {
    api_key: extractApiKeys(content),
    file_path: extractFilePaths(content),
    var_name: extractVarNames(content),
    folder_name: extractFolderNames(content)
  };
}

/**
 * Format extracted entities for storage
 * Returns flat array of {type, value} objects
 */
function formatExtractedEntities(entities) {
  const formatted = [];

  Object.entries(entities).forEach(([type, values]) => {
    if (Array.isArray(values)) {
      values.forEach(value => {
        if (value && value.length > 0) {
          formatted.push({
            type,
            value: value.toString()
          });
        }
      });
    }
  });

  return formatted;
}

module.exports = {
  extractEntities,
  extractApiKeys,
  extractFilePaths,
  extractVarNames,
  extractFolderNames,
  formatExtractedEntities,
  ENTITY_PATTERNS
};
