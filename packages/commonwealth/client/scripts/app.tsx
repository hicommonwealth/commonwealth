import useInitApp from 'hooks/useInitApp';

import router from 'navigation/router';
import React, { StrictMode } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { CWSpinner } from 'views/components/component_kit/cw_spinner';

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
      <RouterProvider router={router(customDomain)} />
      <ToastContainer />
    </StrictMode>
  );
};

export default App;
