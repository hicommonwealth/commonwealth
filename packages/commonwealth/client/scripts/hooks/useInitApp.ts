import { OpenFeature } from '@openfeature/web-sdk';
import { useEffect, useState } from 'react';
import { initAppState } from 'state';
import { initializeFeatureFlags } from '../helpers/feature-flags';
import useGroupMutationBannerStore from '../state/ui/group';

const useInitApp = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { readFromStorageAndSetGatingGroupBannerForCommunities } =
    useGroupMutationBannerStore();

  useEffect(() => {
    // read localstorage and set informational banner for gated communities on the members page group section
    readFromStorageAndSetGatingGroupBannerForCommunities();

    initAppState()
      .then((envVars) => {
        // Initialize feature flags if we have the required token
        if (envVars?.UNLEASH_FRONTEND_API_TOKEN) {
          const provider = initializeFeatureFlags(
            envVars.UNLEASH_FRONTEND_API_TOKEN,
            envVars.HEROKU_APP_NAME || 'commonwealthapp',
          );
          OpenFeature.setProvider(provider);
        }
      })
      .catch((err) => console.log('App initialization failed', err))
      .finally(() => setIsLoading(false));
  }, [readFromStorageAndSetGatingGroupBannerForCommunities]);

  return { isLoading };
};

export default useInitApp;
