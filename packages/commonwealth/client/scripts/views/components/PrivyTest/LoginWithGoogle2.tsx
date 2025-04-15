import React from 'react';
import { usePrivyOAuth } from 'views/components/PrivyTest/usePrivyOAuth';

export const LoginWithGoogle2 = () => {
  const { onPrivyOAuth, authenticated, loading, logout } = usePrivyOAuth({
    onSuccess: () => {
      console.log('success!');
    },
    onError: (err) => {
      console.log('error: ', err);
    },
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
