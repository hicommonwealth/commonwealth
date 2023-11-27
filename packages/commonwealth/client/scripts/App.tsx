import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import useInitApp from 'hooks/useInitApp';
import router from 'navigation/Router';
import React, { StrictMode } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { queryClient } from 'state/api/config';
import { trpc, trpcClient } from './utils/trpc';
import { CWIcon } from './views/components/component_kit/cw_icons/cw_icon';

const App = () => {
  const { customDomain, isLoading } = useInitApp();

  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          {isLoading ? (
            <div className="Splash">
              <CWIcon iconName="cow" iconSize="xxl" />
            </div>
          ) : (
            <RouterProvider router={router(customDomain)} />
          )}
          <ToastContainer />
          <ReactQueryDevtools />
        </trpc.Provider>
      </QueryClientProvider>
    </StrictMode>
  );
};

export default App;
