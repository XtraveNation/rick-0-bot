const rateLimit = require('express-rate-limit');

// Stricter limiter for payment webhook endpoints (external providers only,
// but still worth bounding to blunt abuse/retry storms).
const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many webhook requests, please try again later' },
});

// General limiter for public-facing API routes.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

module.exports = { webhookLimiter, apiLimiter };
