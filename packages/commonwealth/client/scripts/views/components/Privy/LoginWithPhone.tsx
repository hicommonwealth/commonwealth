import { usePrivy } from '@privy-io/react-auth';
import React, { useCallback, useState } from 'react';
import { useDefaultAuthCallbacks } from 'views/components/Privy/useDefaultAuthCallbacks';
import { usePrivyAuthWithPhone } from 'views/components/Privy/usePrivyAuthWithPhone';

export const LoginWithPhone = () => {
  const { authenticated, logout } = usePrivy();
  const [stage, setStage] = useState<'enter-phone-number' | 'wait-for-code'>(
    'enter-phone-number',
  );

  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [code, setCode] = useState<string>('');

  const callbacks = useDefaultAuthCallbacks();

  const { sendCode, loginWithCode } = usePrivyAuthWithPhone(callbacks);

  const handleLogout = useCallback(() => {
    logout().catch(console.error);
    setStage('enter-phone-number');
    setPhoneNumber('');
    setCode('');
  }, [logout]);

  const handleSendCode = useCallback(() => {
    async function doAsync() {
      await sendCode({ phoneNumber });
      setStage('wait-for-code');
    }
    doAsync().catch(callbacks.onError);
  }, [callbacks.onError, sendCode, phoneNumber]);

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
      {stage === 'enter-phone-number' && (
        <>
          <input
            placeholder="Enter phone number"
            type="tel"
            required
            onChange={(e) => setPhoneNumber(e.currentTarget.value)}
            value={phoneNumber}
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
