import axios from 'axios';
import React, { useEffect } from 'react';
import app, { initAppState } from 'state';

const useInitApp = () => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [customDomain, setCustomDomain] = React.useState('');

  useEffect(() => {
    Promise.all([axios.get(`${app.serverUrl()}/domain`), initAppState()])
      .then(([domainResp]) => {
        return domainResp.data;
      })
      .then(({ customDomain: serverCustomDomain }) => {
        if (serverCustomDomain) {
          app.setCustomDomain(serverCustomDomain);
        }
        setCustomDomain(serverCustomDomain);
        return Promise.resolve(serverCustomDomain);
      })
      .catch((err) => console.log('Failed fetching custom domain', err))
      .finally(() => setIsLoading(false));
  }, [customDomain]);

  return { isLoading, customDomain };
};

export default useInitApp;
