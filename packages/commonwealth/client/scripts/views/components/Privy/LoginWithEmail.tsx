import { usePrivy } from '@privy-io/react-auth';
import React, { useCallback, useState } from 'react';
import { useDefaultAuthCallbacks } from 'views/components/Privy/useDefaultAuthCallbacks';
import { usePrivyAuthWithEmail } from 'views/components/Privy/usePrivyAuthWithEmail';

export const LoginWithEmail = () => {
  const { authenticated, logout } = usePrivy();
  const [stage, setStage] = useState<'enter-email' | 'wait-for-code'>(
    'enter-email',
  );

  const [email, setEmail] = useState<string>('');
  const [code, setCode] = useState<string>('');

  const callbacks = useDefaultAuthCallbacks();

  const { sendCode, loginWithCode } = usePrivyAuthWithEmail(callbacks);

  const handleLogout = useCallback(() => {
    logout().catch(console.error);
    setStage('enter-email');
    setEmail('');
    setCode('');
  }, [logout]);

  const handleSendCode = useCallback(() => {
    async function doAsync() {
      await sendCode({ email });
      setStage('wait-for-code');
    }
    doAsync().catch(callbacks.onError);
  }, [callbacks.onError, sendCode, email]);

  const handleLoginWithCode = useCallback(() => {
    async function doAsync() {
      await loginWithCode({ code });
    }
    doAsync().catch(callbacks.onError);
  }, [callbacks.onError, loginWithCode, code]);

  if (authenticated) {
    return (
      <>
        <button onClick={handleLogout}>logout</button>
      </>
    );
  }

  return (
    <>
      {stage === 'enter-email' && (
        <>
          <input
            placeholder="Enter email"
            type="tel"
            required
            onChange={(e) => setEmail(e.currentTarget.value)}
            value={email}
          />
          <button onClick={handleSendCode}>Send Code</button>
        </>
      )}
      {stage === 'wait-for-code' && (
        <>
          <input
            onChange={(e) => setCode(e.currentTarget.value)}
            value={code}
          />

          <button onClick={handleLoginWithCode}>Verify Code</button>
        </>
      )}
    </>
  );
};
