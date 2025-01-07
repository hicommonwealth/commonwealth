import { BrowserType } from 'helpers/browser';

const SAFARI_USES_FCM = true;

const isReactNative = !!window.ReactNativeWebView;

/**
 * Compute the channel for Knock notifications.  Firebase cloud messaging or
 * Apple.
 */
export function computeChannelTypeFromBrowserType(
  browserType: BrowserType | undefined,
): 'FCM' | 'APNS' | undefined {
  if (isReactNative) {
    return undefined;
  }

  switch (browserType) {
    case 'safari':
      return SAFARI_USES_FCM ? 'FCM' : 'APNS';
    case 'chrome':
      return 'FCM';
  }

  return undefined;
}
