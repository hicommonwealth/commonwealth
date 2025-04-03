import { PrivyProvider } from '@privy-io/react-auth';
import React from 'react';
import { useDarkMode } from 'state/ui/darkMode/darkMode';

const PRIVY_APP_ID = process.env.PRIVY_APP_ID;
const PRIVY_CLIENT_ID = process.env.PRIVY_CLIENT_ID;

type DefaultPrivyProvider = {
  children: React.ReactNode;
};

export const DefaultPrivyProvider = (props: DefaultPrivyProvider) => {
  const { children } = props;
  const darkMode = useDarkMode();

  if (!PRIVY_APP_ID || !PRIVY_CLIENT_ID)
    return (
      <div>
        Privy App ID or Client ID not found. Please set the environment
        variables PRIVY_APP_ID and PRIVY_CLIENT_ID.
      </div>
    );

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      clientId={PRIVY_CLIENT_ID}
      config={{
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
