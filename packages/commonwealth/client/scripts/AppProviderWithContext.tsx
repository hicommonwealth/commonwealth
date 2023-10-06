import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useFlagsStatus, useUnleashClient } from '@unleash/proxy-client-react';
import React, { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import useInitApp from './hooks/useInitApp';
import router from './navigation/Router';
import { queryClient } from './state/api/config';
import { CWIcon } from './views/components/component_kit/cw_icons/cw_icon';

export type FeatureFlags = {
  discussionsPageFlag: boolean;
};

const Splash = () => {
  return (
    <div className="Splash">
      {/* This can be a moving bobber, atm it is still */}
      <CWIcon iconName="cow" iconSize="xxl" />
    </div>
  );
};

export const AppProviderWithContext = () => {
  const client = useUnleashClient();
  const { customDomain, isLoading } = useInitApp();
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>({
    discussionsPageFlag: false,
  });
  const { flagsReady } = useFlagsStatus();

  useEffect(() => {
    setFeatureFlags({
      discussionsPageFlag: client.isEnabled('ui.discussionsPage'),
    });
  }, [flagsReady]);

  console.log(`disucssionsPageFlag=${featureFlags.discussionsPageFlag}`);

  return (
    <QueryClientProvider client={queryClient}>
      {isLoading ? (
        <Splash />
      ) : (
        <RouterProvider router={router(customDomain, featureFlags)} />
      )}
      <ToastContainer />
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
};
