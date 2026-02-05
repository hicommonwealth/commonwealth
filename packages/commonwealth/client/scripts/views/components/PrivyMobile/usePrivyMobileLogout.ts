import { useCallback } from 'react';

type Input = {
  error?: string;
};

/**
 * Legacy mobile app logout hook (no-op on web).
 */
export function usePrivyMobileLogout() {
  return useCallback((_input: Input): Promise<{}> => {
    return Promise.resolve({});
  }, []);
}
