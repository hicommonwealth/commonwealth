type TTLCacheEntry = {
  cacheKey: string;
  cacheValue: any;
  expiresAt: number;
};

const isEntryExpired = (entry: TTLCacheEntry): boolean => {
  return Date.now() >= entry.expiresAt;
};

const makeStorageKey = (namespace: string, cacheKey: string): string => {
  return `cw-cache-${namespace}-${cacheKey}`;
};

// TTLCache is a simple key/value store with expiring pairs, backed by local storage
export class TTLCache {
  constructor(private ttl: number, private namespace: string) {}

  public set(cacheKey: string, cacheValue: any) {
    const key = makeStorageKey(this.namespace, cacheKey);
    const value = JSON.stringify({
      cacheKey,
      cacheValue,
      expiresAt: Date.now() + this.ttl,
    });
    localStorage.setItem(key, value);
  }

  public get(cacheKey: string): any | null {
    const entry = localStorage.getItem(
      makeStorageKey(this.namespace, cacheKey)
    );
    if (!entry) {
      return null;
    }
    const parsedEntry = JSON.parse(entry) as TTLCacheEntry;
    if (isEntryExpired(parsedEntry)) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    return parsedEntry.cacheValue;
  }
}
