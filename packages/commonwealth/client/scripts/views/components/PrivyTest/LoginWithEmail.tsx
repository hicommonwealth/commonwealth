import {
  useIdentityToken,
  useLoginWithEmail,
  usePrivy,
  useWallets,
} from '@privy-io/react-auth';
import { GenericEthereumWebWalletController } from 'controllers/app/webWallets/generic_ethereum_web_wallet';
import { getSessionFromWallet } from 'controllers/server/sessions';
import React, { useCallback, useEffect, useState } from 'react';

export const LoginWithEmail = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const { sendCode, loginWithCode } = useLoginWithEmail();
  const { authenticated, user, login, logout } = usePrivy();
  const wallets = useWallets();
  const identityToken = useIdentityToken();

  useEffect(() => {
    async function doAsync() {
      if (wallets.wallets && wallets.wallets.length > 0) {
        console.log('FIXME: Getting ethereum provider....');
        const wallet = wallets.wallets[0];
        const ethereumProvider = await wallet.getEthereumProvider();
        console.log('FIXME: ethereumProvider: ', ethereumProvider);

        const webWallet = new GenericEthereumWebWalletController(
          () => ethereumProvider,
        );
        await webWallet.enable();

        const session = await getSessionFromWallet(webWallet, {
          newSession: true,
        });

        console.log('FIXME: session: ', session);
      }
    }

    doAsync().catch(console.error);
  }, [wallets.wallets]);

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

  if (authenticated) {
    return (
      <div>
        Welcome, {user?.email?.address}
        <div>
          <button onClick={logout}>Logout</button>
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
