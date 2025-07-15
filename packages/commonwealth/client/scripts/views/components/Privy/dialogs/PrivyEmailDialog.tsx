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
    resolver,
  } = usePrivyEmailDialogStore();

  const handleLoginWithCode = useCallback(
    (code: string) => {
      resolver?.(code);
      setEmailDialogStore({
        active: false,
        onCancel: undefined,
        onError: () => {},
        resolver: undefined,
      });
    },
    [setEmailDialogStore, resolver],
  );

  const handleCancel = useCallback(() => {
    onCancel?.();
    setEmailDialogStore({
      active: false,
      onCancel: undefined,
      onError: () => {},
      resolver: undefined,
    });
  }, [onCancel, setEmailDialogStore]);

  if (!active) return null;

  return (
    <CodeDialog
      onComplete={handleLoginWithCode}
      onCancel={handleCancel}
      headerText="Enter the code we sent to your email"
    />
  );
};
