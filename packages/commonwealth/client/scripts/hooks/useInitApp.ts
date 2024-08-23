import React, { useEffect } from 'react';
import { initAppState } from 'state';
import { fetchCustomDomainQuery } from 'state/api/configuration';
import useGroupMutationBannerStore from '../state/ui/group';

const useInitApp = () => {
  const [isLoading, setIsLoading] = React.useState(true);
  const { readFromStorageAndSetGatingGroupBannerForCommunities } =
    useGroupMutationBannerStore();

  useEffect(() => {
    // read localstorage and set informational banner for gated communities on the members page group section
    readFromStorageAndSetGatingGroupBannerForCommunities();

    Promise.all([fetchCustomDomainQuery(), initAppState()])
      .catch((err) => console.log('Failed fetching custom domain', err))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isLoading };
};

export default useInitApp;
