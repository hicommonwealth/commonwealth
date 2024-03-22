/* eslint-disable dot-notation */
import {
  CacheDecorator,
  RedisCache,
  setupErrorHandlers,
} from '@hicommonwealth/adapters';
import { cache, dispose, logger } from '@hicommonwealth/core';
import type { DB, E2E_TestEntities } from '@hicommonwealth/model';
import SessionSequelizeStore from 'connect-session-sequelize';
import cookieParser from 'cookie-parser';
import express, { RequestHandler, json, urlencoded } from 'express';
import session from 'express-session';
import http from 'http';
import passport from 'passport';
import favicon from 'serve-favicon';
import { SESSION_SECRET } from './server/config';
import DatabaseValidationService from './server/middleware/databaseValidationService';
import setupPassport from './server/passport';
import setupAPI from './server/routing/router'; // performance note: this takes 15 seconds
import BanCache from './server/util/banCheckCache';
import setupCosmosProxy from './server/util/cosmosProxy';
import GlobalActivityCache from './server/util/globalActivityCache';
import ViewCountCache from './server/util/viewCountCache';
import { ModelSeeder, modelSeeder } from './test/util/modelUtils';

/**
 * Encapsulates all the infrastructure required for integration testing, including:
 * - app: Express app exposing server endpoints
 * - cacheDecorator: Redis cache decorator used to cache requests
 * - models: Direct access to the sequelize models
 * - seeder: Model seeding utilities
 * - e2eTestEntities: Some integrations are coupled with entities generated in e2e tests 😱
 *
 * @remarks An pre-seeded test db is generated for each test
 * @deprecated Not a good practice to generalize and hide test details, use new `seed` instead
 */
export type TestServer = {
  app: express.Express;
  cacheDecorator: CacheDecorator;
  models: DB;
  seeder: ModelSeeder;
  e2eTestEntities: E2E_TestEntities;
  truncate: () => Promise<void>;
};

export const testServer = async (): Promise<TestServer> => {
  const { tester } = await import('@hicommonwealth/model');
  const models = await tester.seedDb();

  const log = logger().getLogger(__filename);
  cache(new RedisCache('redis://localhost:6379'));
  const cacheDecorator = new CacheDecorator();
  const app = express();
  const SequelizeStore = SessionSequelizeStore(session.Store);

  // set cache TTL to 1 second to test invalidation
  const viewCountCache = new ViewCountCache(1, 10 * 60);
  const databaseValidationService = new DatabaseValidationService(models);
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
  app.use(json() as RequestHandler);
  app.use(urlencoded({ extended: false }) as RequestHandler);
  app.use(cookieParser());
  app.use(sessionParser);
  app.use(passport.initialize());
  app.use(passport.session());

  const port = 8081;
  app.set('port', port);
  const server = http.createServer(app);
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

  const banCache = new BanCache(models);
  const globalActivityCache = new GlobalActivityCache(models);
  globalActivityCache.start();

  setupPassport(models);
  setupAPI(
    '/api',
    app,
    models,
    viewCountCache,
    banCache,
    globalActivityCache,
    databaseValidationService,
  );
  setupCosmosProxy(app, models, cacheDecorator);
  setupErrorHandlers(app);

  const seeder = modelSeeder(app, models);

  // seed these too
  const e2eTestEntities = await tester.e2eTestEntities(models);

  // auto dispose server
  dispose(async () => {
    await server.close();
  });

  return {
    app,
    cacheDecorator,
    models,
    seeder,
    e2eTestEntities,
    truncate: () => tester.truncate_db(models),
  };
};
