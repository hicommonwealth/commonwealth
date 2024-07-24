import { getBrowserType } from 'helpers/browser';

export function supportsPushNotifications() {
  const browserType = getBrowserType();
  return browserType === 'chrome' || browserType === 'safari';
}
