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
    onError,
  } = usePrivySMSDialogStore();
  const { loginWithCode } = useLoginWithSms();

  const handleLoginWithCode = useCallback(
    (code: string) => {
      async function doAsync() {
        setSMSDialogStore({
          active: false,
          onCancel: undefined,
          onError: () => {},
        });

        await loginWithCode({ code });
      }
      doAsync().catch((err) => onError(err));
    },
    [onError, setSMSDialogStore, loginWithCode],
  );

  const handleCancel = useCallback(() => {
    onCancel?.();
    setSMSDialogStore({
      active: false,
      onCancel: undefined,
      onError: () => {},
    });
  }, [onCancel, setSMSDialogStore]);

  if (!active) return null;

  return (
    <CodeDialog
      onComplete={handleLoginWithCode}
      onCancel={handleCancel}
      headerText="Enter the code we sent to your phone"
    />
  );
};
