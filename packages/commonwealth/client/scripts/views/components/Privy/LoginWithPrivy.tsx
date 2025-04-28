import React, { useState } from 'react';
import { LoginWithGoogle } from 'views/components/Privy/LoginWithGoogle';
import { LoginWithPhone } from 'views/components/Privy/LoginWithPhone';
import { PrivySignInSSOProvider } from 'views/components/Privy/types';
import { LoginWithEmail } from './LoginWithEmail';

/**
 * Selector that allows to pick an auth method.
 */
export const LoginWithPrivy = () => {
  const [privyAuthMethod, setPrivyAuthMethod] = useState<
    PrivySignInSSOProvider | undefined
  >(undefined);

  if (!privyAuthMethod) {
    return (
      <>
        <div>
          <button onClick={() => setPrivyAuthMethod('email')}>Email</button>
          <button onClick={() => setPrivyAuthMethod('phone')}>Phone</button>
          <button onClick={() => setPrivyAuthMethod('google_oauth')}>
            Google
          </button>
        </div>
      </>
    );
  }

  switch (privyAuthMethod) {
    case 'email':
      return <LoginWithEmail />;
    case 'phone':
      return <LoginWithPhone />;
    case 'google_oauth':
      return <LoginWithGoogle />;
  }
};
