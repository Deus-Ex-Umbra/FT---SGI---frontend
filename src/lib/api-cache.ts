type CacheEntry<T> = {
  promise: Promise<T>;
  timestamp: number;
};

const cache = new Map<string, CacheEntry<any>>();

export const fetchConCache = <T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlMs = 4000
): Promise<T> => {
  const ahora = Date.now();
  const cached = cache.get(key);

  if (cached && (ahora - cached.timestamp < ttlMs)) {
    return cached.promise;
  }

  const promise = fetchFn().catch((err) => {
    cache.delete(key);
    throw err;
  });

  cache.set(key, { promise, timestamp: ahora });
  return promise;
};

export const invalidarCache = (keyPattern?: string) => {
  if (!keyPattern) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.includes(keyPattern)) {
      cache.delete(key);
    }
  }
};
