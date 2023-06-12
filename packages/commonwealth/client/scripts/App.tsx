import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import useInitApp from 'hooks/useInitApp';
import router from 'navigation/Router';
import React, { StrictMode } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { queryClient } from 'state/api/config';

const App = () => {
  const { customDomain, loading } = useInitApp();

  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router(customDomain, loading)} />
        <ToastContainer />
        <ReactQueryDevtools />
      </QueryClientProvider>
    </StrictMode>
  );
};

export default App;
