import { getBrowserType } from 'helpers/browser';
import useAppStatus from 'hooks/useAppStatus';

export const useSupportsPushNotifications = () => {
  const { isAddedToHomeScreen } = useAppStatus();

  const browserType = getBrowserType();

  if (browserType === 'safari' && isAddedToHomeScreen) {
    // Safari only works if we've added it as a PWA
    return true;
  }

  return browserType === 'chrome';
};
