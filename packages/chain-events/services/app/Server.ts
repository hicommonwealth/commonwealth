import express from 'express';
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
import {methodNotAllowedMiddleware} from "chain-events/services/app/middleware";

const log = factory.getLogger(formatFilename(__filename));
log.info(
  `Node Option max-old-space-size set to: ${JSON.stringify(
    v8.getHeapStatistics().heap_size_limit / 1000000000
  )} GB`
);

const port = process.env.PORT || DEFAULT_PORT;

export const app = express();

setupPassport();

/**
 * Entry point for the ChainEvents App
 */
async function main() {
  app.use(logger('dev'));
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json({ limit: '1mb' }));
  app.use(passport.initialize());

  app.use(cors());

  // cors pre-flight request
  app.options('*', cors());

  const router = setupRouter(models);
  app.use('/api', router);
  app.use(methodNotAllowedMiddleware());
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
  app.listen(port, () => {
    log.info(`Chain events server listening on port ${port}`);
  });
}

main();
