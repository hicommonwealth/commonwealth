import { useEffect } from 'react';

/**
 * A wrapper around useEffect
 * ---
 * Prevents the callback inside useEffect from running unnecessarily
 * when the useEffect dependencies are constantly changing during
 * component render flow. Uses set/clear timeout with 0 delay to
 * add the provided callback to the task queue and clears the previous
 * timeout when the effect is called again quickly.
 *
 * WARNING! BE VERY CAREFUL when using this callback.
 *
 * The react-hooks eslint rules do not properly handle the dependency array.
 *
 * @deprecated Avoid using as this encourage incorrect hook usage/memoization.
 */
const useNecessaryEffect = (cb: () => any, deps: any[]) => {
  useEffect(() => {
    const timerId = setTimeout(cb);

    return () => clearTimeout(timerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps]);
};

export default useNecessaryEffect;
