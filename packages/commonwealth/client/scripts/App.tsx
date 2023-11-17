import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { httpBatchLink } from '@trpc/client';
import useInitApp from 'hooks/useInitApp';
import router from 'navigation/Router';
import React, { StrictMode, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import superjson from 'superjson';
import app from './state/index';
import { trpc } from './utils/trpc';
import { CWIcon } from './views/components/component_kit/cw_icons/cw_icon';

const App = () => {
  const { customDomain, isLoading } = useInitApp();
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      transformer: superjson,
      links: [
        httpBatchLink({
          url: '/trpc',
          async headers() {
            return {
              authorization: app.user.jwt,
            };
          },
        }),
      ],
    }),
  );

  return (
    <StrictMode>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          {isLoading ? (
            <div className="Splash">
              <CWIcon iconName="cow" iconSize="xxl" />
            </div>
          ) : (
            <RouterProvider router={router(customDomain)} />
          )}
          <ToastContainer />
          <ReactQueryDevtools />
        </QueryClientProvider>
      </trpc.Provider>
    </StrictMode>
  );
};

export default App;
