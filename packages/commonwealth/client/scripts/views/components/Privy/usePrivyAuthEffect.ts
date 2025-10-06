import { useCallback } from 'react';
import useUserStore from 'state/ui/user';
import { PrivyCallbacks } from 'views/components/Privy/PrivyCallbacks';
import { PrivySignInSSOProvider } from 'views/components/Privy/types';
import { useConnectedWallet } from 'views/components/Privy/useConnectedWallet';
import { usePrivySignOn } from 'views/components/Privy/usePrivySignOn';

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
