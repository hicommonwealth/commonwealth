import { TrackOptions, __track } from './server_analytics_methods/track';

export class ServerAnalyticsController {
  /**
   * Tracks an analytics event.
   * Can optionally pass a request object to add browser info to event.
   */
  async track(options: TrackOptions, req?: any) {
    let newOptions = { ...options };
    if (req) {
      const browserInfo = getRequestBrowserInfo(req);
      newOptions = {
        ...newOptions,
        ...browserInfo,
      };
    }
    return __track.call(this, newOptions);
  }
}

/**
 * Returns a record containing condensed browser info.
 * Expects the 'express-useragent' middleware to be
 * applied to the route.
 */
function getRequestBrowserInfo(req: any): Record<string, any> {
  if (!req.useragent) {
    return {};
  }
  if (Object.keys(req.useragent).length === 0) {
    return {};
  }
  // take the useragent data and pick certain entries to add to browserInfo
  const browserInfo = {};
  const userAgent = (req as any).useragent || {};
  for (const [k, v] of Object.entries(userAgent)) {
    if (k.startsWith('is') && v) {
      // for keys like 'isChrome' and 'isFirefox', only include them if the value is true
      browserInfo[k] = v;
    } else if (typeof v === 'string') {
      // or include any entry where the value is a string
      browserInfo[k] = v;
    }
  }
  // manually check for Brave since middleware thinks Brave is Chrome
  const brand = req.headers['sec-ch-ua'];
  if (typeof brand === 'string' && brand.includes('Brave')) {
    delete browserInfo['isChrome'];
    browserInfo['isBrave'] = true;
    browserInfo['browser'] = 'Brave';
  }
  return browserInfo;
}
