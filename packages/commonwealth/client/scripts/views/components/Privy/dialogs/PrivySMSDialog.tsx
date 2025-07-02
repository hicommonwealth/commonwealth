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
    resolver,
  } = usePrivySMSDialogStore();

  const handleLoginWithCode = useCallback(
    (code: string) => {
      resolver?.(code);
      setSMSDialogStore({
        active: false,
        onCancel: undefined,
        onError: () => {},
        resolver: undefined,
        rejector: undefined,
      });
      return;
    },
    [setSMSDialogStore, resolver],
  );

  const handleCancel = useCallback(() => {
    onCancel?.();
    setSMSDialogStore({
      active: false,
      onCancel: undefined,
      onError: () => {},
      resolver: undefined,
      rejector: undefined,
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
