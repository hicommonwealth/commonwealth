import { BrowserTypes, parseUserAgent } from 'react-device-detect';

type BrowserInfo = {
  name: typeof BrowserTypes & 'Unknown';
  version: string;
  isMobile: boolean;
};

/**
 * Detects the browsers vender i.e google/safari etc, version number i.e 12.5, and if the browser
 * is used in mobile device or web platform.
 * This is different from detecting the rendering engine i.e chromium/spider-monkey/webkit etc
 */
export const getBrowserInfo = (): BrowserInfo => {
  const userAgent = parseUserAgent(navigator.userAgent);

  const browserInfo: BrowserInfo = {
    name: userAgent?.browser?.name || 'Unknown',
    version: userAgent?.browser?.version || 'Unknown',
    isMobile: /Mobi/.test(userAgent), // mobile browsers have `Mobi` in user agent string
  };

  return browserInfo;
};
