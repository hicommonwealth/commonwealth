import { OpenFeatureProvider } from '@openfeature/react-sdk';
import { OpenFeature } from '@openfeature/web-sdk';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import useInitApp from 'hooks/useInitApp';
import router from 'navigation/Router';
import React, { StrictMode } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { RouterProvider } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { queryClient } from 'state/api/config';
import { Splash } from './Splash';
import { openFeatureProvider } from './helpers/feature-flags';
import useAppStatus from './hooks/useAppStatus';
import { trpc, trpcClient } from './utils/trpcClient';
import { AddToHomeScreenPrompt } from './views/components/AddToHomeScreenPrompt';

OpenFeature.setProvider(openFeatureProvider);

const App = () => {
  const { customDomain, isLoading } = useInitApp();
  const { isAddedToHomeScreen, isMarketingPage, isIOS, isAndroid } =
    useAppStatus();

  return (
    <StrictMode>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <OpenFeatureProvider client={undefined}>
              {isLoading ? (
                <Splash />
              ) : (
                <>
                  <RouterProvider router={router(customDomain)} />
                  {isAddedToHomeScreen || isMarketingPage ? null : (
                    <AddToHomeScreenPrompt
                      isIOS={isIOS}
                      isAndroid={isAndroid}
                      displayDelayMilliseconds={1000}
                    />
                  )}
                </>
              )}

              <ToastContainer />
              <ReactQueryDevtools />
            </OpenFeatureProvider>
          </trpc.Provider>
        </QueryClientProvider>
      </HelmetProvider>
    </StrictMode>
  );
};

export default App;
