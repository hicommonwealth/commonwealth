import axios from 'axios';
import React, { useEffect } from 'react';
import app, { initAppState } from 'state';

const useInitApp = () => {
  const [loading, setLoading] = React.useState(false);
  const [customDomain, setCustomDomain] = React.useState('');

  useEffect(() => {
    setLoading(true);

    console.log('Checking if on native device');
    console.log(app.isNative(window));

    const domainFetch = axios
      .get(`${app.serverUrl()}/domain`)
      .then((res) => res.data)
      .then(({ customDomain: serverCustomDomain }) => {
        console.log('Not on native device, setting custom domain.');
        setCustomDomain(serverCustomDomain);
        return Promise.resolve(serverCustomDomain);
      })
      .catch((err) => console.log('Failed fetching custom domain', err));

    const appStateInit = initAppState(true).catch((err) =>
      console.log('Failed initializing app state', err)
    );

    if (app.isNative(window)) {
      console.log(
        'On native device, skipping custom domain and initializing app state.'
      );
      console.log('Init app here');
      appStateInit.then(() => {
        setLoading(false);
      });
    } else {
      Promise.all([domainFetch, appStateInit])
        .then(([serverCustomDomain]) => {
          console.log('Not on native device, setting custom domain.');
          setCustomDomain(serverCustomDomain);
          return Promise.resolve(serverCustomDomain);
        })
        .catch((err) => console.log('Failed fetching custom domain', err))
        .finally(() => setLoading(false));
    }
  }, []);

  return { loading, customDomain };
};

export default useInitApp;
