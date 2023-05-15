import React, { useEffect } from 'react';

/**
 * A wrapper around useEffect
 * ---
 * Prevents the callback inside useEffect from running unnecessarily
 * when the useEffect dependencies are constantly changing during
 * component render flow. Uses set/clear timeout with 0 delay to
 * add the provided callback to the task queue and clears the previous
 * timeout when the effect is called again quickly
 */
const useNecessaryEffect = (cb: () => any, deps: any[]) => {
  useEffect(() => {
    const timerId = setTimeout(cb);

    return () => clearTimeout(timerId);
  }, [...deps]);
};

export default useNecessaryEffect;
