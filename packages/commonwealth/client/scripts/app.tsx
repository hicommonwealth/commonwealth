import React from 'react';
import { BrowserRouter } from 'react-router-dom';

import useInitApp from 'hooks/useInitApp';
import AppNavigator from 'navigation/AppNavigator';

const App = () => {
  const { customDomain } = useInitApp();

  return (
    <React.StrictMode>
      <BrowserRouter>
        <AppNavigator customDomain={customDomain} />
      </BrowserRouter>
    </React.StrictMode>
  );
};

export default App;
