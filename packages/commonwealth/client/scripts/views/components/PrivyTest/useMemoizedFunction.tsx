import { useCallback, useRef } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useMemoizedFunction<Args extends any[], Output>(
  delegate: (...args: Args) => Output,
): (...args: Args) => Output {
  const delegateRef = useRef(delegate);
  delegateRef.current = delegate;

  return useCallback((...args: Args) => {
    return delegateRef.current(...args);
  }, []);
}
