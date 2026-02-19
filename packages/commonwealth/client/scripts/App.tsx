import { OpenFeatureProvider } from '@openfeature/react-sdk';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import useInitApp from 'hooks/useInitApp';
import Router from 'navigation/Router';
import React, { StrictMode } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { ToastContainer } from 'react-toastify';
import { queryClient } from 'state/api/config';
import MoonPayProvider from 'views/components/MoonPayProvider';
import { Splash } from './Splash';
import { trpc, trpcClient } from './utils/trpcClient';
import FarcasterFrameProvider from './views/components/FarcasterProvider';

const App = () => {
  const { isLoading } = useInitApp();

  return (
    <StrictMode>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <FarcasterFrameProvider>
              {/*@ts-expect-error StrictNullChecks*/}
              <OpenFeatureProvider client={undefined}>
                {isLoading ? (
                  <Splash />
                ) : (
                  // Add auth providers back in when we are ready to use Privy.
                  <MoonPayProvider>
                    <Router />
                  </MoonPayProvider>
                )}
                <ToastContainer />
                {import.meta.env.DEV && (
                  <ReactQueryDevtools buttonPosition="bottom-left" />
                )}
              </OpenFeatureProvider>
            </FarcasterFrameProvider>
          </trpc.Provider>
        </QueryClientProvider>
      </HelmetProvider>
    </StrictMode>
  );
};

export default App;
