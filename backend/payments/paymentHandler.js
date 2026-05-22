const express = require('express');
const router = express.Router();

// Payment manager (passed from server.js)
let paymentManager;

function setPaymentManager(pm) {
  paymentManager = pm;
}

// Checkout: create session
router.post('/create-checkout', async (req, res) => {
  const { session_id, amount, provider } = req.body;
  if (!session_id || !amount) return res.status(400).json({ error: 'Missing session_id or amount' });

  try {
    const result = await paymentManager.createSession(session_id, amount, provider);
    res.json(result);
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Webhook: generic endpoint for all providers
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.get('X-Signature') || req.get('Stripe-Signature');
    const provider = req.get('X-Provider') || 'coinbase';
    
    const result = await paymentManager.handleWebhook(req.body, signature, provider);
    
    // TODO: Extract amount and session_id from webhook payload and add tokens
    // For now, just acknowledge webhook
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = { router, setPaymentManager };
