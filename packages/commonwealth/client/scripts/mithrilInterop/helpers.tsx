import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';

export function NavigationWrapper(Component) {
  return (props) => {
    const navigate = useNavigate();
    return <Component {...props} navigate={navigate} />;
  };
}

export const useDebounceOnFunction = (fn, delay, dependencies) => {
  let timeoutId;

  const debouncedFn = (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };

  useEffect(() => {
    return () => {
      clearTimeout(timeoutId);
    };
  }, [...dependencies, debouncedFn]);

  return debouncedFn;
};
