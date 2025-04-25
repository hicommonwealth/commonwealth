import { WalletSsoSource } from '@hicommonwealth/shared';
import {
  useLoginWithOAuth,
  useOAuthTokens,
  usePrivy,
} from '@privy-io/react-auth';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PrivyCallbacks } from 'views/components/PrivyTest/PrivyCallbacks';
import { usePrivyAuthEffect } from 'views/components/PrivyTest/usePrivyAuthEffect';
import { OAuthProvider, toSignInProvider } from './types';

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
      console.log('FIXME: onOAuthTokenGrant', params);
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

    privyAuthEffect(toSignInProvider(providerRef.current), oAuthAccessToken);
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
