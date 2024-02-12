import { OpenFeatureProvider } from '@openfeature/react-sdk';
import { InMemoryProvider, OpenFeature } from '@openfeature/web-sdk';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import useInitApp from 'hooks/useInitApp';
import router from 'navigation/Router';
import React, { StrictMode } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { queryClient } from 'state/api/config';
import { UnleashProvider } from '../../shared/UnleashProvider';
import { featureFlags } from './helpers/feature-flags';
import { CWIcon } from './views/components/component_kit/cw_icons/cw_icon';

const Splash = () => {
  return (
    <div className="Splash">
      {/* This can be a moving bobber, atm it is still */}
      <CWIcon iconName="cow" iconSize="xxl" />
    </div>
  );
};

const unleashConfig = {
  url: process.env.UNLEASH_FRONTEND_SERVER_URL,
  clientKey: process.env.UNLEASH_FRONTEND_API_TOKEN,
  refreshInterval: 15,
  appName: 'commonwealth-web',
};

OpenFeature.setProvider(
  process.env.UNLEASH_FRONTEND_API_TOKEN
    ? new UnleashProvider(unleashConfig)
    : new InMemoryProvider(featureFlags),
);

const App = () => {
  const { customDomain, isLoading } = useInitApp();

  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        {isLoading ? (
          <Splash />
        ) : (
          <OpenFeatureProvider client={undefined}>
            <RouterProvider router={router(customDomain)} />
          </OpenFeatureProvider>
        )}
        <ToastContainer />
        <ReactQueryDevtools />
      </QueryClientProvider>
    </StrictMode>
  );
};

export default App;
