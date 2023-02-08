import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';

export function NavigationWrapper(Component) {
  return (props) => {
    const navigate = useNavigate();
    return <Component {...props} navigate={navigate} />;
  };
}

// Fn is the function you want to debounce, delay is the amount of time in milliseconds
// to wait before calling the function, and dependencies is an array of dependencies that
// the hook should monitor for changes (if needed). The hook returns a debounced version of fn that is
// called with a delay of milliseconds whenever the user scrolls. The hook uses the
// useEffect hook to manage the debouncing.

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
