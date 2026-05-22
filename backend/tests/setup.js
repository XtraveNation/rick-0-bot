// Jest setup file
// Global test configuration and utilities

// Increase test timeout to 10 seconds for database operations
jest.setTimeout(10000);

// Suppress console output during tests unless there's an error
const originalLog = console.log;
const originalError = console.error;

global.testMode = true;

// Only show errors, suppress info logs
if (process.env.DEBUG !== 'true') {
  console.log = jest.fn((...args) => {
    if (args[0] && args[0].includes && args[0].includes('error')) {
      originalLog(...args);
    }
  });
  console.error = jest.fn(originalError);
}
