import React, { useState } from 'react';
import { PrivyAuthMethod } from 'views/components/PrivyTest/AuthMethod';
import { LoginWithGoogle } from 'views/components/PrivyTest/LoginWithGoogle';
import { LoginWithSMS } from 'views/components/PrivyTest/LoginWithSMS';
import { LoginWithEmail } from './LoginWithEmail';

/**
 * Selector that allows to pick an auth method.
 * @constructor
 */
export const LoginWithPrivy = () => {
  const [privyAuthMethod, setPrivyAuthMethod] = useState<
    PrivyAuthMethod | undefined
  >(undefined);

  if (!privyAuthMethod) {
    return (
      <>
        <div>
          <button onClick={() => setPrivyAuthMethod('email')}>Email</button>
          <button onClick={() => setPrivyAuthMethod('phone')}>Phone</button>
          <button onClick={() => setPrivyAuthMethod('google')}>Google</button>
        </div>
      </>
    );
  }

  switch (privyAuthMethod) {
    case 'email':
      return <LoginWithEmail />;
    case 'phone':
      return <LoginWithSMS />;
    case 'google':
      return <LoginWithGoogle />;
  }
};
