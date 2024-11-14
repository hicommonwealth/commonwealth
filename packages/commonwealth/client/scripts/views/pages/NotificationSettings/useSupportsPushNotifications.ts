import { getBrowserType } from 'helpers/browser';
import useAppStatus from 'hooks/useAppStatus';

const SAFARI_ENABLED = true;

export const useSupportsPushNotifications = () => {
  const { isAddedToHomeScreen } = useAppStatus();

  const browserType = getBrowserType();

  if (browserType === 'safari' && isAddedToHomeScreen) {
    // Safari only works if we've added it as a PWA
    return SAFARI_ENABLED;
  }

  return browserType === 'chrome';
};
