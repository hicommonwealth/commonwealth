import React, { memo, useState } from 'react';
import { DebugPostMessage } from 'views/components/PrivyMobile/DebugPostMessage';
import { usePrivyEthereumWalletRequest } from 'views/components/PrivyMobile/usePrivyFoo';
import usePrivyMobileAuthStatusStore from 'views/components/PrivyMobile/usePrivyMobileAuthStatusStore';
import { usePrivyMobileLogout } from 'views/components/PrivyMobile/usePrivyMobileLogout';
import { usePrivyMobileSignMessage } from 'views/components/PrivyMobile/usePrivyMobileSignMessage';

export const DebugPrivyMobile = memo(function DebugPrivyMobile() {
  const { status: privyMobileAuthStatus } = usePrivyMobileAuthStatusStore();

  const [signature, setSignature] = useState<string | undefined>();

  const [accounts, setAccounts] = useState<any | undefined>();

  const signMessage = usePrivyMobileSignMessage();
  const logout = usePrivyMobileLogout();
  const ethereumWalletRequest = usePrivyEthereumWalletRequest();

  const handleSignMessage = () => {
    async function doAsync() {
      const result = await signMessage('hello');
      setSignature(result);
    }

    doAsync().catch(console.error);
  };

  const handleLogout = () => {
    async function doAsync() {
      await logout({});
    }

    doAsync().catch(console.error);
  };

  const handleEthereumWalletRequest = () => {
    async function doAsync() {
      const tmp = await ethereumWalletRequest({
        method: 'eth_requestAccounts',
      });
      setAccounts(tmp);
    }

    doAsync().catch(console.error);
  };

  return (
    <DebugPostMessage>
      <div>
        <div>
          <b>privyMobileAuthStatus:</b>
        </div>

        <div style={{ margin: '8px' }}>
          <button onClick={handleSignMessage}>sign message</button>
        </div>

        <div style={{ margin: '8px' }}>
          <button onClick={handleLogout}>logout</button>
        </div>

        <div style={{ margin: '8px' }}>
          <button onClick={handleEthereumWalletRequest}>
            Ethereum Wallet Request
          </button>
        </div>

        {signature && <div>signature: {signature}</div>}

        {accounts && <div>accounts: {JSON.stringify(accounts, null, 2)}</div>}

        <div>{JSON.stringify(privyMobileAuthStatus, null, 2)}</div>
      </div>
    </DebugPostMessage>
  );
});
