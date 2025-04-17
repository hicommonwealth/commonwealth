import { useLoginWithSms } from '@privy-io/react-auth';

import { useCallback, useEffect, useMemo } from 'react';
import { useConnectedWallet } from 'views/components/PrivyTest/useConnectedWallet';
import { usePrivySignOn } from 'views/components/PrivyTest/usePrivySignOn';

type UsePrivySMS = {
  onSuccess: (address: string, isNewlyCreated: boolean) => void;
  onError: (err: Error) => void;
};

export function usePrivySMS(props: UsePrivySMS) {
  const { onSuccess, onError } = props;
  const { sendCode } = useLoginWithSms();
  const privySignOn = usePrivySignOn();
  const wallet = useConnectedWallet();

  const onPrivySMS = useCallback(
    async (phoneNumber: string) => {
      await sendCode({ phoneNumber });
    },
    [sendCode],
  );

  useEffect(() => {
    async function doAsync() {
      if (wallet) {
        await privySignOn({
          wallet,
          onSuccess,
          onError,
          ssoOAuthToken: undefined,
          ssoProvider: undefined,
        });
      }
    }

    doAsync().catch(onError);
  }, [onError, onSuccess, privySignOn, wallet]);

  return useMemo(() => {
    return {
      onPrivySMS,
    };
  }, [onPrivySMS]);
}
