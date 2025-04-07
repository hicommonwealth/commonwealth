import { PrivyProvider } from '@privy-io/react-auth';
import React from 'react';
import { useDarkMode } from 'state/ui/darkMode/darkMode';

const PRIVY_APP_ID = process.env.PRIVY_APP_ID;

type DefaultPrivyProvider = {
  children: React.ReactNode;
};

export const DefaultPrivyProvider = (props: DefaultPrivyProvider) => {
  const { children } = props;
  const darkMode = useDarkMode();

  if (!PRIVY_APP_ID) return <div>Privy not configured in .env</div>;

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ['email', 'wallet', 'sms'],
        appearance: {
          theme: darkMode ? 'dark' : 'light',
          logo: 'https://common.xyz/brand_assets/common.png',
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
};
