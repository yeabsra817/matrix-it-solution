'use client';

import { useEffect, useState, useCallback } from 'react';

export function useAutoRefresh(intervalMs = 30000) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return tick;
}

export function useFetch<T>(
  fetcher: () => Promise<{ success: boolean; data?: T; message?: string }>,
  deps: unknown[] = [],
  refreshInterval = 30000
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tick = useAutoRefresh(refreshInterval);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetcher();
    if (result.success && result.data !== undefined) {
      setData(result.data);
    } else {
      setError(result.message || 'Something went wrong, please try again');
    }
    setLoading(false);
  }, [fetcher]);

  useEffect(() => {
    refetch();
  }, [...deps, tick, refetch]);

  return { data, loading, error, refetch };
}
