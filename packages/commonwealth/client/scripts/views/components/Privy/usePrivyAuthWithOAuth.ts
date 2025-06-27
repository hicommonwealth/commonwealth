import { WalletSsoSource } from '@hicommonwealth/shared';
import {
  useLoginWithOAuth,
  useOAuthTokens,
  usePrivy,
} from '@privy-io/react-auth';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toSignInProvider } from 'views/components/Privy/helpers';
import {
  getPrivyActiveProvider,
  setPrivyActiveProvider,
} from 'views/components/Privy/privyActiveAuthStrategy';
import { PrivyCallbacks } from 'views/components/Privy/PrivyCallbacks';
import { usePrivyAuthEffect } from 'views/components/Privy/usePrivyAuthEffect';
import { OAuthProvider, PrivySignInSSOProvider } from './types';

/**
 * Use privy auth with OAuth providers. Like google.
 */
export function usePrivyAuthWithOAuth(props: PrivyCallbacks) {
  const { onError } = props;

  const [oAuthAccessToken, setOAuthAccessToken] = useState<string | undefined>(
    undefined,
  );
  const privyAuthEffect = usePrivyAuthEffect(props);
  const { authenticated, logout } = usePrivy();
  const { loading, initOAuth } = useLoginWithOAuth();

  useOAuthTokens({
    onOAuthTokenGrant: (params) => {
      setOAuthAccessToken(params.oAuthTokens.accessToken);
    },
  });

  useEffect(() => {
    if (!oAuthAccessToken) {
      return;
    }

    const activeProvider = getPrivyActiveProvider();
    if (activeProvider === null || !isOauthProvider(activeProvider)) {
      console.warn('No provider or wrong provider: ' + activeProvider);
      return;
    }
    const ssoProvider = toSignInProvider(activeProvider);
    console.log('FIXME trying to do auth with ' + ssoProvider);
    privyAuthEffect(ssoProvider, oAuthAccessToken);
  }, [oAuthAccessToken, privyAuthEffect]);

  const onInitOAuth = useCallback(
    (provider: OAuthProvider | WalletSsoSource) => {
      async function doAsync() {
        if (isOauthProvider(provider)) {
          setPrivyActiveProvider(toSignInProvider(provider));
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
    return { onInitOAuth, authenticated, logout, loading };
  }, [authenticated, logout, onInitOAuth, loading]);
}

function isOauthProvider(
  value: WalletSsoSource | OAuthProvider | PrivySignInSSOProvider,
): value is OAuthProvider {
  switch (value) {
    case 'google':
    case 'github':
    case 'discord':
    case 'twitter':
    case 'apple':
    case 'apple_oauth':
    case 'discord_oauth':
    case 'github_oauth':
    case 'google_oauth':
    case 'twitter_oauth':
      return true;
    default:
      return false;
  }
}
