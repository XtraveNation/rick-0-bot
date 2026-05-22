const {
  extractEntities,
  extractApiKeys,
  extractFilePaths,
  extractVarNames,
  extractFolderNames
} = require('../../../jerry/entityExtractor');

describe('Entity Extractor', () => {
  describe('extractApiKeys', () => {
    it('should extract Stripe test API keys', () => {
      const content = 'My API key is sk_test_abc123def456 for testing';
      const keys = extractApiKeys(content);
      expect(keys).toContain('sk_test_abc123def456');
    });

    it('should extract Stripe publishable keys', () => {
      const content = 'Use pk_test_xyz789 for frontend';
      const keys = extractApiKeys(content);
      expect(keys).toContain('pk_test_xyz789');
    });

    it('should extract multiple API keys', () => {
      const content = 'sk_test_key1 and pk_test_key2 are both here';
      const keys = extractApiKeys(content);
      expect(keys.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle empty content', () => {
      const keys = extractApiKeys('');
      expect(keys).toEqual([]);
    });

    it('should not extract partial keys', () => {
      const content = 'sk_test_ is incomplete';
      const keys = extractApiKeys(content);
      expect(keys.length).toBe(0);
    });
  });

  describe('extractFilePaths', () => {
    it('should extract Windows file paths', () => {
      const content = 'File located at C:\\Users\\john\\Documents\\report.pdf';
      const paths = extractFilePaths(content);
      expect(paths.some(p => p.includes('report.pdf'))).toBe(true);
    });

    it('should extract Unix file paths', () => {
      const content = 'Check /home/user/documents/file.txt for details';
      const paths = extractFilePaths(content);
      expect(paths.some(p => p.includes('file.txt'))).toBe(true);
    });

    it('should extract relative paths', () => {
      const content = './src/components/App.js is the main file';
      const paths = extractFilePaths(content);
      expect(paths.length).toBeGreaterThan(0);
    });

    it('should extract multiple file paths', () => {
      const content = '/path/to/file1.js and C:\\another\\file2.txt';
      const paths = extractFilePaths(content);
      expect(paths.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle paths with multiple extensions', () => {
      const content = 'Archive at /backup/data.tar.gz is ready';
      const paths = extractFilePaths(content);
      expect(paths.length).toBeGreaterThan(0);
    });
  });

  describe('extractVarNames', () => {
    it('should extract environment variable names', () => {
      const content = 'Set DATABASE_URL=postgres://localhost and API_KEY=secret';
      const vars = extractVarNames(content);
      expect(vars).toContain('DATABASE_URL');
      expect(vars).toContain('API_KEY');
    });

    it('should extract uppercase variable names', () => {
      const content = 'MY_VAR=value and ANOTHER_VAR=123';
      const vars = extractVarNames(content);
      expect(vars.some(v => /MY_VAR|ANOTHER_VAR/.test(v))).toBe(true);
    });

    it('should not extract lowercase variables', () => {
      const content = 'myVar=something and myOtherVar=else';
      const vars = extractVarNames(content);
      expect(vars.length).toBe(0);
    });

    it('should extract single letter uppercase vars', () => {
      const content = 'Set A=1 and B=2';
      const vars = extractVarNames(content);
      expect(vars.some(v => /^[A-Z]$/.test(v))).toBe(true);
    });
  });

  describe('extractFolderNames', () => {
    it('should extract folder names from Unix paths', () => {
      const content = 'Navigate to /src/ then /components/';
      const folders = extractFolderNames(content);
      expect(folders).toContain('src');
      expect(folders).toContain('components');
    });

    it('should extract folder names from Windows paths', () => {
      const content = 'Go to \\backend\\ or \\frontend\\';
      const folders = extractFolderNames(content);
      expect(folders.length).toBeGreaterThan(0);
    });

    it('should extract from relative paths', () => {
      const content = './utils/ contains helper functions';
      const folders = extractFolderNames(content);
      expect(folders).toContain('utils');
    });

    it('should handle hyphenated folder names', () => {
      const content = 'Check /my-folder/ for files';
      const folders = extractFolderNames(content);
      expect(folders).toContain('my-folder');
    });

    it('should handle underscored folder names', () => {
      const content = 'Inside /test_utils/ you will find tests';
      const folders = extractFolderNames(content);
      expect(folders.some(f => /test_utils|test/.test(f))).toBe(true);
    });
  });

  describe('extractEntities', () => {
    it('should extract all entity types from mixed content', () => {
      const content = `
        API Key: sk_test_12345abcde
        File: C:\\Users\\john\\config.json
        Env: DATABASE_URL=localhost
        Folder: /app/ contains code
      `;
      const entities = extractEntities(content);
      
      expect(entities.api_key.length).toBeGreaterThan(0);
      expect(entities.file_path.length).toBeGreaterThan(0);
      expect(entities.var_name.length).toBeGreaterThan(0);
      expect(entities.folder_name.length).toBeGreaterThan(0);
    });

    it('should return empty arrays for content with no entities', () => {
      const content = 'This is just plain text without any special patterns.';
      const entities = extractEntities(content);
      
      expect(entities.api_key).toEqual([]);
      expect(entities.file_path).toEqual([]);
      expect(entities.var_name).toEqual([]);
      expect(entities.folder_name).toEqual([]);
    });

    it('should handle null and undefined content gracefully', () => {
      expect(extractEntities(null)).toEqual({
        api_key: [],
        file_path: [],
        var_name: [],
        folder_name: []
      });

      expect(extractEntities(undefined)).toEqual({
        api_key: [],
        file_path: [],
        var_name: [],
        folder_name: []
      });
    });

    it('should handle empty string', () => {
      const entities = extractEntities('');
      expect(entities.api_key).toEqual([]);
      expect(entities.file_path).toEqual([]);
      expect(entities.var_name).toEqual([]);
      expect(entities.folder_name).toEqual([]);
    });

    it('should deduplicate entities of the same type', () => {
      const content = 'API: sk_test_key and sk_test_key again';
      const entities = extractEntities(content);
      const keyCount = entities.api_key.filter(k => k === 'sk_test_key').length;
      
      // Should have at most 1 of the same key (deduplication)
      expect(keyCount).toBeLessThanOrEqual(1);
    });

    it('should extract real-world example', () => {
      const content = `
        Deploy with DEPLOY_ENV=production and API_TOKEN=sk_test_abc123xyz
        Log file: /var/log/app.log
        Source in /src/app.js
      `;
      const entities = extractEntities(content);
      
      expect(entities.var_name.length).toBeGreaterThan(0);
      expect(entities.api_key.length).toBeGreaterThan(0);
      expect(entities.file_path.length).toBeGreaterThan(0);
      expect(entities.folder_name.length).toBeGreaterThan(0);
    });
  });
});
