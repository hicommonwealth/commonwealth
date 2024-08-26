import { useEffect, useState } from 'react';
import { initAppState } from 'state';
import useGroupMutationBannerStore from '../state/ui/group';

const useInitApp = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { readFromStorageAndSetGatingGroupBannerForCommunities } =
    useGroupMutationBannerStore();

  useEffect(() => {
    // read localstorage and set informational banner for gated communities on the members page group section
    readFromStorageAndSetGatingGroupBannerForCommunities();

    initAppState()
      .catch((err) => console.log('App initialization failed', err))
      .finally(() => setIsLoading(false));
  }, [readFromStorageAndSetGatingGroupBannerForCommunities]);

  return { isLoading };
};

export default useInitApp;
