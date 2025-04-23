import { useLoginWithEmail } from '@privy-io/react-auth';

import { useEffect, useMemo } from 'react';
import useUserStore from 'state/ui/user';
import { useConnectedWallet } from 'views/components/PrivyTest/useConnectedWallet';
import { usePrivySignOn } from 'views/components/PrivyTest/usePrivySignOn';

type UsePrivySMS = {
  onSuccess: (address: string, isNewlyCreated: boolean) => void;
  onError: (err: Error) => void;
};

export function usePrivyAuthWithEmail(props: UsePrivySMS) {
  const { onSuccess, onError } = props;
  const { sendCode, loginWithCode } = useLoginWithEmail();
  const privySignOn = usePrivySignOn();
  const wallet = useConnectedWallet();
  const userStore = useUserStore();
  console.log('userStore isLoggedIn', userStore.isLoggedIn);

  useEffect(() => {
    async function doAsync() {
      if (userStore.isLoggedIn) {
        console.log('userStore isLoggedIn');
        return;
      }

      if (wallet) {
        console.log('Trying to login...');
        await privySignOn({
          wallet,
          onSuccess,
          onError,
          ssoOAuthToken: undefined,
          ssoProvider: 'email',
        });
      } else {
        console.warn('No wallet... ');
      }
    }

    doAsync().catch(onError);
  }, [onError, onSuccess, privySignOn, wallet, userStore.isLoggedIn]);

  return useMemo(() => {
    return {
      sendCode,
      loginWithCode,
    };
  }, [loginWithCode, sendCode]);
}
