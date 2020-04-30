import { factory, formatFilename } from '../util/logging';
const log = factory.getLogger(formatFilename(__filename));

const setupErrorHandlers = (app, rollbar) => {
  // catch 404 and forward to error handler
  app.use((req, res, next) => {
    const err : any = new Error('Not Found');
    err.status = 404;
    next(err);
  });
  // error handler
  if (process.env.NODE_ENV === 'production') app.use(rollbar.errorHandler());
  app.use((err, req, res, next) => {
    log.error(err.stack);
    res.status(err.status || 500);
    res.json({ error: err.message });
  });
};

export default setupErrorHandlers;
