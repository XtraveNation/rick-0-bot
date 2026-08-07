const express = require('express');
const crypto = require('crypto');
const Stripe = require('stripe');
const router = express.Router();
const tokensService = require('../jerry/tokens');
const logger = require('../logger');

// Payment manager (passed from server.js)
let paymentManager;

function setPaymentManager(pm) {
  paymentManager = pm;
}

// Stripe SDK instance used only for webhook signature verification.
// Lazily constructed so the module can still load without a secret key set
// (e.g. in tests) and only fails when a webhook actually needs verifying.
let stripeClient = null;
function getStripeClient() {
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY || '');
  }
  return stripeClient;
}

/**
 * Verify a Coinbase Commerce webhook signature.
 * Coinbase Commerce signs the raw request body with HMAC-SHA256 using the
 * webhook shared secret, sent in the X-CC-Webhook-Signature header.
 */
function verifyCoinbaseSignature(rawBody, signature, secret) {
  if (!signature || !secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
  } catch {
    return false;
  }
}

// Checkout: create session
router.post('/create-checkout', async (req, res) => {
  const { session_id, amount, provider } = req.body;
  if (!session_id || !amount) return res.status(400).json({ error: 'Missing session_id or amount' });

  try {
    const result = await paymentManager.createSession(session_id, amount, provider);
    res.json(result);
  } catch (err) {
    logger.error('Checkout error', { error: err.message });
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Webhook: process Coinbase Commerce events
router.post('/webhook/coinbase', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.get('X-CC-Webhook-Signature');
    const secret = process.env.COINBASE_WEBHOOK_SECRET;

    if (!verifyCoinbaseSignature(req.body, signature, secret)) {
      logger.warn('Coinbase webhook signature verification failed');
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = JSON.parse(req.body.toString('utf8'));

    // Handle different event types
    if (event.type === 'charge:confirmed' || event.type === 'charge:resolved') {
      const chargeData = event.data;
      const metadata = chargeData.metadata || {};
      const sessionId = metadata.session_id;

      // Extract amount and convert to tokens (1 USD = 100 tokens, example pricing)
      const amountUsd = parseFloat(chargeData.pricing.local.amount) || 0;
      const tokensToAdd = Math.floor(amountUsd * 100);

      if (sessionId && tokensToAdd > 0) {
        await tokensService.addTokens(sessionId, tokensToAdd);
        logger.info('Coinbase payment confirmed', { sessionId, tokensToAdd });
      }
    }

    res.status(200).json({ success: true, received: true });
  } catch (err) {
    logger.error('Coinbase webhook error', { error: err.message });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Webhook: process Stripe events
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.get('Stripe-Signature');
  let event;

  try {
    event = getStripeClient().webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.warn('Stripe webhook signature verification failed', { error: err.message });
    return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const sessionId = session.metadata?.session_id;

      // Calculate tokens based on line items
      let tokensToAdd = 0;
      if (session.line_items) {
        for (const item of session.line_items.data) {
          const priceUsd = item.price.unit_amount / 100; // Convert cents to dollars
          tokensToAdd += Math.floor(priceUsd * 100); // 1 USD = 100 tokens
        }
      }

      if (sessionId && tokensToAdd > 0) {
        await tokensService.addTokens(sessionId, tokensToAdd);
        logger.info('Stripe payment confirmed', { sessionId, tokensToAdd });
      }
    }

    res.status(200).json({ success: true, received: true });
  } catch (err) {
    logger.error('Stripe webhook error', { error: err.message });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = { router, setPaymentManager };
