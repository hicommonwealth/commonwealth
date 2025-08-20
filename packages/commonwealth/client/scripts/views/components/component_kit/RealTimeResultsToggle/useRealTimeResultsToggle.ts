import { useEffect, useState } from 'react';
import { RealTimeToggleLocalStorageKeys } from './types';

type useRealTimeResultsToggleProps = {
  localStorageKey?: RealTimeToggleLocalStorageKeys;
};

const useRealTimeResultsToggle = ({
  localStorageKey,
}: useRealTimeResultsToggleProps) => {
  const [isRealTime, setIsRealTime] = useState(
    localStorageKey && localStorage.getItem(localStorageKey) === `true`,
  );

  useEffect(() => {
    const newValue = isRealTime ? `true` : `false`;
    if (localStorageKey && localStorage.getItem(localStorageKey) !== newValue) {
      localStorage.setItem(localStorageKey, newValue);
    }
  }, [localStorageKey, isRealTime]);

  return {
    isRealTime,
    setIsRealTime,
  };
};

export default useRealTimeResultsToggle;
