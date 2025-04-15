import { ChainBase, WalletId } from '@hicommonwealth/shared';
import {
  useLoginWithOAuth,
  useOAuthTokens,
  usePrivy,
  useWallets,
} from '@privy-io/react-auth';
import { GenericEthereumWebWalletController } from 'controllers/app/webWallets/generic_ethereum_web_wallet';
import { getSessionFromWallet } from 'controllers/server/sessions';
import React, { useCallback, useEffect, useState } from 'react';
import { useSignIn } from 'state/api/user';
import { useIdentityTokenRef } from 'views/components/PrivyTest/useIdentityTokenRef';
import { useSignMessageMemo } from 'views/components/PrivyTest/useSignMessageMemo';

export const LoginWithGoogle = () => {
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
  const identityTokenRef = useIdentityTokenRef();
  const signMessage = useSignMessageMemo();
  const { signIn } = useSignIn();

  const handleLogin = async () => {
    try {
      // The user will be redirected to OAuth provider's login page
      await initOAuth({ provider: 'google' });
    } catch (err) {
      // Handle errors (network issues, validation errors, etc.)
      console.error(err);
    }
  };

  // FIXME: cleanup the depenedencies
  // FIXME: write a single callback function with all the parameters given...

  useEffect(() => {
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
          title: 'You are authenticating',
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

      console.log('FIXME: session: ', session);

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
    }

    doAsync().catch(console.error);
  }, [
    oAuthAccessToken,
    authenticated,
    signMessage,
    wallets.wallets,
    identityTokenRef,
    signIn,
    wallets.ready,
    createWallet,
  ]);

  // user must have an embedded wallet...
  const handleSignMessage = useCallback(() => {
    async function doAsync() {
      if (authenticated) {
        const uiOptions = {
          title: 'You are voting for foobar project',
        };
        const { signature } = await signMessage(
          { message: 'hello world' },
          { uiOptions },
        );
        console.log('FIXME: signature: ', signature);
      } else {
        console.log('FIXME: Not authenticated');
      }
    }

    doAsync().catch(console.error);
  }, [authenticated, signMessage]);

  const handleCreateWallet = useCallback(() => {
    async function doAsync() {
      const wallet = await createWallet();
    }

    doAsync().catch(console.error);
  }, [createWallet]);

  if (user) {
    return (
      <>
        <button onClick={logout} disabled={loading}>
          logout
        </button>
        <button onClick={handleSignMessage}>Sign Message</button>
        <button onClick={handleCreateWallet}>Create Wallet</button>
      </>
    );
  }

  return (
    <button onClick={handleLogin} disabled={loading}>
      {loading ? 'Logging in...' : 'Log in with Google'}
    </button>
  );
};
