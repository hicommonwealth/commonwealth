import { AnalyticsOptions, User, analytics, stats } from '@hicommonwealth/core';
import { NextFunction, Request, Response } from 'express';

/**
 * Captures traffic and latency
 */
export const statsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const path = `${req.method.toUpperCase()} ${req.path}`;
    stats().increment('cw.path.called', { path });
    const start = Date.now();
    res.on('finish', () => {
      const latency = Date.now() - start;
      stats().histogram(`cw.path.latency`, latency, {
        path,
        statusCode: `${res.statusCode}`,
      });
    });
  } catch (err: unknown) {
    console.error(err); // don't use logger port here
  }
  next();
};

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
