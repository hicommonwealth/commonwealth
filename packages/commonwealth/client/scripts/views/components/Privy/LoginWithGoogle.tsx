import React, { useCallback } from 'react';
import { useDefaultAuthCallbacks } from 'views/components/Privy/useDefaultAuthCallbacks';
import { usePrivyAuthWithOAuth } from 'views/components/Privy/usePrivyAuthWithOAuth';

export const LoginWithGoogle = () => {
  const callbacks = useDefaultAuthCallbacks();

  const { onInitOAuth, authenticated, loading, logout } =
    usePrivyAuthWithOAuth(callbacks);

  const handleLogout = useCallback(() => {
    logout().catch(console.error);
  }, [logout]);

  const handleLogin = useCallback(() => {
    onInitOAuth('google');
  }, [onInitOAuth]);

  if (authenticated) {
    return (
      <>
        <button onClick={handleLogout} disabled={loading}>
          logout
        </button>
      </>
    );
  }

  return (
    <button onClick={handleLogin} disabled={loading}>
      {loading ? 'Logging in...' : 'Log in with Google'}
    </button>
  );
};
