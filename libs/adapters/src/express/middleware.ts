import { AnalyticsOptions, User, analytics } from '@hicommonwealth/core';
import { NextFunction, Request, Response } from 'express';

/**
 * Captures analytics
 */
export function analyticsMiddleware<T>(
  event: string,
  transformer?: (results?: T) => AnalyticsOptions,
) {
  return (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      // override res.json
      const originalResJson = res.json;

      res.json = function (results: T) {
        analytics().track(event, {
          userId: (req.user as User).id,
          aggregateId: req.params.id,
          ...(transformer ? transformer(results) : {}),
        });
        return originalResJson.call(res, results);
      };
    } catch (err: unknown) {
      console.error(err); // don't use logger port here
    }
    next();
  };
}
