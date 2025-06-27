import { PRODUCTION_DOMAIN } from '@hicommonwealth/shared';
import { PrivyProvider } from '@privy-io/react-auth';
import React, { memo } from 'react';
import { fetchCachedPublicEnvVar } from 'state/api/configuration';
import { useDarkMode } from 'state/ui/darkMode/darkMode';

type DefaultPrivyProvider = {
  children: React.ReactNode;
};

export const LoadPrivy = memo(function LoadPrivy(props: DefaultPrivyProvider) {
  const { children } = props;
  const darkMode = useDarkMode();

  const configurationData = fetchCachedPublicEnvVar();

  console.log(
    '[DEBUG] LoadPrivy - PRIVY_APP_ID configured:',
    !!configurationData?.PRIVY_APP_ID,
  );

  if (!configurationData?.PRIVY_APP_ID) return <div>Privy not configured</div>;

  return (
    <PrivyProvider
      appId={configurationData.PRIVY_APP_ID}
      onSuccess={(
        user,
        isNewUser,
        wasAlreadyAuthenticated,
        loginMethod,
        linkedAccount,
      ) => {
        console.log('[DEBUG] PrivyProvider - Authentication success');
        console.log('[DEBUG] PrivyProvider - user:', user);
        console.log('[DEBUG] PrivyProvider - isNewUser:', isNewUser);
        console.log(
          '[DEBUG] PrivyProvider - wasAlreadyAuthenticated:',
          wasAlreadyAuthenticated,
        );
        console.log('[DEBUG] PrivyProvider - loginMethod:', loginMethod);
        console.log('[DEBUG] PrivyProvider - linkedAccount:', linkedAccount);
        console.log('[DEBUG] PrivyProvider - user.wallet:', user.wallet);
      }}
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
