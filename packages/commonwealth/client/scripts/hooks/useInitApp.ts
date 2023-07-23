import React, { useEffect } from 'react';
import { initAppState } from 'state';
import app from 'state';
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: 'AIzaSyA93Av0xLkOB_nP9hyzhGYg78n9JEfS1bQ',
  authDomain: 'common-staging-384806.firebaseapp.com',
  projectId: 'common-staging-384806',
  storageBucket: 'common-staging-384806.appspot.com',
  messagingSenderId: '158803639844',
  appId: '1:158803639844:web:b212938a52d995c6d862b1',
  measurementId: 'G-4PNZZQDNFE',
  vapidKey:
    'BDMNzw-2Dm1HcE9hFr3T4Li_pCp_w7L4tCcq-OETD71J1DdC0VgIogt6rC8Hh0bHtTacyZHSoQ1ax5KCU4ZjS30',
};

const useInitApp = () => {
  const [loading, setLoading] = React.useState(false);
  const [customDomain, setCustomDomain] = React.useState('');
  const [firebaseInitialized, setFirebaseInitialized] = React.useState(false);

  useEffect(() => {
    setLoading(true);

    console.log('Checking if on native device');
    console.log(app.isNative(window));

    // Initialize Firebase only once
    if (!firebaseInitialized) {
      initializeApp(firebaseConfig);
      setFirebaseInitialized(true);
    }

    if (app.isNative(window)) {
      console.log(
        'On native device, skipping custom domain and initializing app state.'
      );
      console.log('Init app here');
      initAppState(true).then(() => {
        setLoading(false);
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
        .finally(() => setLoading(false));
    }
  }, []);

  return { loading, customDomain };
};

export default useInitApp;
