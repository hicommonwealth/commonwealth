import { usePrivy } from '@privy-io/react-auth';
import React, { useCallback } from 'react';

export const LoginWithFarcaster = () => {
  const { authenticated, login, logout } = usePrivy();

  const handleLogin = useCallback(() => {
    async function doAsync() {
      login({ loginMethods: ['farcaster'] });
    }

    doAsync().catch(console.error);
  }, [login]);

  if (authenticated) {
    return (
      <>
        <button onClick={logout}>logout</button>
      </>
    );
  }

  return (
    <>
      <button onClick={handleLogin}>login</button>
    </>
  );
};
