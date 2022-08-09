import Rollbar from 'rollbar';
import { Request, Response, Express } from 'express';
import { ROLLBAR_SERVER_TOKEN } from '../config';
import { ServerError, AppError } from '../util/errors';

// Handle server and application errors.
// 401 Unauthorized errors are handled by Express' middleware and returned
// before this handler. Errors that hit the final condition should be either
// (1) thrown as ServerErrors or AppErrors or (2) triaged as a critical bug.
const setupErrorHandlers = (app: Express, rollbar: Rollbar) => {
  // Rollbar notifications
  app.use(rollbar.errorHandler());

  // Handle 404 errors
  app.use((req: Request, res: Response, next) => {
    res.status(404);
    res.json({
      status: 404,
      error: 'The server can not find the requested resource.',
    });
  });

  // Handle our ServerErrors (500), AppErrors (400), or unknown errors.
  app.use((error, req, res: Response, next) => {
    if (error instanceof ServerError) {
      console.trace(error);
      rollbar.error(error); // expected server error
      res.status(error.status).send({
        status: error.status,
        // Use external facing error message
        error: 'Server error, please try again later.',
      });
    } else if (error instanceof AppError) {
      rollbar.log(error); // expected application/user error
      res.status(error.status).send({
        status: error.status,
        error: error.message,
      });
    } else {
      console.trace(error);
      rollbar.critical(error); // unexpected error
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

export default setupErrorHandlers;
