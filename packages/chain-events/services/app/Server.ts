import express, { Request, Response } from "express";
import { factory, formatFilename } from 'common-common/src/logging'
import bodyParser from 'body-parser'
import passport from "passport";
import setupPassport from "./passport";
import setupRouter from "./router";
import models from "../database/database";
import {DEFAULT_PORT, SERVER_URL} from "../config";
import logger from 'morgan';
import cors from 'cors'


const log = factory.getLogger(formatFilename(__filename));

const port = process.env.PORT || DEFAULT_PORT;

const app = express();

setupPassport();

const allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}

/**
 * Entry point for the ChainEvents App
 */
async function main() {
  app.use(logger('dev'));
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json({ limit: '1mb' }));
  app.use(passport.initialize());
  // app.use(allowCrossDomain);

  // app.use(cors({
  //   origin: "*",
  //   methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  //   preflightContinue: true,
  //   optionsSuccessStatus: 200
  // }));
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
