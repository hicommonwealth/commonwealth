import bodyParser from 'body-parser';
import { factory, formatFilename } from 'common-common/src/logging';
import cors from 'cors';
import express from 'express';
import logger from 'morgan';
import passport from 'passport';
import { DEFAULT_PORT } from '../config';
import models from '../database/database';
import setupPassport from './passport';
import setupRouter from './router';

const log = factory.getLogger(formatFilename(__filename));

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
