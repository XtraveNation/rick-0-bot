import React, { useState } from 'react';
import { Button, Box, Typography, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import Web3 from 'web3';

const JerryTheme = styled(Paper)(({ theme }) => ({
  background: 'linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 50%, #f5f5f5 100%)',
  border: '2px solid #2196f3',
  boxShadow: '0 0 30px rgba(33,150,243,0.3)',
  color: '#333',
  padding: theme.spacing(4),
}));

function JerryTab() {
  const [tokenBudget, setTokenBudget] = useState(100000);
  const [connected, setConnected] = useState(false);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        setConnected(true);
      } catch (error) {
        console.error('Wallet connection error:', error);
      }
    } else {
      alert('Please install MetaMask!');
    }
  };

  const handleBuyTokens = async () => {
    try {
      const response = await fetch('/api/buy-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: '1' }),
      });
      const data = await response.json();
      if (data.success) alert(`Purchased ${data.tokensBought} tokens!`);
      else alert(data.error || 'Purchase failed');
    } catch (e) {
      alert('Failed to purchase tokens');
    }
  };

  return (
    <JerryTheme elevation={3}>
      <Typography variant="h4" gutterBottom align="center" sx={{ color: '#2196f3', textShadow: '0 0 10px rgba(33,150,243,0.5)' }}>
        📊 Jerry's Dashboard
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="body1" color="primary">Token Budget: {tokenBudget.toLocaleString()}</Typography>
        <Button variant="contained" color="primary" onClick={connectWallet} disabled={connected}>
          {connected ? 'Wallet Connected' : 'Connect Wallet'}
        </Button>
        <Button variant="contained" color="success" sx={{ mt: 1 }}>
          Buy Tokens
        </Button>
        <Typography variant="body2" sx={{ mt: 2 }}>
          Token efficiency layers (semantic cache, model cascading) are enabled.
        </Typography>
      </Box>
    </JerryTheme>
  );
}

export default JerryTab;