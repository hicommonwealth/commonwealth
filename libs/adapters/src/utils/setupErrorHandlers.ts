import type { Express, Request, Response } from 'express';
import type Rollbar from 'rollbar';
import { AppError, ServerError } from '../errors';

// Handle server and application errors.
// 401 Unauthorized errors are handled by Express' middleware and returned
// before this handler. Errors that hit the final condition should be either
// (1) thrown as ServerErrors or AppErrors or (2) triaged as a critical bug.
export const setupErrorHandlers = (app: Express, rollbar: Rollbar) => {
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
  app.use((error, req, res: Response, next) => {
    if (error instanceof ServerError) {
      console.trace(error);
      // if the original error is given when creating the ServerError instance then pass its message to Rollbar
      if (error.error?.message) {
        rollbar.error(error, req, { OriginalError: error.error.message });
      } else rollbar.error(error, req);
      res.status(error.status).send({
        status: error.status,
        // Use external facing error message
        error: 'Server error, please try again later.',
      });
    } else if (error instanceof AppError) {
      rollbar.log(error, req); // expected application/user error
      res.status(error.status).send({
        status: error.status,
        error: error.message,
      });
    } else {
      console.trace(error);
      rollbar.critical(error, req); // unexpected error
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
