import Rollbar from 'rollbar';
import { ROLLBAR_SERVER_TOKEN } from '../config';
import { ServerError, AppError } from '../util/errors';

const setupErrorHandlers = (app) => {
  // Handle 404 errors
  app.use((req, res, next) => {
    const error: any = new Error('Not found');
    error.status = 404;
    next(error);
  });

  // Rollbar notifications
  const rollbar = new Rollbar({
    accessToken: ROLLBAR_SERVER_TOKEN,
    environment: process.env.NODE_ENV,
    captureUncaught: true,
    captureUnhandledRejections: true,
  });
  app.use(rollbar.errorHandler());

  // Handle server and application errors.
  // 401 Unauthorized errors are handled by Express' middleware and returned
  // before this handler.
  // Errors that hit the final condition should be either (1) thrown as
  // ServerErrors or AppErrors or (2) triaged as a bug.
  app.use((error, req, res, next) => {
    console.log('hit error handler');
    if (error instanceof ServerError) {
      console.log('ServerError', error);
      rollbar.error(error); // expected server error
      res.status(error.status).send({
        error: {
          status: error.status,
          // Use external facing error message
          message: 'Server error, please try again later.',
        },
      });
    } else if (error instanceof AppError) {
      rollbar.log(error); // expected application/user error
      console.log('AppError', error);
      res.status(error.status).send({
        error: {
          status: error.status,
          message: error.message,
        },
      });
    } else if (error.status === 404) {
      res.status(error.status);
      res.json({
        error: {
          status: error.status,
          message: 'The server can not find the requested resource.',
        },
      });
    } else {
      rollbar.critical(error); // unexpected error
      console.log('Other Error', error);
      res.status(500);
      res.json({
        error: {
          status: error.status,
          message:
            error.message ||
            'Server error, unknown error thrown. Please try again later.',
        },
      });
    }
  });
};

export default setupErrorHandlers;
