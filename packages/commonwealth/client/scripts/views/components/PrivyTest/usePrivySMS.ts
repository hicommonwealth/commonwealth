import { useLoginWithSms } from '@privy-io/react-auth';

import { useCallback, useMemo } from 'react';

export function usePrivySMS() {
  const { sendCode } = useLoginWithSms();

  const onPrivySMS = useCallback(
    async (phoneNumber: string) => {
      await sendCode({ phoneNumber });
    },
    [sendCode],
  );

  return useMemo(() => {
    return {
      onPrivySMS,
    };
  }, [onPrivySMS]);
}
