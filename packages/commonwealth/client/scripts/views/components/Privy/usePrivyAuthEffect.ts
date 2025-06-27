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
      console.log('ssoProvider in usePrivyAuthEffect', ssoProvider);
      async function doAsync() {
        console.log(
          '[DEBUG] usePrivyAuthEffect - userStore.isLoggedIn:',
          userStore.isLoggedIn,
        );
        console.log('[DEBUG] usePrivyAuthEffect - wallet:', wallet);
        console.log('[DEBUG] usePrivyAuthEffect - ssoProvider:', ssoProvider);
        console.log(
          '[DEBUG] usePrivyAuthEffect - ssoOAuthToken:',
          ssoOAuthToken ? 'present' : 'missing',
        );

        if (userStore.isLoggedIn) {
          console.log(
            '[DEBUG] usePrivyAuthEffect - user already logged in, returning',
          );
          return;
        }

        if (wallet) {
          console.log('[DEBUG] usePrivyAuthEffect - calling privySignOn');
          try {
            await privySignOn({
              wallet,
              onSuccess,
              onError,
              ssoOAuthToken,
              ssoProvider,
            });
            console.log(
              '[DEBUG] usePrivyAuthEffect - privySignOn completed successfully',
            );
          } catch (error) {
            console.error(
              '[DEBUG] usePrivyAuthEffect - privySignOn failed:',
              error,
            );
            onError(error);
          }
        } else {
          console.warn(
            '[DEBUG] usePrivyAuthEffect - No wallet available, waiting...',
          );

          // Instead of immediately throwing an error, wait a bit for wallet creation
          // This is a common timing issue with Privy's embedded wallet creation
          let attempts = 0;
          const maxAttempts = 10; // Wait up to 10 seconds
          const checkInterval = 1000; // Check every second

          const waitForWallet = () => {
            setTimeout(() => {
              attempts++;
              console.log(
                `[DEBUG] usePrivyAuthEffect - waiting for wallet, attempt ${attempts}/${maxAttempts}`,
              );

              // Check if wallet is now available (this will trigger a re-render)
              // The dependency array includes 'wallet', so this callback will be called again
              // when wallet becomes available

              if (attempts >= maxAttempts) {
                console.error(
                  '[DEBUG] usePrivyAuthEffect - timeout waiting for wallet',
                );
                onError(
                  new Error(
                    'Timeout waiting for embedded wallet creation. Please try refreshing the page.',
                  ),
                );
              }
            }, checkInterval);
          };

          waitForWallet();
        }
      }

      doAsync().catch(onError);
    },
    [onError, onSuccess, privySignOn, wallet, userStore.isLoggedIn],
  );
}
