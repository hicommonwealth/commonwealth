const KEY_VERSION = 'v2'; // update this for breaking changes
const PREFIX = `cw-draft-${KEY_VERSION}`;

const MAX_DRAFT_SIZE = 1024 * 1024 * 4;

export function useDraft<T>(key: string) {
  const fullKey = `${PREFIX}-${key}`;

  const saveDraft = (data: T) => {
    const draft = JSON.stringify(data);
    if (draft.length > MAX_DRAFT_SIZE) {
      return;
    }
    localStorage.setItem(fullKey, draft);
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
