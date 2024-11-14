import { FarcasterExtension } from '@magic-ext/farcaster';
import { OAuthExtension } from '@magic-ext/oauth2';
import { OpenFeatureProvider } from '@openfeature/react-sdk';
import { OpenFeature } from '@openfeature/web-sdk';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import useInitApp from 'hooks/useInitApp';
import { Magic } from 'magic-sdk';
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
import { Mava } from './views/components/Mava';

OpenFeature.setProvider(openFeatureProvider);

// need to instantiate it early because the farcaster sdk has an async constructor which will cause a race condition
// if instantiated right before the login is called;
export const defaultMagic = new Magic(process.env.MAGIC_PUBLISHABLE_KEY!, {
  extensions: [new FarcasterExtension(), new OAuthExtension()],
});

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
