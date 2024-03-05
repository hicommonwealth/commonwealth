import { AppError, ServerError, logger } from '@hicommonwealth/core';
import type { Express, NextFunction, Request, Response } from 'express';

// Handle server and application errors.
// 401 Unauthorized errors are handled by Express' middleware and returned
// before this handler. Errors that hit the final condition should be either
// (1) thrown as ServerErrors or AppErrors or (2) triaged as a critical bug.
export const setupErrorHandlers = (app: Express) => {
  const log = logger().getLogger(__filename);

  // Handle 404 errors
  app.use((req: Request, res: Response) => {
    res.status(404);
    res.json({
      status: 404,
      error: 'The server can not find the requested resource.',
    });
  });

  // Handle our ServerErrors (500), AppErrors (400), or unknown errors.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((error: any, req: Request, res: Response, next: NextFunction) => {
    error.req = req;
    if (error instanceof ServerError) {
      log.error(error.message, error);
      res.status(error.status).send({
        status: error.status,
        // Use external facing error message
        error: 'Server error, please try again later.',
      });
    } else if (error instanceof AppError) {
      log.warn(error.message, error); // just warn, to avoid overloading rollbar with bots and attacks
      res.status(error.status).send({
        status: error.status,
        error: error.message,
      });
    } else {
      log.error(error.message, error);
      res.status(500);
      res.json({
        status: error.status,
        error:
          error.message ||
          'Server error, unknown error thrown. Please try again later.',
      });
    }
  });
};
