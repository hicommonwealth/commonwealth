import { WalletSsoSource } from '@hicommonwealth/shared';
import {
  useLoginWithOAuth,
  useOAuthTokens,
  usePrivy,
} from '@privy-io/react-auth';
import { useUserStore } from 'client/scripts/state/ui/user/user';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toSignInProvider } from 'views/components/Privy/helpers';
import { PrivyCallbacks } from 'views/components/Privy/PrivyCallbacks';
import { OAuthProvider } from './types';
import { useConnectedWallet } from './useConnectedWallet';
import { usePrivySignOn } from './usePrivySignOn';

const WALLET_WAIT_TIMEOUT = 5000;
const WALLET_POLL_INTERVAL = 100;
const OAUTH_TOKEN_WAIT_TIMEOUT = 5000;
const OAUTH_TOKEN_POLL_INTERVAL = 100;

/**
 * Use privy auth with OAuth providers. Like google.
 */
export function usePrivyAuthWithOAuth(props: PrivyCallbacks) {
  const { onError } = props;

  const privy = usePrivy();
  const wallet = useConnectedWallet();
  const userStore = useUserStore();
  const privySignOn = usePrivySignOn();

  const [oAuthTokens, setOAuthTokens] = useState<Record<string, string>>({});

  const privyRef = useRef(privy);
  const walletRef = useRef(wallet);
  const oAuthTokensRef = useRef(oAuthTokens);

  useEffect(() => {
    privyRef.current = privy;
  }, [privy]);

  useEffect(() => {
    walletRef.current = wallet;
  }, [wallet]);

  useEffect(() => {
    oAuthTokensRef.current = oAuthTokens;
  }, [oAuthTokens]);

  useOAuthTokens({
    onOAuthTokenGrant: ({ oAuthTokens: tokens, user }) => {
      setOAuthTokens((prev) => ({
        ...prev,
        [tokens.provider]: tokens.accessToken,
      }));
    },
  });

  const waitForWallet = useCallback(async (): Promise<boolean> => {
    if (walletRef.current) return true;

    let waitTime = 0;
    while (!walletRef.current && waitTime < WALLET_WAIT_TIMEOUT) {
      await new Promise((resolve) => setTimeout(resolve, WALLET_POLL_INTERVAL));
      waitTime += WALLET_POLL_INTERVAL;
    }

    return !!walletRef.current;
  }, []);

  const waitForOAuthToken = useCallback(
    async (provider: string): Promise<string | null> => {
      if (oAuthTokensRef.current[provider])
        return oAuthTokensRef.current[provider];

      let waitTime = 0;
      while (
        !oAuthTokensRef.current[provider] &&
        waitTime < OAUTH_TOKEN_WAIT_TIMEOUT
      ) {
        await new Promise((resolve) =>
          setTimeout(resolve, OAUTH_TOKEN_POLL_INTERVAL),
        );
        waitTime += OAUTH_TOKEN_POLL_INTERVAL;
      }

      return oAuthTokensRef.current[provider] || null;
    },
    [],
  );

  const handleOAuthComplete = useCallback(
    async (params: any) => {
      if (userStore.isLoggedIn) return;

      const ssoProvider = toSignInProvider(params.loginMethod as OAuthProvider);

      // Wait for provider-specific OAuth token to be available
      const oAuthToken = await waitForOAuthToken(params.loginMethod);
      if (!oAuthToken) {
        props.onError(new Error('OAuth token not available'));
        return;
      }

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
        ssoOAuthToken: oAuthToken,
        ssoProvider,
      });
    },
    [
      userStore.isLoggedIn,
      privySignOn,
      props,
      waitForWallet,
      waitForOAuthToken,
    ],
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

          window.history.pushState(null, '', '/sign-in');

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
