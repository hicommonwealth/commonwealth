import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import useInitApp from 'hooks/useInitApp';
import router from 'navigation/Router';
import React, { StrictMode, useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { queryClient } from 'state/api/config';
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

  useEffect(() => {
    const customizationBgColor = localStorage.getItem('customization-bg-color');
    const customizationSidebarColor = localStorage.getItem(
      'customization-sidebar-color',
    );
    const customizationFont = localStorage.getItem('customization-font');

    if (customizationBgColor) {
      document.documentElement.style.setProperty(
        '--customization-bg-color',
        customizationBgColor,
      );
    }

    if (customizationSidebarColor) {
      document.documentElement.style.setProperty(
        '--customization-sidebar-color',
        customizationSidebarColor,
      );
    }

    if (customizationFont) {
      document.documentElement.style.setProperty(
        '--customization-font',
        customizationFont,
      );
    }
  }, []);

  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        {isLoading ? (
          <Splash />
        ) : (
          <RouterProvider router={router(customDomain)} />
        )}
        <ToastContainer />
        <ReactQueryDevtools />
      </QueryClientProvider>
    </StrictMode>
  );
};

export default App;
