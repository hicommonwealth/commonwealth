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
import { featureFlags } from './helpers/feature-flags';
import useAppStatus from './hooks/useAppStatus';
import { AddToHomeScreenPrompt } from './views/components/AddToHomeScreenPrompt';
import { CWIcon } from './views/components/component_kit/cw_icons/cw_icon';

const Splash = () => {
  return (
    <div className="Splash">
      {/* This can be a moving bobber, atm it is still */}
      <CWIcon iconName="cow" iconSize="xxl" />
    </div>
  );
};

OpenFeature.setProvider(new InMemoryProvider(featureFlags));

const App = () => {
  const { customDomain, isLoading } = useInitApp();
  const { isAddedToHomeScreen, isMarketingPage, isIOS, isAndroid } =
    useAppStatus();

  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <OpenFeatureProvider client={undefined}>
          {isLoading ? (
            <Splash />
          ) : (
            <RouterProvider router={router(customDomain)} />
          )}
          {isAddedToHomeScreen || isMarketingPage ? null : (
            <AddToHomeScreenPrompt isIOS={isIOS} isAndroid={isAndroid} />
          )}
          <ToastContainer />
          <ReactQueryDevtools />
        </OpenFeatureProvider>
      </QueryClientProvider>
    </StrictMode>
  );
};

export default App;
