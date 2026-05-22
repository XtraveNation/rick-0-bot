import React, { useState } from 'react';
import { Button, Box, Typography, Select, MenuItem, Paper, Grid } from '@mui/material';
import { styled } from '@mui/material/styles';

const JerryTheme = styled(Paper)(({ theme }) => ({
  background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  border: '2px solid #e94560',
  boxShadow: '0 0 30px rgba(233,69,96,0.3)',
  color: '#f4f4f4',
  padding: theme.spacing(4),
}));

const TokenPackage = styled(Paper)(({ theme }) => ({
  p: 2,
  bgcolor: 'rgba(233,69,96,0.1)',
  textAlign: 'center',
  border: '1px solid rgba(233,69,96,0.3)',
  borderRadius: theme.spacing(1),
  '&:hover': {
    bgcolor: 'rgba(233,69,96,0.2)',
    transform: 'translateY(-2px)',
  }
}));

export default function JerryTab() {
  const sessionId = `session-${Date.now()}`;
  const [provider, setProvider] = useState('coinbase');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const packages = [
    { tokens: 100, price: 1.00 },
    { tokens: 500, price: 4.50 },
    { tokens: 1000, price: 8.00 }
  ];

  async function handleCheckout(tokenCount) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          amount: tokenCount * 0.01,
          provider
        })
      });
      const json = await res.json();
      if (json.checkout_url) {
        window.location.href = json.checkout_url;
      } else {
        setError(json.error || 'Failed to create checkout');
      }
    } catch (e) {
      console.error('Checkout error', e);
      setError('Checkout failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <JerryTheme elevation={3}>
      <Typography variant="h4" sx={{ color: '#e94560', mb: 3, fontWeight: 'bold' }}>
        💰 Token Marketplace
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, color: '#b0b0b0' }}>
          Payment Provider:
        </Typography>
        <Select 
          value={provider} 
          onChange={(e) => setProvider(e.target.value)}
          sx={{ 
            minWidth: 200,
            backgroundColor: 'rgba(255,255,255,0.05)',
            color: '#f4f4f4',
            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e94560' }
          }}
        >
          <MenuItem value="coinbase">💰 Coinbase Commerce (Crypto)</MenuItem>
          <MenuItem value="stripe">💳 Stripe (Cards)</MenuItem>
        </Select>
      </Box>

      {error && (
        <Typography variant="body2" sx={{ color: '#ff6b6b', mb: 2 }}>
          ⚠️ {error}
        </Typography>
      )}

      <Typography variant="h6" sx={{ mb: 2, color: '#e94560' }}>
        Available Packages
      </Typography>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        {packages.map(pkg => (
          <Grid item xs={12} sm={6} md={4} key={pkg.tokens}>
            <TokenPackage>
              <Typography variant="h5" sx={{ color: '#e94560', fontWeight: 'bold' }}>
                {pkg.tokens}
              </Typography>
              <Typography variant="caption" sx={{ color: '#b0b0b0' }}>
                Tokens
              </Typography>
              <Typography variant="body1" sx={{ color: '#f4f4f4', my: 1 }}>
                ${pkg.price.toFixed(2)}
              </Typography>
              <Button
                fullWidth
                variant="contained"
                onClick={() => handleCheckout(pkg.tokens)}
                disabled={loading}
                sx={{
                  mt: 1,
                  bgcolor: '#e94560',
                  '&:hover': { bgcolor: '#d93a52' },
                  '&:disabled': { bgcolor: '#666' }
                }}
              >
                {loading ? '⏳ Processing...' : 'Buy Now'}
              </Button>
            </TokenPackage>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1, border: '1px solid rgba(233,69,96,0.2)' }}>
        <Typography variant="caption" sx={{ color: '#b0b0b0' }}>
          🔒 <strong>Secure & Private:</strong> All payments processed through external providers. Your data is never stored.
        </Typography>
        <Typography variant="caption" sx={{ color: '#b0b0b0', display: 'block', mt: 1 }}>
          📊 <strong>Supported Methods:</strong> Credit/Debit cards (Stripe) | Bitcoin, Ethereum, USDC & more (Coinbase)
        </Typography>
      </Box>
    </JerryTheme>
  );
}