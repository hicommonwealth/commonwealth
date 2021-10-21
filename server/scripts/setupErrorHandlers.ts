import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

const setupErrorHandlers = (app, rollbar) => {
  // catch 404 and forward to error handler
  app.use((req, res, next) => {
    console.log('Inside this use A');
    const err: any = new Error('Not Found');
    err.status = 404;
    next(err);
  });

  // error handler
  if (process.env.NODE_ENV === 'production') {
    app.use(rollbar.errorHandler());
  }

  app.use((err, req, res, next) => {
    console.log('inside the other use B');
    log.error(err.stack);
    console.log(err);
    console.log(err.status);
    res.status(err.status || 400);
    res.json({ error: err.message });
  });
};

export default setupErrorHandlers;
