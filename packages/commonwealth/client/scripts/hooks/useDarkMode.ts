import { useCallback, useEffect, useState } from 'react';

/**
 * Hook that will work with localStorage to detect if we're in dark mode and
 * support toggling back and forth.
 */
export function useDarkMode(): boolean {
  /**
   * Get the current state of dark mode from localStorage
   */
  const getCurrentState = useCallback(() => {
    if (typeof localStorage === 'undefined') {
      // needed for SSR
      return false;
    }

    return localStorage.getItem('dark-mode-state') === 'on';
  }, []);

  const [value, setValue] = useState(getCurrentState());

  const listener = useCallback(() => {
    const val = getCurrentState();
    setValue(val);
  }, [getCurrentState]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('storage', listener);

    return () => {
      window.removeEventListener('storage', listener);
    };
  });

  return value;
}
