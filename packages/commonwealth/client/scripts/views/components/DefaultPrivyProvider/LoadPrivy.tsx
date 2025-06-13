import { PRODUCTION_DOMAIN } from '@hicommonwealth/shared';
import { PrivyProvider } from '@privy-io/react-auth';
import React, { memo } from 'react';
import { useFetchPublicEnvVarQuery } from 'state/api/configuration';
import { useDarkMode } from 'state/ui/darkMode/darkMode';

type DefaultPrivyProvider = {
  children: React.ReactNode;
};

export const LoadPrivy = memo(function LoadPrivy(props: DefaultPrivyProvider) {
  const { children } = props;
  const darkMode = useDarkMode();

  const { data: configurationData } = useFetchPublicEnvVarQuery();

  if (!configurationData?.PRIVY_APP_ID) return <div>Privy not configured</div>;

  return (
    <PrivyProvider
      appId={configurationData.PRIVY_APP_ID}
      config={{
        loginMethods: [
          'google',
          'discord',
          'twitter',
          'apple',
          'github',
          'email',
          'farcaster',
          'sms',
          'wallet',
        ],
        appearance: {
          theme: darkMode ? 'dark' : 'light',
          logo: `https://${PRODUCTION_DOMAIN}/brand_assets/common.png`,
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
});
