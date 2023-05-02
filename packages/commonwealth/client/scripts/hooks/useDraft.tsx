const KEY_VERSION = 'v2';
const PREFIX = `cw-draft-${KEY_VERSION}`;

export function useDraft<T>(key: string) {
  const fullKey = `${PREFIX}-${key}`;

  const saveDraft = (data: T) => {
    localStorage.setItem(fullKey, JSON.stringify(data));
  };

  const restoreDraft = (): T | null => {
    const data = localStorage.getItem(fullKey);
    if (!data) {
      return null;
    }
    return JSON.parse(data) as T;
  };

  const clearDraft = () => {
    localStorage.removeItem(fullKey);
  };

  return {
    saveDraft,
    restoreDraft,
    clearDraft,
  };
}
