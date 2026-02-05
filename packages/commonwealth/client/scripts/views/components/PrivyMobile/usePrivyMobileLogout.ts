import { useCallback } from 'react';

type Input = {
  error?: string;
};

/**
 * Legacy mobile app logout hook (no-op on web).
 */
export function usePrivyMobileLogout() {
  return useCallback(async (_input: Input): Promise<{}> => {
    return {};
  }, []);
}
