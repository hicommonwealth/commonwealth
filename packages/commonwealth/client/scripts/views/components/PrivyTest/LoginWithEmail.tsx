import { useLoginWithEmail, usePrivy } from '@privy-io/react-auth';
import React, { useCallback, useState } from 'react';

export const LoginWithEmail = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const { sendCode, loginWithCode } = useLoginWithEmail();
  const { authenticated, user, login, logout } = usePrivy();

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
