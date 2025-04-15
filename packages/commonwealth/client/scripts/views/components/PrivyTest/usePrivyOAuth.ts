import { ChainBase, WalletId } from '@hicommonwealth/shared';
import {
  useLoginWithOAuth,
  useOAuthTokens,
  usePrivy,
  useWallets,
} from '@privy-io/react-auth';
import { GenericEthereumWebWalletController } from 'controllers/app/webWallets/generic_ethereum_web_wallet';
import { getSessionFromWallet } from 'controllers/server/sessions';
import { useCallback, useState } from 'react';
import { useSignIn } from 'state/api/user';
import { useIdentityTokenRef } from 'views/components/PrivyTest/useIdentityTokenRef';
import { useSignMessageMemo } from 'views/components/PrivyTest/useSignMessageMemo';

type OnSuccess = {
  address: string;
};

type UsePrivyOAuthProps = {
  onSuccess: (success: OnSuccess) => void;
  onError: (err: Error) => void;
};

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
  const { authenticated, user, logout, createWallet } = usePrivy();
  const wallets = useWallets();
  const signMessage = useSignMessageMemo();
  const { signIn } = useSignIn();
  const identityTokenRef = useIdentityTokenRef();

  return useCallback(() => {
    async function doAsync() {
      if (!authenticated) {
        console.warn('No wallets');
        return;
      }

      if (!wallets.ready) {
        console.warn('Wallets not ready');
        return;
      }

      if (wallets.ready && wallets.wallets.length === 0) {
        console.warn('No wallets ... manually creating one.');
        await createWallet();
        return;
      }

      if (!oAuthAccessToken) {
        console.warn('No oAuthAccessToken');
        return;
      }

      const wallet = wallets.wallets[0];

      const ethereumProvider = async () => await wallet.getEthereumProvider();
      const signMessageProvider = async (message: string): Promise<string> => {
        const uiOptions = {
          title: 'Authenticate',
        };

        const { signature } = await signMessage({ message }, { uiOptions });
        return signature;
      };

      const webWallet = new GenericEthereumWebWalletController(
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
  }, [
    authenticated,
    wallets.ready,
    wallets.wallets,
    oAuthAccessToken,
    signIn,
    identityTokenRef,
    onSuccess,
    createWallet,
    signMessage,
  ]);
}
