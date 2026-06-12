import { useState, useEffect, useCallback } from 'react';
import { fetchConCache } from '@/lib/api-cache';

export const useApiQuery = <T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  options?: { ttlMs?: number; enabled?: boolean }
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(options?.enabled !== false);
  const [error, setError] = useState<Error | null>(null);

  const ejecutar = useCallback(async (forzar = false) => {
    setLoading(true);
    setError(null);
    try {
      const resultado = await fetchConCache(cacheKey, fetchFn, forzar ? 0 : options?.ttlMs);
      setData(resultado);
      return resultado;
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cacheKey, fetchFn, options?.ttlMs]);

  useEffect(() => {
    if (options?.enabled !== false) {
      void ejecutar();
    }
  }, [ejecutar, options?.enabled]);

  return { data, loading, error, refetch: () => ejecutar(true), setData };
};
