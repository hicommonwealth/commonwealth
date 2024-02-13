import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import useInitApp from 'hooks/useInitApp';
import router from 'navigation/Router';
import React, { StrictMode } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { queryClient } from 'state/api/config';
import useAppStatus from './hooks/useAppStatus';
import AddToHomeScreenPrompt from './views/components/AddToHomeScreenPrompt/AddToHomeScreenPrompt';
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
  const {
    isAddedToHomeScreen,
    isStandalone,
    isMarketingPage,
    isIOS,
    isAndroid,
  } = useAppStatus();

  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        {isLoading ? (
          <Splash />
        ) : (
          <>
            <RouterProvider router={router(customDomain)} />
          </>
        )}

        {isAddedToHomeScreen || isMarketingPage ? null : (
          <AddToHomeScreenPrompt isIOS={isIOS} isAndroid={isAndroid} />
        )}

        <ToastContainer />
        <ReactQueryDevtools />
      </QueryClientProvider>
    </StrictMode>
  );
};

export default App;
