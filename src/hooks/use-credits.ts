'use client';

import { createClient } from '@/lib/supabase/client';
import type { CreditBalance } from '@/types/database';
import { useCallback, useEffect, useState } from 'react';

export function useCredits() {
  const [credits, setCredits] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchCredits = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('credit_balances')
      .select('*')
      .eq('user_id', user.id)
      .single();

    setCredits(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  return { credits, loading, refresh: fetchCredits };
}
