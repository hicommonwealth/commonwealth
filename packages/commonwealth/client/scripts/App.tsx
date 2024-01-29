import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import FlagProvider from '@unleash/proxy-client-react';
import useInitApp from 'hooks/useInitApp';
import router from 'navigation/Router';
import React, { StrictMode } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { queryClient } from 'state/api/config';
import { Splash } from './Splash';

const unleashConfig = {
  url: process.env.UNLEASH_FRONTEND_SERVER_URL,
  clientKey: process.env.UNLEASH_FRONTEND_API_TOKEN,
  refreshInterval: 15,
  appName: 'commonwealth-web',
};

const App = () => {
  const { customDomain, isLoading } = useInitApp();

  return (
    <StrictMode>
      <FlagProvider config={unleashConfig}>
        <QueryClientProvider client={queryClient}>
          {isLoading ? (
            <Splash />
          ) : (
            <RouterProvider router={router(customDomain)} />
          )}
          <ToastContainer />
          <ReactQueryDevtools />
        </QueryClientProvider>
      </FlagProvider>
    </StrictMode>
  );
};

export default App;
