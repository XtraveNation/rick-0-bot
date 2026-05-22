import { useState, useEffect, useCallback } from 'react';

export default function useTokens(sessionId) {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tokens/balance?session_id=${encodeURIComponent(sessionId)}`);
      const json = await res.json();
      setBalance(json.balance);
    } catch (e) {
      console.warn('Failed to fetch token balance', e);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const consume = useCallback(async (amount) => {
    if (!sessionId) throw new Error('Missing sessionId');
    const res = await fetch('/api/tokens/consume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, amount })
    });
    if (res.status === 402) {
      const json = await res.json();
      setBalance(json.balance);
      return { success: false, message: json.message };
    }
    const json = await res.json();
    setBalance(json.balance);
    return json;
  }, [sessionId]);

  useEffect(() => { fetchBalance(); }, [fetchBalance]);

  return { balance, loading, fetchBalance, consume };
}
