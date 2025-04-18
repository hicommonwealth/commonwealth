import { usePrivy } from '@privy-io/react-auth';
import React, { useCallback, useState } from 'react';
import { usePrivySMS } from 'views/components/PrivyTest/usePrivySMS';

export const LoginWithSMS = () => {
  const { authenticated, logout } = usePrivy();
  const [stage, setStage] = useState<'enter-phone-number' | 'wait-for-code'>(
    'enter-phone-number',
  );

  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [code, setCode] = useState<string>('');

  const handleSuccess = useCallback(() => {
    console.log('success!');
  }, []);

  const handleError = useCallback((err: Error) => {
    console.log('error: ', err);
  }, []);

  const { sendCode, loginWithCode } = usePrivySMS({
    onSuccess: handleSuccess,
    onError: handleError,
  });

  const handleLogout = useCallback(() => {
    logout().catch(console.error);
  }, [logout]);

  const handleSendCode = useCallback(() => {
    async function doAsync() {
      await sendCode({ phoneNumber });
      setStage('wait-for-code');
    }
    doAsync().catch(handleError);
  }, [handleError, sendCode, phoneNumber]);

  const handleLoginWithCode = useCallback(() => {
    async function doAsync() {
      await loginWithCode({ code });
    }
    doAsync().catch(handleError);
  }, [handleError, loginWithCode, code]);

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

          <button onClick={handleLoginWithCode}>Send Code</button>
        </>
      )}
    </>
  );
};
