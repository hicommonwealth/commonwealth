export const REFCODE_EXPIRATION_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export enum LocalStorageKeys {
  ReferralCode = 'common-refcode',
  HasSeenOnboarding = 'has-seen-onboarding',
  HasSeenNotifications = 'has-seen-notifications',
  DarkModeState = 'dark-mode-state',
}

export const getLocalStorageItem = (key: LocalStorageKeys) => {
  const stored = localStorage.getItem(key);

  if (!stored) {
    return null;
  }

  const item = JSON.parse(stored);

  if (new Date().getTime() > item.expires) {
    localStorage.removeItem(key);
    return null;
  }

  return item.value;
};

export const setLocalStorageItem = (
  key: LocalStorageKeys,
  value: string,
  expirationMs?: number,
) => {
  const stored = getLocalStorageItem(key);

  if (key === LocalStorageKeys.ReferralCode && stored) {
    return;
  }

  const item: { value: string; expires?: number } = { value };

  if (expirationMs) {
    const expirationDate = new Date();
    expirationDate.setTime(expirationDate.getTime() + expirationMs);
    item.expires = expirationDate.getTime();
  }

  localStorage.setItem(key, JSON.stringify(item));
};

export const removeLocalStorageItem = (key: LocalStorageKeys) => {
  localStorage.removeItem(key);
};

// Defaults will clear all items in localStorage older than 10 minutes.
// This only removes items from localStorage; it does not clear in-memory stores.
export const clearLocalStorage = (
  prefix = 'cwstore',
  maxAge: number = 10 * 60 * 1000,
) => {
  if (!localStorage) {
    throw new Error('cannot clear localStorage, not found!');
  }

  console.log(
    `Clearing localStorage of items with prefix "${prefix}", older than ${
      maxAge / (60 * 1000)
    } minutes...`,
  );
  const now = Date.now();
  let nCleared = 0;
  const nItems = localStorage.length;

  for (let i = 0; i < nItems; ++i) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      const storageItem: { timestamp: number } = JSON.parse(
        // @ts-expect-error StrictNullChecks
        localStorage.getItem(key),
      );
      if (now - storageItem.timestamp > maxAge) {
        localStorage.removeItem(key);
        nCleared++;

        // decrement loop counter on remove, because the removal changes the length of the map
        --i;
      }
    }
  }
  console.log(
    `Viewed ${nItems} items in localStorage and cleared ${nCleared}.`,
  );
};
