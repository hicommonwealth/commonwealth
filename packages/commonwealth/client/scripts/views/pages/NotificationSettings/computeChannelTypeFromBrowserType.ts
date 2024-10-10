import { BrowserType } from 'helpers/browser';

/**
 * Compute the channel for Knock notifications.  Firebase cloud messaging or
 * Apple.
 */
export function computeChannelTypeFromBrowserType(
  browserType: BrowserType | undefined,
): 'FCM' | 'APNS' | undefined {
  switch (browserType) {
    case 'safari':
      return 'APNS';
    case 'chrome':
      return 'FCM';
  }

  return undefined;
}
