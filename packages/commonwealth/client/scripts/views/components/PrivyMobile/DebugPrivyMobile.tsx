import React from 'react';
import usePrivyMobileAuthStatusStore from 'views/components/PrivyMobile/usePrivyMobileAuthStatusStore';
import { usePrivyMobileSignMessage } from 'views/components/PrivyMobile/usePrivyMobileSignMessage';

export const DebugPrivyMobile = () => {
  const { status: privyMobileAuthStatus } = usePrivyMobileAuthStatusStore();

  const signMessage = usePrivyMobileSignMessage();

  const handleSignMessage = () => {
    async function doAsync() {
      const result = await signMessage('hello');
      console.log(result);
    }

    doAsync().catch(console.error);
  };

  return (
    <div>
      <div>
        <b>privyMobileAuthStatus:</b>
      </div>

      <div>
        <button onClick={handleSignMessage}>sign message</button>
      </div>

      <div>{JSON.stringify(privyMobileAuthStatus, null, 2)}</div>
    </div>
  );
};
