import { useLoginWithSms } from '@privy-io/react-auth';
import React, { useCallback, useState } from 'react';
import useSMSDialogStore from 'views/components/PrivyTest/usePrivySMSDialogStore';

/**
 * Background dialog that we run along with the store so that we can finish auth.
 */
export const PrivySMSDialog = () => {
  const {
    phoneNumber,
    setState: setSMSDialogStore,
    onCancel,
  } = useSMSDialogStore();
  const [code, setCode] = useState<string>('');
  const { loginWithCode } = useLoginWithSms();

  const handleLoginWithCode = useCallback(() => {
    async function doAsync() {
      await loginWithCode({ code });
    }
    doAsync().catch(console.error);
  }, [loginWithCode, code]);

  const handleCancel = useCallback(() => {
    onCancel?.();
    setSMSDialogStore(undefined, false, undefined);
  }, [onCancel, setSMSDialogStore]);

  if (!phoneNumber) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: '#ffffff',
        zIndex: 10000,
      }}
    >
      <div>Enter the code on your phone:</div>

      <input onChange={(e) => setCode(e.currentTarget.value)} value={code} />

      <button onClick={handleLoginWithCode}>Verify Code</button>

      <button onClick={handleCancel}>cancel</button>
    </div>
  );
};
