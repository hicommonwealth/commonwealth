import {
  useLoginWithOAuth,
  useOAuthTokens,
  usePrivy,
} from '@privy-io/react-auth';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PrivyCallbacks } from 'views/components/PrivyTest/PrivyCallbacks';
import { usePrivyAuthEffect } from 'views/components/PrivyTest/usePrivyAuthEffect';

/**
 * Use privy auth with OAuth providers. Like google.
 */
export function usePrivyAuthWithOAuth(
  provider: 'google_oauth',
  props: PrivyCallbacks,
) {
  const { onError } = props;

  const [oAuthAccessToken, setOAuthAccessToken] = useState<string | undefined>(
    undefined,
  );
  const privyAuthEffect = usePrivyAuthEffect(props);
  const { authenticated, logout } = usePrivy();
  const { loading, initOAuth } = useLoginWithOAuth();

  useOAuthTokens({
    onOAuthTokenGrant: (params) => {
      console.log('FIXME: onOAuthTokenGrant', params);
      setOAuthAccessToken(params.oAuthTokens.accessToken);
    },
  });

  useEffect(() => {
    if (!oAuthAccessToken) {
      console.log('FIXME: No oAuthAccessToken');
      return;
    }

    privyAuthEffect(provider, oAuthAccessToken);
  }, [oAuthAccessToken, privyAuthEffect, provider]);

  const onInitOAuth = useCallback(() => {
    async function doAsync() {
      console.log("FIXME: onInitOAuth: 'google_oauth'");
      await initOAuth({ provider: 'google' });
    }

    doAsync().catch((err) => {
      console.error(err);
      onError(err);
    });
  }, [initOAuth, onError]);

  return useMemo(() => {
    return { onInitOAuth, authenticated, logout, loading };
  }, [authenticated, logout, onInitOAuth, loading]);
}
