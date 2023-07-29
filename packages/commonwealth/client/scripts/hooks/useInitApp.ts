import React, { useEffect } from 'react';
import { initAppState } from 'state';
import app from 'state';

const useInitApp = () => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [customDomain, setCustomDomain] = React.useState('');

  useEffect(() => {
    setIsLoading(true);

    console.log('Checking if on native device');
    console.log(app.platform());

    if (app.platform() !== 'web') {
      console.log(
        'On native device or desktop, skipping custom domain and initializing app state.'
      );
      initAppState(true).then(() => {
        setIsLoading(false);
      });
    } else {
      fetch('/api/domain')
        .then((res) => res.json())
        .then(({ customDomain: serverCustomDomain }) => {
          console.log('Not on native device, setting custom domain.');
          setCustomDomain(serverCustomDomain);
          return Promise.resolve(serverCustomDomain);
        })
        .then((serverCustomDomain) => initAppState(true, serverCustomDomain))
        .catch((err) => console.log('Failed fetching custom domain', err))
        .finally(() => setIsLoading(false));
    }
  }, []);

  return { isLoading, customDomain };
};

export default useInitApp;
