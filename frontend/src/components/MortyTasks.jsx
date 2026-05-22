import React, { useState, useEffect } from 'react';
import { Box, Button, Select, MenuItem, TextField, Typography, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

const Panel = styled(Paper)(({ theme }) => ({ padding: theme.spacing(2), marginTop: theme.spacing(2) }));

export default function MortyTasks({ sessionId, onResult }) {
  const [agents, setAgents] = useState([]);
  const [selected, setSelected] = useState('');
  const [inputText, setInputText] = useState('{}');
  const [output, setOutput] = useState(null);

  useEffect(() => { fetchAgents(); }, []);

  async function fetchAgents() {
    try {
      const res = await fetch('/api/morty/agents');
      const json = await res.json();
      setAgents(json.agents || []);
      if ((json.agents || []).length > 0) setSelected(json.agents[0].name);
    } catch (e) {
      console.warn('Failed to fetch agents', e);
    }
  }

  async function executeAgent() {
    if (!selected) return;
    let parsed = {};
    try { parsed = JSON.parse(inputText); } catch (e) { setOutput({ error: 'Input must be valid JSON' }); return; }

    try {
      const res = await fetch('/api/morty/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, agent: selected, input: parsed })
      });

      const json = await res.json();
      setOutput(json);
      if (onResult && json && json.output) {
        onResult({ role: 'assistant', content: JSON.stringify({ morty: selected, result: json.output }) });
      }
    } catch (err) {
      console.error('Execute error', err);
      setOutput({ error: 'Execution failed' });
    }
  }

  return (
    <Panel elevation={2}>
      <Typography variant="h6" sx={{ color: '#D4AF37' }}>Morty Agents</Typography>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}>
        <Select value={selected} onChange={(e) => setSelected(e.target.value)} sx={{ minWidth: 200 }}>
          {agents.map(a => <MenuItem key={a.name} value={a.name}>{a.name}</MenuItem>)}
        </Select>
        <Button variant="contained" onClick={executeAgent} sx={{ bgcolor: '#D4AF37', color: '#0d1525' }}>Execute</Button>
      </Box>

      <TextField label="Input (JSON)" multiline fullWidth minRows={3} value={inputText} onChange={(e) => setInputText(e.target.value)} sx={{ mt: 2 }} />

      {output && (
        <Box sx={{ mt: 2, p: 1, bgcolor: 'rgba(0,0,0,0.4)', borderRadius: 1 }}>
          <Typography variant="subtitle2" sx={{ color: '#D4AF37' }}>Output</Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{typeof output === 'string' ? output : JSON.stringify(output, null, 2)}</Typography>
        </Box>
      )}
    </Panel>
  );
}
