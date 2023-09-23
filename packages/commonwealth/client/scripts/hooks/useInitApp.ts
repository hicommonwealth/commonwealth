import axios from 'axios';
import React, { useEffect } from 'react';
import app, { initAppState } from 'state';

const useInitApp = () => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [customDomain, setCustomDomain] = React.useState('');

  useEffect(() => {
    setIsLoading(true);
    console.log('Checking if on native device');
    console.log(app.platform());

    const domainPromise = app.platform() !== 'web'
      ? Promise.resolve('')
      : fetch('/api/domain')
          .then((res) => res.json())
          .then(({ customDomain: serverCustomDomain }) => {
            console.log('Not on native device, setting custom domain.');
            setCustomDomain(serverCustomDomain);
            return serverCustomDomain;
          })
          .catch((err) => {
            console.log('Failed fetching custom domain', err);
            return '';
          });

    Promise.all([domainPromise, initAppState(true)])
      .then(([serverCustomDomain]) => {
        if (app.platform() !== 'web') {
          console.log(
            'On native device or desktop, skipping custom domain and initializing app state.'
          );
        }
        return serverCustomDomain;
      })
      .finally(() => setIsLoading(false));
  }, []);

  return { isLoading, customDomain };
};

export default useInitApp;
