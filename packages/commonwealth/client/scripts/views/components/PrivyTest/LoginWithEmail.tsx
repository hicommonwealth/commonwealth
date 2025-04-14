import { ChainBase, WalletId } from '@hicommonwealth/shared';
import { useLoginWithEmail, usePrivy, useWallets } from '@privy-io/react-auth';
import { GenericEthereumWebWalletController } from 'client/scripts/controllers/app/webWallets/generic_ethereum_web_wallet';
import { getSessionFromWallet } from 'controllers/server/sessions';
import React, { useCallback, useEffect, useState } from 'react';
import { useSignIn } from 'state/api/user';
import { useIdentityTokenRef } from 'views/components/PrivyTest/useIdentityTokenRef';
import { useSignMessageMemo } from 'views/components/PrivyTest/useSignMessageMemo';

export const LoginWithEmail = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const { sendCode, loginWithCode } = useLoginWithEmail();
  const { authenticated, user, logout, createWallet, getAccessToken } =
    usePrivy();
  const wallets = useWallets();
  const { signIn } = useSignIn();
  const identityTokenRef = useIdentityTokenRef();

  const signMessage = useSignMessageMemo();

  useEffect(() => {
    async function doAsync() {
      console.log('FIXME: authenticated: ', authenticated);
      console.log('FIXME: wallets: ', wallets);
      if (authenticated && wallets.wallets.length > 0) {
        const wallet = wallets.wallets[0];

        const ethereumProvider = async () => await wallet.getEthereumProvider();
        const signMessageProvider = async (
          message: string,
        ): Promise<string> => {
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

        const accessToken = await getAccessToken();

        await signIn(session, {
          address: wallet.address,
          community_id: ChainBase.Ethereum,
          wallet_id: WalletId.Privy,
          privy: {
            identityToken: identityTokenRef.current!,
            //ssoOAuthToken: accessToken,
            // FIXME: now I need an oauth token here...
          },
        });
        //   //
        //   // console.log('FIXME: session: ', session);
        // } else {
        //   console.log('FIXME: No wallets... ', {
        //     wallets,
        //   });
        //   //await createWallet();
      }
    }

    doAsync().catch(console.error);
  }, [authenticated, signMessage, wallets.wallets, identityTokenRef]);

  // call the MAIN signIn hook...

  // FIXME: signIn needs
  // address_id which is wallet.address
  // community_id - just use the 'Etherium' community ID to start
  // wallet_id: WalletId.Privy
  // FIXME: now I have to get the session ID...
  // const session = await getSessionFromWallet(wallet, { newSession: true });
  // this just calls await sessionSigner.newSession(CANVAS_TOPIC);

  // TODO: in order to sign we have to call this...
  // const {signMessage} = useSignMessage();

  // I have to create a new SessionSigner from it...

  const handleSendCode = useCallback(() => {
    // FIXME: ... I get Captcha failed - but no captcha is shown.
    async function doAsync() {
      console.log('Sending code to email: ' + email);
      await sendCode({ email });
      console.log('Code sent');
    }

    doAsync().catch(console.error);
  }, [email, sendCode]);

  const handleCode = useCallback(() => {
    async function doAsync() {
      await loginWithCode({ code });
      console.log('Authenticated now?');
    }

    doAsync().catch(console.error);
  }, [code, loginWithCode]);

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

  if (authenticated) {
    return (
      <div>
        Welcome, {user?.email?.address}
        <div>
          <button onClick={logout}>Logout</button>

          <button onClick={handleSignMessage}>Sign Message</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <input onChange={(e) => setEmail(e.currentTarget.value)} value={email} />
      <button onClick={() => handleSendCode()}>Send Code</button>
      <input onChange={(e) => setCode(e.currentTarget.value)} value={code} />
      <button onClick={() => handleCode()}>Login</button>
    </div>
  );
};
