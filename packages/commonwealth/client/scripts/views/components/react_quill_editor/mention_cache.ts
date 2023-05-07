type MentionCacheEntry = {
  searchTerm: string;
  results: any;
  expiresAt: number;
};

const isEntryExpired = (entry: MentionCacheEntry): boolean => {
  return Date.now() >= entry.expiresAt;
};

const makeStorageKey = (searchTerm: string): string => {
  return `cw-cache-mention-${searchTerm}`;
};

// MentionCache is a simple key/value store for mention search term results
// stored in local storage
export class MentionCache {
  constructor(private ttl: number) {}

  public set(searchTerm: string, results: any) {
    const key = makeStorageKey(searchTerm);
    const value = JSON.stringify({
      searchTerm,
      results,
      expiresAt: Date.now() + this.ttl,
    });
    localStorage.setItem(key, value);
  }

  public get(searchTerm: string): any | null {
    const entry = localStorage.getItem(makeStorageKey(searchTerm));
    if (!entry) {
      return null;
    }
    const parsedEntry = JSON.parse(entry) as MentionCacheEntry;
    if (isEntryExpired(parsedEntry)) {
      return null;
    }
    return parsedEntry.results;
  }
}
