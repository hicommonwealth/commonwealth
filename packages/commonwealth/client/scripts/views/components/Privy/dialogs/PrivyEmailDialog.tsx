import { useLoginWithEmail } from '@privy-io/react-auth';
import React, { useCallback } from 'react';
import { CodeDialog } from 'views/components/Privy/dialogs/CodeDialog';
import usePrivyEmailDialogStore from 'views/components/Privy/stores/usePrivyEmailDialogStore';

/**
 * Background dialog that we run along with the store so that we can finish auth.
 */
export const PrivyEmailDialog = () => {
  const {
    active,
    setState: setEmailDialogStore,
    onCancel,
  } = usePrivyEmailDialogStore();
  const { loginWithCode } = useLoginWithEmail();

  const handleLoginWithCode = useCallback(
    (code: string) => {
      async function doAsync() {
        setEmailDialogStore({
          active: false,
          onCancel: undefined,
        });

        await loginWithCode({ code });
      }
      doAsync().catch(console.error);
    },
    [setEmailDialogStore, loginWithCode],
  );

  const handleCancel = useCallback(() => {
    onCancel?.();
    setEmailDialogStore({
      active: false,
      onCancel: undefined,
    });
  }, [onCancel, setEmailDialogStore]);

  if (!active) return null;

  return <CodeDialog onVerify={handleLoginWithCode} onCancel={handleCancel} />;
};
