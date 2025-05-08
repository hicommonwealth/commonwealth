import React, { memo, useState } from 'react';
import { DebugPostMessage } from 'views/components/PrivyMobile/DebugPostMessage';
import { useNotificationsGetPermissionsAsyncReceiver } from 'views/components/PrivyMobile/useNotificationsGetPermissionsAsyncReceiver';
import { usePrivyEthereumWalletRequest } from 'views/components/PrivyMobile/usePrivyEthereumWalletRequest';
import usePrivyMobileAuthStatusStore from 'views/components/PrivyMobile/usePrivyMobileAuthStatusStore';
import { usePrivyMobileLogout } from 'views/components/PrivyMobile/usePrivyMobileLogout';
import { usePrivyMobileSignMessage } from 'views/components/PrivyMobile/usePrivyMobileSignMessage';

/**
 * component to help debug mobile usage.
 */
export const DebugMobile = memo(function DebugMobile() {
  const { status: privyMobileAuthStatus } = usePrivyMobileAuthStatusStore();

  const [signature, setSignature] = useState<string | undefined>();

  const [accounts, setAccounts] = useState<any | undefined>();
  const [notificationPermissions, setNotificationPermissions] = useState<
    string | undefined
  >();

  const signMessage = usePrivyMobileSignMessage();
  const logout = usePrivyMobileLogout();
  const ethereumWalletRequest = usePrivyEthereumWalletRequest();

  const getNotificationsPermissions =
    useNotificationsGetPermissionsAsyncReceiver();

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

  const handleGetNotificationsPermissions = () => {
    async function doAsync() {
      const { status } = await getNotificationsPermissions({});
      setNotificationPermissions(status);
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

        <div style={{ margin: '8px' }}>
          <button onClick={handleGetNotificationsPermissions}>
            Get Notification Permissions
          </button>
        </div>

        {signature && <div>signature: {signature}</div>}

        {accounts && <div>accounts: {JSON.stringify(accounts, null, 2)}</div>}

        {notificationPermissions && (
          <div>notificationPermissions: {notificationPermissions}</div>
        )}

        <div>{JSON.stringify(privyMobileAuthStatus, null, 2)}</div>
      </div>
    </DebugPostMessage>
  );
});
