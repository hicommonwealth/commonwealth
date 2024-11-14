import { useEffect, useState } from 'react';

function usePrefersColorScheme() {
  const getSystemPreference = () =>
    window?.matchMedia('(prefers-color-scheme: light)').matches;

  const [isLightMode, setIsLightMode] = useState(getSystemPreference);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');

    const handleChange = (event: MediaQueryListEvent) => {
      setIsLightMode(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isLightMode;
}

export default usePrefersColorScheme;
