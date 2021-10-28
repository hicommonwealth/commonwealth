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

  // Production rollbar notifications
  if (process.env.NODE_ENV === 'production') {
    const rollbar = new Rollbar({
      accessToken: ROLLBAR_SERVER_TOKEN,
      environment: process.env.NODE_ENV,
      captureUncaught: true,
      captureUnhandledRejections: true,
    });
    app.use(rollbar.errorHandler());
  }

  // Handle server and application errors
  app.use((error, req, res, next) => {
    if (error instanceof ServerError) {
      // rollbar.log(error); TODO but as server error
      res.status(error.status).send({
        error: {
          status: error.status,
          // Use external facing error message
          message: 'Server error, please try again later.',
        },
      });
    } else if (error instanceof AppError) {
      // rollbar.log(error); TOOD: but as application error
      res.status(error.status).send({
        error: {
          status: error.status,
          message: error.message,
        },
      });
    } else {
      res.status(error.status || 400);
      res.json({
        error: {
          status: error.status,
          message: error.message,
        },
      });
    }
  });
};

export default setupErrorHandlers;
