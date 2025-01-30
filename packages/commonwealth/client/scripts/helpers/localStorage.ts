export const REFCODE_EXPIRATION_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export enum LocalStorageKeys {
  ReferralCode = 'common-refcode',
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
