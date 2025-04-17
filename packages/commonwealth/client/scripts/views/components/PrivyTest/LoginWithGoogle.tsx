import React, { useCallback } from 'react';
import { usePrivyOAuth } from 'views/components/PrivyTest/usePrivyOAuth';

export const LoginWithGoogle = () => {
  const handleSuccess = useCallback(() => {
    console.log('success!');
  }, []);

  const handleError = useCallback((err: Error) => {
    console.log('error: ', err);
  }, []);

  const { onPrivyOAuth, authenticated, loading, logout } = usePrivyOAuth({
    onSuccess: handleSuccess,
    onError: handleError,
  });

  const handleLogout = useCallback(() => {
    logout().catch(console.error);
  }, [logout]);

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
    <button onClick={onPrivyOAuth} disabled={loading}>
      {loading ? 'Logging in...' : 'Log in with Google'}
    </button>
  );
};
