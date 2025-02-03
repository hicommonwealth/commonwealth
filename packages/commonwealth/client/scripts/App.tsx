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
import { ReactNativeBridgeUser } from 'views/components/ReactNativeBridge';
import { ReactNativeLogForwarder } from 'views/components/ReactNativeBridge/ReactNativeLogForwarder';
import { Splash } from './Splash';
import { openFeatureProvider } from './helpers/feature-flags';
import useAppStatus from './hooks/useAppStatus';
import { trpc, trpcClient } from './utils/trpcClient';
import { AddToHomeScreenPrompt } from './views/components/AddToHomeScreenPrompt';
import { Mava } from './views/components/Mava';
import { TelegramAuthWrapper } from './views/components/TelegramAuthWrapper';

OpenFeature.setProvider(openFeatureProvider);

const isTelegramWebApp = () => {
  return window.Telegram?.WebApp != null;
};

const App = () => {
  const { isLoading } = useInitApp();
  const { isAddedToHomeScreen, isMarketingPage, isIOS, isAndroid } =
    useAppStatus();

  return (
    <StrictMode>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <trpc.Provider client={trpcClient} queryClient={queryClient}>
            {/*@ts-expect-error StrictNullChecks*/}
            <OpenFeatureProvider client={undefined}>
              {isLoading ? (
                <Splash />
              ) : (
                <>
                  <Mava />
                  <ReactNativeBridgeUser />
                  <ReactNativeLogForwarder />
                  {/* Telegram WebApp integration alongside other core components */}
                  {isTelegramWebApp() && <TelegramAuthWrapper />}
                  <RouterProvider router={router()} />
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
              {import.meta.env.DEV && <ReactQueryDevtools />}
            </OpenFeatureProvider>
          </trpc.Provider>
        </QueryClientProvider>
      </HelmetProvider>
    </StrictMode>
  );
};

export default App;
