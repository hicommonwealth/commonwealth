import { getBrowserType } from 'helpers/browser';
import useAppStatus from 'hooks/useAppStatus';

// enable/disable safari support. This doesn't really need to be a feature flag
// because when we enable Safari, we're going to have so work on a larger patch
// *anyway* due to the fact that Knock doesn't support push notifications with
// Safari in the browser.
const SAFARI_ENABLED = false;

export const useSupportsPushNotifications = () => {
  const { isAddedToHomeScreen } = useAppStatus();

  const browserType = getBrowserType();

  if (browserType === 'safari' && isAddedToHomeScreen) {
    // Safari only works if we've added it as a PWA
    return SAFARI_ENABLED;
  }

  return browserType === 'chrome';
};
