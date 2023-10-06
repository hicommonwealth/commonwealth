import FlagProvider from '@unleash/proxy-client-react';
import React, { StrictMode } from 'react';
import { AppProviderWithContext } from './AppProviderWithContext';

const unleashConfig = {
  url: process.env.UNLEASH_URL,
  clientKey: process.env.UNLEASH_CLIENT_KEY,
  refreshInterval: 15,
  appName: 'commonwealth-web',
};

const App = () => {
  return (
    <StrictMode>
      <FlagProvider config={unleashConfig}>
        <AppProviderWithContext />
      </FlagProvider>
    </StrictMode>
  );
};

export default App;
