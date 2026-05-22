import React, { useState } from 'react';
import { Button, TextField, Box, Typography, Paper } from '@mui/material';
import TokenBudget from './components/TokenBudget';
import MortyTasks from './components/MortyTasks';
import useTokens from './hooks/useTokens';
import { styled } from '@mui/material/styles';

const RickTheme = styled(Paper)(({ theme }) => ({
  background: 'linear-gradient(135deg, #0d1525 0%, #1a1a2e 50%, #16213e 100%)',
  border: '2px solid #D4AF37',
  boxShadow: '0 0 30px rgba(212, 175, 55, 0.3), inset 0 0 30px rgba(212, 175, 55, 0.1)',
  color: '#F0EAD6',
  padding: theme.spacing(4),
}));

function RickTab() {
  const sessionId = 'session-demo-1';
  const { balance, loading, consume } = useTokens(sessionId);

  const [messages, setMessages] = useState([
    { role: 'system', content: "I'm Rick Sanchez — the smartest man in the universe. What do you need?" }
  ]);
  const [input, setInput] = useState('');

  const sendMessage = async () => {
    if (!input.trim()) return;

    // try to consume tokens first (5 tokens per message)
    try {
      const charge = await consume(5);
      if (!charge || (charge.success === false)) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Not enough tokens. Please top up.' }]);
        return;
      }
    } catch (e) {
      console.warn('Token consume error', e);
    }

    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');

    try {
      // Store message with Jerry
      await fetch('/api/jerry/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, role: 'user', content: input, tokens_used: 5 })
      });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: sessionId, role: 'user', content: input }),
      });
      const data = await response.json();
      const assistantText = data.content || 'Wubba lubba dub dub!';

      // Store assistant response
      await fetch('/api/jerry/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, role: 'assistant', content: assistantText, tokens_used: 5 })
      });

      setMessages([...newMessages, { role: 'assistant', content: assistantText }]);
    } catch (err) {
      console.error('Chat error', err);
      setMessages([...newMessages, { role: 'assistant', content: 'API error — need a backend running!' }]);
    }
  };

  return (
    <RickTheme elevation={3}>
      <Typography variant="h4" gutterBottom align="center" sx={{ color: '#D4AF37', textShadow: '0 0 10px rgba(212,175,55,0.5)' }}>
        🤖 Rick AI — Multiverse Chat
      </Typography>

      <TokenBudget balance={balance} loading={loading} />

      <MortyTasks sessionId={sessionId} onResult={(m) => setMessages(prev => [...prev, m])} />

      <Box sx={{ display: 'flex', flexDirection: 'column', height: 450, gap: 2 }}>
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: 'rgba(0,0,0,0.3)', borderRadius: 2 }}>
          {messages.map((msg, i) => (
            <Typography key={i} variant={msg.role === 'system' ? 'body2' : 'body1'} gutterBottom sx={{ color: msg.role === 'user' ? '#81C784' : msg.role === 'assistant' ? '#D4AF37' : '#90CAF9' }}>
              <strong>{msg.role === 'user' ? '🧑 You' : msg.role === 'assistant' ? '🔬 Rick' : '⚙️ System'}:</strong> {msg.content}
            </Typography>
          ))}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField fullWidth label="Ask Rick anything..." variant="outlined" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} sx={{ input: { color: '#F0EAD6' }, fieldset: { borderColor: '#D4AF37' } }} />
          <Button variant="contained" onClick={sendMessage} sx={{ bgcolor: '#D4AF37', color: '#0d1525', '&:hover': { bgcolor: '#b8962e' } }}>Send</Button>
        </Box>
      </Box>
    </RickTheme>
  );
}

export default RickTab;