const MAX_DRAFT_SIZE = 1024 * 1024 * 4;

type DraftOpts = {
  keyVersion: string;
};

export function useDraft<T>(
  key: string,
  opts: DraftOpts = { keyVersion: 'v2' },
) {
  const keyVersion = opts.keyVersion;
  const prefix = `cw-draft-${keyVersion}`;

  const fullKey = `${prefix}-${key}`;

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
