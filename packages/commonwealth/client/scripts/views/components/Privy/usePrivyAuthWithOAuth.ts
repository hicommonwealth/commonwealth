import { WalletSsoSource } from '@hicommonwealth/shared';
import {
  useLoginWithOAuth,
  useOAuthTokens,
  usePrivy,
} from '@privy-io/react-auth';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toSignInProvider } from 'views/components/Privy/helpers';
import { PrivyCallbacks } from 'views/components/Privy/PrivyCallbacks';
import { usePrivyAuthEffect } from 'views/components/Privy/usePrivyAuthEffect';
import { OAuthProvider } from './types';

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
  const providerRef = useRef<OAuthProvider | undefined>(undefined);

  useOAuthTokens({
    onOAuthTokenGrant: (params) => {
      setOAuthAccessToken(params.oAuthTokens.accessToken);
    },
  });

  useEffect(() => {
    if (!oAuthAccessToken) {
      return;
    }

    if (!providerRef.current) {
      console.warn('No provider.');
      return;
    }
    const ssoProvider = toSignInProvider(providerRef.current);
    privyAuthEffect(ssoProvider, oAuthAccessToken);
  }, [oAuthAccessToken, privyAuthEffect]);

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
    return { onInitOAuth, authenticated, logout, loading };
  }, [authenticated, logout, onInitOAuth, loading]);
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
