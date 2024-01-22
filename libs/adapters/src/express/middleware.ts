import { logger, stats } from '@hicommonwealth/core';
import { INVALID_INPUT_ERROR } from '@hicommonwealth/model';
import { NextFunction, Request, Response } from 'express';
import { BadRequest, InternalServerError } from './http';

const log = logger().getLogger(__filename);

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
    err instanceof Error
      ? log.error(err.message, err)
      : log.error(err as string);
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
  log.error(error.message, error);
  if (res.headersSent) return next(error);

  let response = InternalServerError(
    typeof error === 'string' ? error : 'Oops, something went wrong!',
  );
  if (error instanceof Error) {
    const { name, message, stack } = error;
    switch (name) {
      case INVALID_INPUT_ERROR:
        response = BadRequest(message, 'details' in error && error.details);
    }
    response = InternalServerError(message, stack);
  }
  res.status(response.status).send(response);
};
