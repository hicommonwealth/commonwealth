import { LocalStorageKeys } from 'helpers/localStorage';
import { useCallback, useState } from 'react';

/**
 * Basic hook so we can see if we have been onboarded, and a function to set it
 * to true when we HAVE been onboarded.
 */
export function useMobileAppOnboarding(): [boolean, (value: boolean) => void] {
  const [hasOnboarded, setHasOnboarded] = useState(
    localStorage.getItem(LocalStorageKeys.HasMobileAppOnboarded) === 'true',
  );

  const changeOnboarded = useCallback((value: boolean) => {
    localStorage.setItem(
      LocalStorageKeys.HasMobileAppOnboarded,
      value.toString(),
    );
    setHasOnboarded(value);
  }, []);

  return [hasOnboarded, changeOnboarded];
}
