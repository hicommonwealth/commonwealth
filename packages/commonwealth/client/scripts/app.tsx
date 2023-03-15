import React, { StrictMode } from 'react';
import { RouterProvider } from 'react-router-dom';

import useInitApp from 'hooks/useInitApp';
import { ToastContainer } from 'react-toastify';

import router from 'navigation/router';

const App = () => {
  const { customDomain } = useInitApp();

  return (
    <StrictMode>
      <RouterProvider router={router} />
      <ToastContainer />
    </StrictMode>
  );
};

export default App;
