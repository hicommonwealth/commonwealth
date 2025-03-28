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
import { DisableMavaOnMobile } from 'views/components/DisableMavaOnMobile';
import ForceMobileAuth from 'views/components/ForceMobileAuth';
import { ReactNativeBridgeUser } from 'views/components/ReactNativeBridge';
import { ReactNativeLogForwarder } from 'views/components/ReactNativeBridge/ReactNativeLogForwarder';
import { ReactNativeScrollToTopListener } from 'views/components/ReactNativeBridge/ReactNativeScrollToTopListener';
import { Splash } from './Splash';
import { openFeatureProvider } from './helpers/feature-flags';
import { trpc, trpcClient } from './utils/trpcClient';
import FarcasterFrameProvider from './views/components/FarcasterProvider';
import OnBoardingWrapperForMobile from './views/pages/OnBoarding/OnBoardingWrapperForMobile';

OpenFeature.setProvider(openFeatureProvider);

const App = () => {
  const { isLoading } = useInitApp();
  return (
    <StrictMode>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <DisableMavaOnMobile />
            <FarcasterFrameProvider>
              {/*@ts-expect-error StrictNullChecks*/}
              <OpenFeatureProvider client={undefined}>
                {isLoading ? (
                  <Splash />
                ) : (
                  <>
                    <ForceMobileAuth>
                      <OnBoardingWrapperForMobile>
                        <ReactNativeBridgeUser />
                        <ReactNativeLogForwarder />
                        <ReactNativeScrollToTopListener />
                        <RouterProvider router={router()} />
                      </OnBoardingWrapperForMobile>
                    </ForceMobileAuth>
                  </>
                )}
                <ToastContainer />
                {import.meta.env.DEV && <ReactQueryDevtools />}
              </OpenFeatureProvider>
            </FarcasterFrameProvider>
          </trpc.Provider>
        </QueryClientProvider>
      </HelmetProvider>
    </StrictMode>
  );
};

export default App;
