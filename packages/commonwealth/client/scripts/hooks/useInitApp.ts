import React, { useEffect } from 'react';
import { initAppState } from 'state';

const useInitApp = () => {
  const [loading, setLoading] = React.useState(false);
  const [customDomain, setCustomDomain] = React.useState('');

  useEffect(() => {
    setLoading(true);
    fetch('/api/domain')
      .then((res) => res.json())
      .then(({ customDomain: serverCustomDomain }) => {
        setCustomDomain(serverCustomDomain);
        return Promise.resolve(serverCustomDomain);
      })
      .then((serverCustomDomain) => initAppState(true, serverCustomDomain))
      .catch((err) => console.log('Failed fetching custom domain', err))
      .finally(() => setLoading(false));
  }, []);

  return { loading, customDomain };
};

export default useInitApp;
