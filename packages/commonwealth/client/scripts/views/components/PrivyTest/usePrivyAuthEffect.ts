import { useCallback } from 'react';
import useUserStore from 'state/ui/user';
import { PrivyCallbacks } from 'views/components/PrivyTest/PrivyCallbacks';
import { useConnectedWallet } from 'views/components/PrivyTest/useConnectedWallet';
import { usePrivySignOn } from 'views/components/PrivyTest/usePrivySignOn';

/**
 * Provide JUST the logic we need in the useEffect.
 */
export function usePrivyAuthEffect(props: PrivyCallbacks) {
  const { onSuccess, onError } = props;
  const privySignOn = usePrivySignOn();
  const wallet = useConnectedWallet();
  const userStore = useUserStore();

  return useCallback(() => {
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
}
