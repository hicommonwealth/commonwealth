import React, { useCallback } from 'react';
import { usePrivyOAuth } from 'views/components/PrivyTest/usePrivyOAuth';

export const LoginWithGoogle2 = () => {
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

  if (authenticated) {
    return (
      <>
        <button onClick={logout} disabled={loading}>
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
