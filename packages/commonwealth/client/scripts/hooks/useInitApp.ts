import React, { useEffect } from 'react';
import { initAppState } from 'state';

const useInitApp = () => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [customDomain, setCustomDomain] = React.useState('');

  useEffect(() => {
    fetch('/api/domain')
      .then((res) => res.json())
      .then(({ customDomain: serverCustomDomain }) => {
        setCustomDomain(serverCustomDomain);
        return Promise.resolve(serverCustomDomain);
      })
      .then((serverCustomDomain) => initAppState(true, serverCustomDomain))
      .catch((err) => console.log('Failed fetching custom domain', err))
      .finally(() => setIsLoading(false));
  }, []);

  return { isLoading, customDomain };
};

export default useInitApp;
