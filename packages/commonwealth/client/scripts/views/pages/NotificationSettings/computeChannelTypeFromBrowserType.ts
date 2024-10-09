import { BrowserType } from 'helpers/browser';

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
