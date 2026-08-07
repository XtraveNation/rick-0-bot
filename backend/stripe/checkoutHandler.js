const express = require('express');
const router = express.Router();

// Placeholder Stripe checkout session creation.
//
// NOTE: The Stripe webhook handler used to live here as a stub that only
// logged the raw body. It has been removed to avoid having two competing
// webhook implementations — the real, signature-verified Stripe webhook now
// lives exclusively at POST /api/payments/webhook/stripe
// (backend/payments/paymentHandler.js).

router.post('/create-checkout-session', async (req, res) => {
  const { session_id, amount } = req.body;
  // In production: create Stripe Checkout Session and return session URL
  // For now return a mock response
  res.json({ success: true, checkout_url: 'https://example.com/checkout-mock' });
});

module.exports = router;
