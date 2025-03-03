import { useState } from 'react';

const LOCALSTORAGE_KEY = 'hasMobileAppOnboarded';

/**
 * Basic hook so we can see if we have been onboarded, and a function to set it
 * to true when we HAVE been onboarded.
 */
export function useMobileAppOnboarding() {
  const [hasOnboarded, setHasOnboarded] = useState(
    localStorage.getItem(LOCALSTORAGE_KEY) === 'true',
  );

  const changeOnboarded = (value: boolean) => {
    localStorage.setItem(LOCALSTORAGE_KEY, value.toString());
    setHasOnboarded(value);
  };

  return [hasOnboarded, changeOnboarded];
}
