import React from 'react';
import useSMSDialogStore from 'views/components/PrivyTest/usePrivySMSDialogStore';

/**
 * Background dialog that we run along with the store so that we can finish auth.
 */
export const PrivySMSDialog = () => {
  const [phoneNumber, setPhoneNumber] = useSMSDialogStore();

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
    ></div>
  );
};
