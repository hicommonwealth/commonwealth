import { useLoginWithSms } from '@privy-io/react-auth';

import { useEffect, useMemo } from 'react';
import { useConnectedWallet } from 'views/components/PrivyTest/useConnectedWallet';
import { usePrivySignOn } from 'views/components/PrivyTest/usePrivySignOn';

type UsePrivySMS = {
  onSuccess: (address: string, isNewlyCreated: boolean) => void;
  onError: (err: Error) => void;
};

export function usePrivySMS(props: UsePrivySMS) {
  const { onSuccess, onError } = props;
  const { sendCode, loginWithCode } = useLoginWithSms();
  const privySignOn = usePrivySignOn();
  const wallet = useConnectedWallet();

  useEffect(() => {
    async function doAsync() {
      if (wallet) {
        console.log('Trying to login...');
        await privySignOn({
          wallet,
          onSuccess,
          onError,
          ssoOAuthToken: undefined,
          ssoProvider: 'phone',
        });
      } else {
        console.warn('No wallet... ');
      }
    }

    doAsync().catch(onError);
  }, [onError, onSuccess, privySignOn, wallet]);

  return useMemo(() => {
    return {
      sendCode,
      loginWithCode,
    };
  }, [loginWithCode, sendCode]);
}
