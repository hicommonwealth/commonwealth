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
  console.log('oAuthAccessToken in usePrivyAuthWithOAuth', props);
  const privyAuthEffect = usePrivyAuthEffect(props);
  const { authenticated, logout, user } = usePrivy();
  const { loading, initOAuth } = useLoginWithOAuth();
  const providerRef = useRef<OAuthProvider | undefined>(undefined);

  useOAuthTokens({
    onOAuthTokenGrant: (params) => {
      console.log(
        '[DEBUG] usePrivyAuthWithOAuth - OAuth token granted:',
        params,
      );
      setOAuthAccessToken(params.oAuthTokens.accessToken);
    },
  });

  useEffect(() => {
    console.log('[DEBUG] usePrivyAuthWithOAuth - effect triggered');
    console.log(
      '[DEBUG] usePrivyAuthWithOAuth - oAuthAccessToken:',
      !!oAuthAccessToken,
    );
    console.log(
      '[DEBUG] usePrivyAuthWithOAuth - providerRef.current:',
      providerRef.current,
    );
    console.log(
      '[DEBUG] usePrivyAuthWithOAuth - authenticated:',
      authenticated,
    );
    console.log('[DEBUG] usePrivyAuthWithOAuth - user:', user);

    if (!oAuthAccessToken) {
      console.log('[DEBUG] usePrivyAuthWithOAuth - no OAuth access token yet');
      return;
    }

    if (!providerRef.current) {
      console.warn('[DEBUG] usePrivyAuthWithOAuth - No provider set');
      return;
    }

    const ssoProvider = toSignInProvider(providerRef.current);
    console.log(
      '[DEBUG] usePrivyAuthWithOAuth - calling privyAuthEffect with provider:',
      ssoProvider,
    );
    privyAuthEffect(ssoProvider, oAuthAccessToken);
  }, [oAuthAccessToken, privyAuthEffect, authenticated, user]);

  const onInitOAuth = useCallback(
    (provider: OAuthProvider | WalletSsoSource) => {
      async function doAsync() {
        console.log(
          '[DEBUG] usePrivyAuthWithOAuth - onInitOAuth called with provider:',
          provider,
        );

        if (isOauthProvider(provider)) {
          providerRef.current = provider;
          console.log(
            '[DEBUG] usePrivyAuthWithOAuth - initOAuth provider set to:',
            provider,
          );

          // Clear any existing OAuth access token to prevent stale data
          setOAuthAccessToken(undefined);

          await initOAuth({ provider });
          console.log(
            '[DEBUG] usePrivyAuthWithOAuth - initOAuth completed for provider:',
            provider,
          );
        } else {
          console.error(
            '[DEBUG] usePrivyAuthWithOAuth - Invalid provider for OAuth:',
            provider,
          );
          throw new Error('OAuth provider expected, got: ' + provider);
        }
      }

      doAsync().catch((err) => {
        console.error(
          '[DEBUG] usePrivyAuthWithOAuth - OAuth initialization failed:',
          err,
        );
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
