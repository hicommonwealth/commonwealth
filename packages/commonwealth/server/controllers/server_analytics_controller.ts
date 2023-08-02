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
  const browserInfo = {};
  const userAgent = (req as any).useragent || {};
  for (const [k, v] of Object.entries(userAgent)) {
    if (k.startsWith('is') && v) {
      browserInfo[k] = v;
    } else if (typeof v === 'string') {
      browserInfo[k] = v;
    }
  }
  return browserInfo;
}
