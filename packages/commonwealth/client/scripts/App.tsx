import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import useInitApp from 'hooks/useInitApp';
import router from 'navigation/Router';
import React, { StrictMode } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { queryClient, persister } from 'state/api/config';
import { CWIcon } from './views/components/component_kit/cw_icons/cw_icon';

const Splash = () => {
  return (
    <div className="Splash">
      {/* This can be a moving bobber, atm it is still */}
      <CWIcon iconName="cow" iconSize="xxl" />
    </div>
  );
};

const App = () => {
  const { customDomain, isLoading } = useInitApp();

  return (
    <StrictMode>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          // persister: persister.localstorege, // this will store react query data in browser local stoarge (using web storage api)
          persister: persister.indexedDB, // this will store react query data in browser indexed db (which is a different kind of storage and it also supports Date() and File() objects and more)
        }}
      >
        {isLoading ? (
          <Splash />
        ) : (
          <RouterProvider router={router(customDomain)} />
        )}
        <ToastContainer />
        <ReactQueryDevtools />
      </PersistQueryClientProvider>
    </StrictMode>
  );
};

export default App;
