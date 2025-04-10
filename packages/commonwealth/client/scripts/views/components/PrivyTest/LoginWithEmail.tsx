import {
  useIdentityToken,
  useLoginWithEmail,
  usePrivy,
  useWallets,
} from '@privy-io/react-auth';
import React, { useCallback, useState } from 'react';

export const LoginWithEmail = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const { sendCode, loginWithCode } = useLoginWithEmail();
  const { authenticated, user, login, logout } = usePrivy();
  const wallets = useWallets();
  const identityToken = useIdentityToken();

  console.log('Got wallets: ', wallets);

  // FIXME: signIn needs
  // address_id which is wallet.address
  // community_id - just use the 'Etherium' community ID to start
  // wallet_id: WalletId.Privy
  // FIXME: now I have to get the session ID...

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
