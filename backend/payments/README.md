# Payment Integration Guide

RickiA supports multiple payment providers for token purchases:

## Providers

### Coinbase Commerce (Crypto-native)
- **Accepts**: Bitcoin, Ethereum, USDC, and other cryptocurrencies
- **Setup**:
  ```bash
  export COINBASE_API_KEY=your_api_key
  export PAYMENT_PROVIDER=coinbase
  ```
- **Docs**: https://docs.cloud.coinbase.com/commerce/docs

### Stripe (Credit/Debit Cards)
- **Accepts**: Visa, Mastercard, Amex, etc.
- **Setup**:
  ```bash
  export STRIPE_SECRET_KEY=sk_test_...
  export PAYMENT_PROVIDER=stripe
  ```
- **Docs**: https://stripe.com/docs

## Future Integrations
- Razorpay (India-friendly, free tier)
- Gumroad (digital products)
- THird Web Pay (multi-chain)

## Testing
1. Set `PAYMENT_PROVIDER` env var
2. Frontend shows token packages with provider-specific checkout
3. Webhooks (when configured) add tokens on payment success

## Security Notes
- All webhook signatures must be verified (see paymentManager.js)
- Test keys recommended for development
- Never commit real API keys to Git
