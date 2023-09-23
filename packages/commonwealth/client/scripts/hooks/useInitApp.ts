import axios from 'axios';
import React, { useEffect } from 'react';
import app, { initAppState } from 'state';

const useInitApp = () => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [customDomain, setCustomDomain] = React.useState('');

  useEffect(() => {
    setIsLoading(true);
    console.log(app.platform());
    const isWebPlatform = app.platform() === 'web';
    const domainPromise = isWebPlatform
      ? axios
          .get(`${app.serverUrl()}/domain`)
          .then((res) => {
            const serverCustomDomain = res.data.customDomain || '';
            setCustomDomain(serverCustomDomain);
            return serverCustomDomain;
          })
          .catch((err) => console.log('Failed fetching custom domain', err))
      : Promise.resolve();

    Promise.all([domainPromise, initAppState(true)])
      .then(([serverCustomDomain]) => serverCustomDomain)
      .finally(() => setIsLoading(false));
  }, []);

  return { isLoading, customDomain };
};

export default useInitApp;
