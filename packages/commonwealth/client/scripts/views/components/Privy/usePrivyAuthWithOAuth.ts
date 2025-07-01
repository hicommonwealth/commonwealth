import { WalletSsoSource } from '@hicommonwealth/shared';
import { useLoginWithOAuth, usePrivy } from '@privy-io/react-auth';
import { useUserStore } from 'client/scripts/state/ui/user/user';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { toSignInProvider } from 'views/components/Privy/helpers';
import { PrivyCallbacks } from 'views/components/Privy/PrivyCallbacks';
import { OAuthProvider } from './types';
import { useConnectedWallet } from './useConnectedWallet';
import { usePrivySignOn } from './usePrivySignOn';

const WALLET_WAIT_TIMEOUT = 5000;
const WALLET_POLL_INTERVAL = 100;

/**
 * Use privy auth with OAuth providers. Like google.
 */
export function usePrivyAuthWithOAuth(props: PrivyCallbacks) {
  const { onError } = props;

  const privy = usePrivy();
  const wallet = useConnectedWallet();
  const userStore = useUserStore();
  const privySignOn = usePrivySignOn();

  const privyRef = useRef(privy);
  const walletRef = useRef(wallet);

  useEffect(() => {
    privyRef.current = privy;
  }, [privy]);

  useEffect(() => {
    walletRef.current = wallet;
  }, [wallet]);

  const waitForWallet = useCallback(async (): Promise<boolean> => {
    if (walletRef.current) return true;

    let waitTime = 0;
    while (!walletRef.current && waitTime < WALLET_WAIT_TIMEOUT) {
      await new Promise((resolve) => setTimeout(resolve, WALLET_POLL_INTERVAL));
      waitTime += WALLET_POLL_INTERVAL;
    }

    return !!walletRef.current;
  }, []);

  const handleOAuthComplete = useCallback(
    async (params: any) => {
      if (userStore.isLoggedIn) return;

      const accessToken = await privy.getAccessToken();
      if (!accessToken) {
        console.warn('No access token.');
        return;
      }

      const ssoProvider = toSignInProvider(params.loginMethod as OAuthProvider);

      const walletAvailable = await waitForWallet();
      if (!walletAvailable) {
        props.onError(new Error('Wallet not available'));
        return;
      }

      const currentWallet = walletRef.current;
      if (!currentWallet) {
        console.warn('No wallet available');
        return;
      }

      await privySignOn({
        wallet: currentWallet,
        onSuccess: props.onSuccess,
        onError: props.onError,
        ssoOAuthToken: accessToken,
        ssoProvider,
      });
    },
    [privy, userStore.isLoggedIn, privySignOn, props, waitForWallet],
  );

  const { loading, initOAuth } = useLoginWithOAuth({
    onComplete: handleOAuthComplete,
  });

  const providerRef = useRef<OAuthProvider | undefined>(undefined);

  const onInitOAuth = useCallback(
    (provider: OAuthProvider | WalletSsoSource) => {
      async function doAsync() {
        if (isOauthProvider(provider)) {
          providerRef.current = provider;
          await initOAuth({ provider });
        } else {
          throw new Error('Not supported: ' + provider);
        }
      }

      doAsync().catch((err) => {
        console.error(err);
        onError(err);
      });
    },
    [initOAuth, onError],
  );

  return useMemo(() => {
    return {
      onInitOAuth,
      authenticated: privy.authenticated,
      logout: privy.logout,
      loading,
    };
  }, [privy.authenticated, privy.logout, onInitOAuth, loading]);
}

function isOauthProvider(
  value: WalletSsoSource | OAuthProvider,
): value is OAuthProvider {
  switch (value) {
    case 'google':
    case 'github':
    case 'discord':
    case 'twitter':
    case 'apple':
      return true;
    default:
      return false;
  }
}
