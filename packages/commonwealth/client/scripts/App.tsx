import React, { StrictMode } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import useInitApp from 'hooks/useInitApp';
import { CWSpinner } from 'views/components/component_kit/cw_spinner';

import router from 'navigation/Router';

const queryClient = new QueryClient();

const App = () => {
  const { customDomain, loading } = useInitApp();

  if (loading) {
    return (
      <div className="app-loading">
        <CWSpinner />
      </div>
    );
  }

  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router(customDomain)} />
        <ToastContainer />
      </QueryClientProvider>
    </StrictMode>
  );
};

export default App;
