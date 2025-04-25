import { useLoginWithSms } from '@privy-io/react-auth';
import React, { useCallback } from 'react';
import usePrivySMSDialogStore from 'views/components/Privy/stores/usePrivySMSDialogStore';
import { CodeDialog } from './CodeDialog';

/**
 * Background dialog that we run along with the store so that we can finish auth.
 */
export const PrivySMSDialog = () => {
  const {
    active,
    setState: setSMSDialogStore,
    onCancel,
  } = usePrivySMSDialogStore();
  const { loginWithCode } = useLoginWithSms();

  const handleLoginWithCode = useCallback(
    (code: string) => {
      async function doAsync() {
        setSMSDialogStore({
          active: false,
          onCancel: undefined,
        });

        await loginWithCode({ code });
      }
      doAsync().catch(console.error);
    },
    [setSMSDialogStore, loginWithCode],
  );

  const handleCancel = useCallback(() => {
    onCancel?.();
    setSMSDialogStore({
      active: false,
      onCancel: undefined,
    });
  }, [onCancel, setSMSDialogStore]);

  if (!active) return null;

  return <CodeDialog onVerify={handleLoginWithCode} onCancel={handleCancel} />;
};
