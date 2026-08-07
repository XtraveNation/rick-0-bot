const winston = require('winston');

// Shared application logger.
// Logs to stdout/stderr with timestamps. In production, JSON output makes
// logs easy to ingest into log aggregation tools; in development we use a
// simpler colorized format for readability.
const isProduction = process.env.NODE_ENV === 'production';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  format: isProduction
    ? winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      )
    : winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
          const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} ${level}: ${stack || message}${extra}`;
        })
      ),
  transports: [new winston.transports.Console()],
});

module.exports = logger;
