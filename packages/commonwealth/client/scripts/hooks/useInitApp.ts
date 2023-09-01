import axios from 'axios';
import React, { useEffect } from 'react';
import app, { initAppState } from 'state';

const useInitApp = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [customDomain, setCustomDomain] = React.useState('');

  useEffect(() => {
    setIsLoading(true);

    console.log('Checking if on native device');
    console.log(app.isNative(window));

    if (app.isNative(window)) {
      console.log(
        'On native device, skipping custom domain and initializing app state.'
      );
      initAppState(true).then(() => {
        setIsLoading(false);
      });
    } else {
      Promise.all([axios.get(`${app.serverUrl()}/domain`), initAppState()])
        .then(([domainResp]) => {
          const serverCustomDomain = domainResp.data.customDomain;
          if (serverCustomDomain) {
            app.setCustomDomain(serverCustomDomain);
          }
          setCustomDomain(serverCustomDomain);
          return Promise.resolve(serverCustomDomain);
        })
        .catch((err) => console.log('Failed fetching custom domain', err))
        .finally(() => setIsLoading(false));
    }
  }, []);

  return { isLoading, customDomain };
};

export default useInitApp;
