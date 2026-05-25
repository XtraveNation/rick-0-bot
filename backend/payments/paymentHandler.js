const express = require('express');
const router = express.Router();
const tokensService = require('../jerry/tokens');

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

// Webhook: process Coinbase Commerce events
router.post('/webhook/coinbase', async (req, res) => {
  try {
    const event = req.body;
    
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
        console.log(`✅ Coinbase payment confirmed: +${tokensToAdd} tokens to ${sessionId}`);
      }
    }
    
    res.status(200).json({ success: true, received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Webhook: process Stripe events
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.get('Stripe-Signature');
    const event = JSON.parse(req.body);
    
    // TODO: Verify webhook signature with Stripe secret
    // const verified = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    
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
        console.log(`✅ Stripe payment confirmed: +${tokensToAdd} tokens to ${sessionId}`);
      }
    }
    
    res.status(200).json({ success: true, received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = { router, setPaymentManager };
