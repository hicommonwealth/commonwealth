import { ChainBase, WalletId } from '@hicommonwealth/shared';
import {
  useLoginWithOAuth,
  useOAuthTokens,
  usePrivy,
  useWallets,
} from '@privy-io/react-auth';
import { PrivyEthereumWebWalletController } from 'controllers/app/webWallets/privy_ethereum_web_wallet';
import { getSessionFromWallet } from 'controllers/server/sessions';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSignIn } from 'state/api/user';
import { useIdentityTokenRef } from 'views/components/PrivyTest/useIdentityTokenRef';
import { useMemoizedFunction } from 'views/components/PrivyTest/useMemoizedFunction';
import { useSignMessageMemo } from 'views/components/PrivyTest/useSignMessageMemo';

type OnSuccess = {
  address: string;
};

type UsePrivyOAuthProps = {
  onSuccess: (success: OnSuccess) => void;
  onError: (err: Error) => void;
};

// TODO: I need to add support for isNewlyCreated
export function usePrivyOAuth(props: UsePrivyOAuthProps) {
  const { onSuccess, onError } = props;

  const [oAuthAccessToken, setOAuthAccessToken] = useState<string | undefined>(
    undefined,
  );

  useOAuthTokens({
    onOAuthTokenGrant: (params) => {
      setOAuthAccessToken(params.oAuthTokens.accessToken);
    },
  });

  const { loading, initOAuth } = useLoginWithOAuth();
  const wallets = useWallets();
  const walletsRef = useRef(wallets);
  walletsRef.current = wallets;

  const signMessage = useSignMessageMemo();
  const { signIn } = useSignIn();
  const identityTokenRef = useIdentityTokenRef();

  const privy = usePrivy();
  const { authenticated, logout } = privy;

  const createWallet = useMemoizedFunction(privy.createWallet);

  console.log(wallets);

  useEffect(() => {
    async function doAsync() {
      if (!authenticated) {
        console.warn('Not authenticated with privy');
        return;
      }

      if (!walletsRef.current.ready) {
        console.warn('Wallets not ready');
        return;
      }

      if (walletsRef.current.ready && walletsRef.current.wallets.length === 0) {
        // WARN: this CAN return no wallets, when the wallets are ready, but
        // the user STILL does have a connected wallet.
        console.warn('No wallets ... manually creating one.');
        await createWallet();
        return;
      }

      if (!oAuthAccessToken) {
        console.warn('No oAuthAccessToken');
        return;
      }

      const wallet = walletsRef.current.wallets[0];

      const ethereumProvider = async () => await wallet.getEthereumProvider();
      const signMessageProvider = async (message: string): Promise<string> => {
        const uiOptions = {
          title: 'Authenticate',
        };

        const { signature } = await signMessage({ message }, { uiOptions });
        return signature;
      };

      const webWallet = new PrivyEthereumWebWalletController(
        ethereumProvider,
        signMessageProvider,
      );

      await webWallet.enable();
      const session = await getSessionFromWallet(webWallet, {
        newSession: true,
      });

      // identityToken is privy identityToken
      // ssoOAuthToken is the access token you get back from whatever provider
      // you are using i.e. matches ssoProvider

      console.log('Attempting to auth... ');

      await signIn(session, {
        address: wallet.address,
        community_id: ChainBase.Ethereum,
        wallet_id: WalletId.Privy,
        privy: {
          identityToken: identityTokenRef.current!,
          ssoOAuthToken: oAuthAccessToken,
          ssoProvider: 'google_oauth',
        },
      });

      console.log('Authenticated successfully! ');
      onSuccess({ address: wallet.address });
    }

    doAsync().catch((err) => {
      console.error(err);
      onError(err);
    });

    // WARN: do not have signIn in the list of effects below.
  }, [
    authenticated,
    oAuthAccessToken,
    signIn,
    identityTokenRef,
    createWallet,
    signMessage,
    onError,
    onSuccess,
  ]);

  const onPrivyOAuth = useCallback(() => {
    async function doAsync() {
      await initOAuth({ provider: 'google' });
    }

    doAsync().catch((err) => {
      console.error(err);
      onError(err);
    });
  }, [initOAuth, onError]);

  return useMemo(() => {
    return { onPrivyOAuth, authenticated, logout, loading };
  }, [authenticated, logout, onPrivyOAuth, loading]);
}
