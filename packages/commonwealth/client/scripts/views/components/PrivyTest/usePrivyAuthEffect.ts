import { useCallback } from 'react';
import useUserStore from 'state/ui/user';
import { PrivyCallbacks } from 'views/components/PrivyTest/PrivyCallbacks';
import { PrivySignInSSOProvider } from 'views/components/PrivyTest/types';
import { useConnectedWallet } from 'views/components/PrivyTest/useConnectedWallet';
import { usePrivySignOn } from 'views/components/PrivyTest/usePrivySignOn';

/**
 * Provide JUST the logic we need in the useEffect.
 *
 * You then just wrap this with useEffect so when the dependencies change, it
 * automatically gets called.
 */
export function usePrivyAuthEffect(props: PrivyCallbacks) {
  const { onSuccess, onError } = props;
  const privySignOn = usePrivySignOn();
  const wallet = useConnectedWallet();
  const userStore = useUserStore();

  return useCallback(
    (
      ssoProvider: PrivySignInSSOProvider,
      ssoOAuthToken: string | undefined,
    ) => {
      async function doAsync() {
        if (userStore.isLoggedIn) {
          return;
        }

        if (wallet) {
          await privySignOn({
            wallet,
            onSuccess,
            onError,
            ssoOAuthToken,
            ssoProvider,
          });
        } else {
          console.warn('No wallet... ');
        }
      }

      doAsync().catch(onError);
    },
    [onError, onSuccess, privySignOn, wallet, userStore.isLoggedIn],
  );
}
