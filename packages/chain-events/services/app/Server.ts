import express, { Express } from 'express';
import bodyParser from 'body-parser';
import passport from 'passport';
import logger from 'morgan';
import cors from 'cors';
import v8 from 'v8';

import models from '../database/database';
import { DEFAULT_PORT } from '../config';

import setupPassport from './passport';
import setupRouter from './router';
import { factory, formatFilename } from 'common-common/src/logging';

const log = factory.getLogger(formatFilename(__filename));
log.info(
  `Node Option max-old-space-size set to: ${JSON.stringify(
    v8.getHeapStatistics().heap_size_limit / 1000000000
  )} GB`
);

const port = process.env.PORT || DEFAULT_PORT;

/**
 * Entry point for the ChainEvents App
 */
export async function createChainEventsApp(): Promise<Express> {
  const app = express();
  setupPassport();

  app.use(logger('dev'));
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json({ limit: '1mb' }));
  app.use(passport.initialize());

  app.use(cors());

  // cors pre-flight request
  app.options('*', cors());

  const router = setupRouter(models);
  app.use('/api', router);
  app.set('port', port);

  const onError = (error) => {
    if (error.syscall !== 'listen') {
      throw error;
    }
    switch (error.code) {
      case 'EACCES':
        log.error('Port requires elevated privileges');
        process.exit(1);
        break;
      case 'EADDRINUSE':
        log.error(`Port ${port} is already in use`);
        process.exit(1);
        break;
      default:
        throw error;
    }
  };

  app.on('error', onError);

  return app;
}

if (require.main === module) {
  createChainEventsApp().then((app) => {
    app.listen(port, () => {
      log.info(`Chain events server listening on port ${port}`);
    });
  });
}
