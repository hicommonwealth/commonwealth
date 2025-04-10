import { useIdentityToken, usePrivy } from '@privy-io/react-auth';
import React, { memo, useEffect, useState } from 'react';
import useUserStore from 'state/ui/user';
import { PrivyEmailProvider } from './PrivyEmailProvider';
import { PrivySMSProvider } from './PrivySMSProvider';

type AuthProvider = 'sms' | 'email';

export const PrivyAuth = memo(function PrivyAuth() {
  const { authenticated, user, login, logout } = usePrivy();
  const [provider, setProvider] = useState<AuthProvider | undefined>(undefined);

  const user = useUserStore();

  const identityToken = useIdentityToken();

  useEffect(() => {
    if (user && identityToken) {
      console.log('Going to login now... ');
    }
  }, [identityToken, user]);

  if (authenticated) {
    // obviously we're done.
    return null;
  }

  if (provider) {
    return (
      <div>
        {provider === 'sms' && <PrivySMSProvider />}
        {provider === 'email' && <PrivyEmailProvider />}
      </div>
    );
  }
});
