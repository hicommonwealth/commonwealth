import axios from 'axios';
import React, { useEffect } from 'react';
import app, { initAppState } from 'state';
import useAdminOnboardingSliderMutationStore from '../state/ui/adminOnboardingCards';
import useGroupMutationBannerStore from '../state/ui/group';

const useInitApp = () => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [customDomain, setCustomDomain] = React.useState('');
  const { readFromStorageAndSetGatingGroupBannerForCommunities } =
    useGroupMutationBannerStore();
  const { readFromStorageAndSetAdminOnboardingCardVisibilityForCommunities } =
    useAdminOnboardingSliderMutationStore();

  useEffect(() => {
    // read localstorage and set informational banner for gated communities on the members page group section
    readFromStorageAndSetGatingGroupBannerForCommunities();

    // read localstorage and set visibility for admin onboarding cards on all page
    readFromStorageAndSetAdminOnboardingCardVisibilityForCommunities();

    Promise.all([axios.get(`${app.serverUrl()}/domain`), initAppState()])
      .then(([domainResp]) => {
        const serverCustomDomain = domainResp.data.customDomain;
        if (serverCustomDomain) {
          app.setCustomDomain(serverCustomDomain);
        }
        setCustomDomain(serverCustomDomain);
        return Promise.resolve(serverCustomDomain);
      })
      .catch((err) => console.log('Failed fetching custom domain', err))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isLoading, customDomain };
};

export default useInitApp;
