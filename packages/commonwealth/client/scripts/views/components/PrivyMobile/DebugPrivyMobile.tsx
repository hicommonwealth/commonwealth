import React, { memo, useState } from 'react';
import { DebugPostMessage } from 'views/components/PrivyMobile/DebugPostMessage';
import usePrivyMobileAuthStatusStore from 'views/components/PrivyMobile/usePrivyMobileAuthStatusStore';
import { usePrivyMobileSignMessage } from 'views/components/PrivyMobile/usePrivyMobileSignMessage';

export const DebugPrivyMobile = memo(function DebugPrivyMobile() {
  const { status: privyMobileAuthStatus } = usePrivyMobileAuthStatusStore();

  const [signature, setSignature] = useState<string | undefined>();

  const signMessage = usePrivyMobileSignMessage();

  const handleSignMessage = () => {
    async function doAsync() {
      const result = await signMessage('hello');
      console.log('FIXME.667', JSON.stringify(result));
      setSignature(result);
      console.log(result);
    }

    doAsync().catch(console.error);
  };

  return (
    <DebugPostMessage>
      <div>
        <div>
          <b>privyMobileAuthStatus:</b>
        </div>

        <div>
          <button onClick={handleSignMessage}>sign message</button>
        </div>

        {signature && <div>signature: {signature}</div>}

        <div>{JSON.stringify(privyMobileAuthStatus, null, 2)}</div>
      </div>
    </DebugPostMessage>
  );
});
