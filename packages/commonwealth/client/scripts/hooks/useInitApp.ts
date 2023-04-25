import React, { useEffect } from 'react';
import { initAppState } from 'state';
import app from 'state';

const useInitApp = () => {
  const [loading, setLoading] = React.useState(false);
  const [customDomain, setCustomDomain] = React.useState('');

  useEffect(() => {
    setLoading(true);

    console.log('Checking if on native device');
    console.log(app.isNative(window))

    if (app.isNative(window)) {
      console.log('On native device, skipping custom domain and initializing app state.');
      initAppState(true, '');
      setLoading(false);
    } else {
      fetch('/api/domain')
        .then((res) => res.json())
        .then(({ customDomain: serverCustomDomain }) => {
          console.log('Not on native device, setting custom domain.');
          setCustomDomain(serverCustomDomain);
          return Promise.resolve(serverCustomDomain);
        })
        .then((serverCustomDomain) => {
          console.log('Initializing app state with custom domain:', serverCustomDomain);
          initAppState(true, serverCustomDomain);
        })
        .catch((err) => {
          console.log('Failed fetching custom domain', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, []);

  return { loading, customDomain };
};

export default useInitApp;