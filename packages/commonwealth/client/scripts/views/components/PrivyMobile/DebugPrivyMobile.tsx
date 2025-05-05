import React from 'react';
import usePrivyMobileAuthStatusStore from 'views/components/PrivyMobile/usePrivyMobileAuthStatusStore';

export const DebugPrivyMobile = () => {
  const { status: privyMobileAuthStatus } = usePrivyMobileAuthStatusStore();

  return (
    <div>
      <div>
        <b>:privyMobileAuthStatus:</b>
      </div>
      <div>{JSON.stringify(privyMobileAuthStatus, null, 2)}</div>
    </div>
  );
};
