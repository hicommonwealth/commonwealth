const KEY_REFCODE = 'common-refcode';
const REFCODE_EXPIRATION_DAYS = 7;

export const getLocalStorageRefcode = () => {
  const stored = localStorage.getItem(KEY_REFCODE);

  if (!stored) {
    return null;
  }

  const item = JSON.parse(stored);

  if (new Date().getTime() > item.expires) {
    localStorage.removeItem(KEY_REFCODE);
    return null;
  }

  return item.value;
};

export const setLocalStorageRefcode = (refcode: string) => {
  const stored = getLocalStorageRefcode();

  if (stored) {
    console.log('Reflink already stored');
    return;
  }

  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + REFCODE_EXPIRATION_DAYS);

  localStorage.setItem(
    KEY_REFCODE,
    JSON.stringify({
      value: refcode,
      expires: expirationDate.getTime(),
    }),
  );
};
