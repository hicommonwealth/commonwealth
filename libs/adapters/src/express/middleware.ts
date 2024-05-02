import {
  INVALID_ACTOR_ERROR,
  INVALID_INPUT_ERROR,
  User,
  analytics,
  stats,
} from '@hicommonwealth/core';
import { AnalyticsOptions } from '@hicommonwealth/shared';
import { NextFunction, Request, Response } from 'express';
import { BadRequest, InternalServerError, Unauthorized } from './http';

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
      stats().histogram(`cw.path.latency`, latency, { path });
    });
  } catch (err: unknown) {
    console.error(err); // don't use logger port here
  }
  next();
};

/**
 * Express error response handler
 */
export const errorMiddleware = (
  error: Error,
  _: Request,
  res: Response,
  next: NextFunction,
): void => {
  console.error(error); // don't use logger port here
  if (res.headersSent) return next(error);

  let response = InternalServerError(
    typeof error === 'string' ? error : 'Oops, something went wrong!',
  );
  if (error instanceof Error) {
    const { name, message, stack } = error;
    switch (name) {
      case INVALID_INPUT_ERROR:
        response = BadRequest(message, 'details' in error && error.details);
        break;

      case INVALID_ACTOR_ERROR:
        response = Unauthorized(message);
        break;

      default:
        response = InternalServerError(
          message,
          process.env.NODE_ENV !== 'production' ? stack : undefined,
        );
    }
  }
  res.status(response.status).send(response);
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
