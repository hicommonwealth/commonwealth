/* eslint-disable dot-notation */
import bodyParser from 'body-parser';
import setupErrorHandlers from 'common-common/src/scripts/setupErrorHandlers';
import SessionSequelizeStore from 'connect-session-sequelize';
import cookieParser from 'cookie-parser';
import type { Express } from 'express';
import express from 'express';
import session from 'express-session';
import http from 'http';
import passport from 'passport';
import Rollbar from 'rollbar';
import favicon from 'serve-favicon';
import setupAPI from './server/routing/router'; // performance note: this takes 15 seconds

import {
  ROLLBAR_ENV,
  ROLLBAR_SERVER_TOKEN,
  SESSION_SECRET,
  TBC_BALANCE_TTL_SECONDS,
} from './server/config';
import models from './server/database';
import DatabaseValidationService from './server/middleware/databaseValidationService';
import setupPassport from './server/passport';
import BanCache from './server/util/banCheckCache';
import setupCosmosProxy from './server/util/cosmosProxy';
import GlobalActivityCache from './server/util/globalActivityCache';
import ViewCountCache from './server/util/viewCountCache';

import {
  CustomRequest,
  lookupKeyDurationInReq,
} from '../common-common/src/cacheKeyUtils';

import { formatFilename, loggerFactory } from '@hicommonwealth/adapters';
import { cacheDecorator } from 'common-common/src/cacheDecorator';
import { ServerError } from 'common-common/src/errors';
import { RedisCache } from 'common-common/src/redisCache';
import { TokenBalanceCache } from './server/util/tokenBalanceCache/tokenBalanceCache';

const log = loggerFactory.getLogger(formatFilename(__filename));

require('express-async-errors');

const app = express();
const SequelizeStore = SessionSequelizeStore(session.Store);
// set cache TTL to 1 second to test invalidation
const viewCountCache = new ViewCountCache(1, 10 * 60);
const tokenBalanceCache = new TokenBalanceCache(
  models,
  null as RedisCache,
  TBC_BALANCE_TTL_SECONDS,
);
const databaseValidationService = new DatabaseValidationService(models);
let server;

const sessionStore = new SequelizeStore({
  db: models.sequelize,
  tableName: 'Sessions',
  checkExpirationInterval: 15 * 60 * 1000, // Clean up expired sessions every 15 minutes
  expiration: 7 * 24 * 60 * 60 * 1000, // Set session expiration to 7 days
});

sessionStore.sync();

const sessionParser = session({
  secret: SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: true,
});

// serve static files
app.use(favicon(`${__dirname}/favicon.ico`));
app.use('/static', express.static('static'));

// add other middlewares
// app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(sessionParser);
app.use(passport.initialize());
app.use(passport.session());

const setupServer = () => {
  const port = 8081;
  app.set('port', port);
  server = http.createServer(app);
  const onError = (error) => {
    if (error.syscall !== 'listen') {
      throw error;
    }
    switch (error.code) {
      case 'EACCES':
        console.error('Port requires elevated privileges');
        process.exit(1);
      // eslint-disable-next-line no-fallthrough
      case 'EADDRINUSE':
        console.error(`Port ${port} already in use`);
        process.exit(1);
      // eslint-disable-next-line no-fallthrough
      default:
        throw error;
    }
  };

  const onListen = () => {
    const addr = server.address();
    if (typeof addr === 'string') {
      log.info(`Listening on ${addr}`);
    } else {
      log.info(`Listening on port ${addr.port}`);
    }
  };

  server.listen(port);
  server.on('error', onError);
  server.on('listening', onListen);
};

export enum CACHE_ENDPOINTS {
  BROKEN_5XX = '/cachedummy/broken5xx',
  BROKEN_4XX = '/cachedummy/broken4xx',
  JSON = '/cachedummy/json',
  TEXT = '/cachedummy/text',
  CUSTOM_KEY_DURATION = '/cachedummy/customKeyDuration',
}

export const setupCacheTestEndpoints = (appAttach: Express) => {
  // /cachedummy endpoint for testing
  appAttach.get(
    CACHE_ENDPOINTS.BROKEN_4XX,
    cacheDecorator.cacheMiddleware(3),
    async (req, res) => {
      log.info(`${CACHE_ENDPOINTS.BROKEN_4XX} called`);
      res.status(400).json({ message: 'cachedummy 400 response' });
    },
  );

  appAttach.get(
    CACHE_ENDPOINTS.JSON,
    cacheDecorator.cacheMiddleware(3),
    async (req, res) => {
      log.info(`${CACHE_ENDPOINTS.JSON} called`);
      res.json({ message: 'cachedummy response' });
    },
  );

  appAttach.post(
    CACHE_ENDPOINTS.CUSTOM_KEY_DURATION,
    (req: CustomRequest, res, next) => {
      log.info(`${CACHE_ENDPOINTS.CUSTOM_KEY_DURATION} called`);
      const body = req.body;
      if (!body || !body.duration || !body.key) {
        return next();
      }
      req.cacheKey = body.key;
      req.cacheDuration = body.duration;
      return next();
    },
    cacheDecorator.cacheMiddleware(3, lookupKeyDurationInReq),
    async (req, res) => {
      res.json(req.body);
    },
  );

  // Uncomment the following lines if you want to use the /cachedummy/json route
  // app.post('/cachedummy/json', cacheDecorator.cacheInvalidMiddleware(3), async (req, res) => {
  //   res.json({ 'message': 'cachedummy response' });
  // });

  appAttach.get(
    CACHE_ENDPOINTS.TEXT,
    cacheDecorator.cacheMiddleware(3),
    async function cacheTextEndpoint(req, res) {
      log.info(`${CACHE_ENDPOINTS.TEXT} called`);
      res.send('cachedummy response');
    },
  );

  appAttach.get(
    CACHE_ENDPOINTS.BROKEN_5XX,
    cacheDecorator.cacheMiddleware(3),
    async (req, res, next) => {
      log.info(`${CACHE_ENDPOINTS.BROKEN_5XX} called`);
      const err = new Error('route error');
      return next(new ServerError('broken route', err));
    },
  );
};

const banCache = new BanCache(models);
const redisCache = new RedisCache();
const globalActivityCache = new GlobalActivityCache(models, redisCache);
globalActivityCache.start();

setupPassport(models);
setupAPI(
  '/api',
  app,
  models,
  viewCountCache,
  tokenBalanceCache,
  banCache,
  globalActivityCache,
  databaseValidationService,
  redisCache,
);
setupCosmosProxy(app, models);
setupCacheTestEndpoints(app);

const rollbar = new Rollbar({
  accessToken: ROLLBAR_SERVER_TOKEN,
  environment: ROLLBAR_ENV,
  captureUncaught: true,
  captureUnhandledRejections: true,
});

setupErrorHandlers(app, rollbar);
setupServer();

export { resetDatabase } from './test/util/resetDatabase';

export default app;
