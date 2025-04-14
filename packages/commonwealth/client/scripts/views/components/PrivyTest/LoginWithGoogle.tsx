import { useLoginWithOAuth, useWallets } from '@privy-io/react-auth';
import React from 'react';

export const LoginWithGoogle = () => {
  const { state, loading, initOAuth } = useLoginWithOAuth();
  const wallets = useWallets();

  console.log(wallets);
  const handleLogin = async () => {
    try {
      // The user will be redirected to OAuth provider's login page
      await initOAuth({ provider: 'google' });
    } catch (err) {
      // Handle errors (network issues, validation errors, etc.)
      console.error(err);
    }
  };
  return (
    <button onClick={handleLogin} disabled={loading}>
      {loading ? 'Logging in...' : 'Log in with Google'}
    </button>
  );
};
