import {
  RabbitMQController,
  RascalConfigServices,
  RedisCache,
  ServiceKey,
  StatsDController,
  formatFilename,
  getRabbitMQConfig,
  loggerFactory,
  setupErrorHandlers,
  startHealthCheckLoop,
} from '@hicommonwealth/adapters';
import bodyParser from 'body-parser';
import compression from 'compression';
import SessionSequelizeStore from 'connect-session-sequelize';
import cookieParser from 'cookie-parser';
import express from 'express';
import { redirectToHTTPS } from 'express-http-to-https';
import session from 'express-session';
import fs from 'fs';
import logger from 'morgan';
import passport from 'passport';
import prerenderNode from 'prerender-node';
import type { BrokerConfig } from 'rascal';
import Rollbar from 'rollbar';
import favicon from 'serve-favicon';
import * as v8 from 'v8';
import {
  DATABASE_CLEAN_HOUR,
  PRERENDER_TOKEN,
  RABBITMQ_URI,
  REDIS_URL,
  ROLLBAR_ENV,
  ROLLBAR_SERVER_TOKEN,
  SERVER_URL,
  SESSION_SECRET,
  TBC_BALANCE_TTL_SECONDS,
} from './server/config';
import models from './server/database';
import DatabaseValidationService from './server/middleware/databaseValidationService';
import setupPassport from './server/passport';
import { addSwagger } from './server/routing/addSwagger';
import { addExternalRoutes } from './server/routing/external';
import setupAPI from './server/routing/router';
import { sendBatchedNotificationEmails } from './server/scripts/emails';
import setupAppRoutes from './server/scripts/setupAppRoutes';
import expressStatsdInit from './server/scripts/setupExpressStats';
import setupServer from './server/scripts/setupServer';
import BanCache from './server/util/banCheckCache';
import setupCosmosProxy from './server/util/cosmosProxy';
import { databaseCleaner } from './server/util/databaseCleaner';
import GlobalActivityCache from './server/util/globalActivityCache';
import setupIpfsProxy from './server/util/ipfsProxy';
import { TokenBalanceCache } from './server/util/tokenBalanceCache/tokenBalanceCache';
import ViewCountCache from './server/util/viewCountCache';

let isServiceHealthy = false;

startHealthCheckLoop({
  service: ServiceKey.Commonwealth,
  checkFn: async () => {
    if (!isServiceHealthy) {
      throw new Error('service not healthy');
    }
  },
});

const log = loggerFactory.getLogger(formatFilename(__filename));
// set up express async error handling hack
require('express-async-errors');

const app = express();

log.info(
  `Node Option max-old-space-size set to: ${JSON.stringify(
    v8.getHeapStatistics().heap_size_limit / 1000000000,
  )} GB`,
);

async function main() {
  const DEV = process.env.NODE_ENV !== 'production';

  // CLI parameters for which task to run
  const SHOULD_SEND_EMAILS = process.env.SEND_EMAILS === 'true';

  const NO_GLOBAL_ACTIVITY_CACHE =
    process.env.NO_GLOBAL_ACTIVITY_CACHE === 'true';
  const NO_CLIENT_SERVER =
    process.env.NO_CLIENT === 'true' || SHOULD_SEND_EMAILS;

  let rc = null;
  if (SHOULD_SEND_EMAILS) {
    rc = await sendBatchedNotificationEmails(models);
  }

  // exit if we have performed a one-off event
  if (rc !== null) {
    process.exit(rc);
  }

  const NO_PRERENDER = process.env.NO_PRERENDER || NO_CLIENT_SERVER;

  const SequelizeStore = SessionSequelizeStore(session.Store);
  const viewCountCache = new ViewCountCache(2 * 60, 10 * 60);

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
    saveUninitialized: false,
  });

  const setupMiddleware = () => {
    // redirect from commonwealthapp.herokuapp.com to commonwealth.im
    app.all(/.*/, (req, res, next) => {
      const host = req.header('host');
      const origin = req.get('origin');

      // For development only - need to figure out prod solution
      // if host is native mobile app, don't redirect
      if (origin?.includes('capacitor://')) {
        res.header('Access-Control-Allow-Origin', '*');
      }

      if (host?.match(/commonwealthapp.herokuapp.com/i)) {
        res.redirect(301, `https://commonwealth.im${req.url}`);
      } else {
        next();
      }
    });

    // redirect to https:// unless we are using a test domain or using 192.168.1.range (local network range)
    app.use(
      redirectToHTTPS(
        [
          /localhost:(\d{4})/,
          /127.0.0.1:(\d{4})/,
          /192.168.1.(\d{1,3}):(\d{4})/,
        ],
        [],
        301,
      ),
    );

    // dynamic compression settings used
    app.use(compression());

    // static compression settings unused
    // app.get('*.js', (req, res, next) => {
    //   req.url = req.url + '.gz';
    //   res.set('Content-Encoding', 'gzip');
    //   res.set('Content-Type', 'application/javascript; charset=UTF-8');
    //   next();
    // });

    // // static compression settings unused
    // app.get('bundle.**.css', (req, res, next) => {
    //   req.url = req.url + '.gz';
    //   res.set('Content-Encoding', 'gzip');
    //   res.set('Content-Type', 'text/css');
    //   next();
    // });

    // add security middleware
    app.use(function applyXFrameAndCSP(req, res, next) {
      res.set('X-Frame-Options', 'DENY');
      res.set('Content-Security-Policy', "frame-ancestors 'none';");
      next();
    });

    // serve static files
    app.use(favicon(`${__dirname}/favicon.ico`));
    app.use('/static', express.static('static'));

    // add other middlewares
    app.use(logger('dev'));
    app.use(expressStatsdInit(StatsDController.get()));
    app.use(bodyParser.json({ limit: '1mb' }));
    app.use(bodyParser.urlencoded({ limit: '1mb', extended: false }));
    app.use(cookieParser());
    app.use(sessionParser);
    app.use(passport.initialize());
    app.use(passport.session());

    if (!DEV && !NO_PRERENDER && SERVER_URL.includes('commonwealth.im')) {
      app.use(prerenderNode.set('prerenderToken', PRERENDER_TOKEN));
    }
  };

  const templateFile = (() => {
    try {
      return fs.readFileSync('./build/index.html');
    } catch (e) {
      console.error(`Failed to read template file: ${e.message}`);
    }
  })();

  const sendFile = (res) => res.sendFile(`${__dirname}/index.html`);

  setupMiddleware();
  setupPassport(models);

  const rollbar = new Rollbar({
    accessToken: ROLLBAR_SERVER_TOKEN,
    environment: ROLLBAR_ENV,
    captureUncaught: true,
    captureUnhandledRejections: true,
  });

  let rabbitMQController: RabbitMQController;
  try {
    rabbitMQController = new RabbitMQController(
      <BrokerConfig>(
        getRabbitMQConfig(
          RABBITMQ_URI,
          RascalConfigServices.CommonwealthService,
        )
      ),
    );
    await rabbitMQController.init();
  } catch (e) {
    console.warn(
      'The main service RabbitMQController failed to initialize!',
      e,
    );
    rollbar.critical(
      'The main service RabbitMQController failed to initialize!',
      e,
    );
  }

  if (!rabbitMQController.initialized) {
    console.warn(
      'The RabbitMQController is not initialized! Some services may be unavailable',
    );
    rollbar.critical('The main service RabbitMQController is not initialized!');
    // TODO: this requires an immediate response if in production
  }

  const redisCache = new RedisCache(rollbar);
  await redisCache.init(REDIS_URL);

  const tokenBalanceCache = new TokenBalanceCache(
    models,
    redisCache,
    TBC_BALANCE_TTL_SECONDS,
  );

  const banCache = new BanCache(models);
  const globalActivityCache = new GlobalActivityCache(models, redisCache);

  // initialize async to avoid blocking startup
  if (!NO_GLOBAL_ACTIVITY_CACHE) globalActivityCache.start();

  // Declare Validation Middleware Service
  // middleware to use for all requests
  const dbValidationService: DatabaseValidationService =
    new DatabaseValidationService(models);

  setupAPI(
    '/api',
    app,
    models,
    viewCountCache,
    tokenBalanceCache,
    banCache,
    globalActivityCache,
    dbValidationService,
    redisCache,
  );

  // new API
  addExternalRoutes('/external', app, models);
  addSwagger('/docs', app);

  setupCosmosProxy(app, models);
  setupIpfsProxy(app);

  if (!NO_CLIENT_SERVER) {
    if (DEV) {
      // lazy import because we want to keep all of webpacks dependencies in devDependencies
      const setupWebpackDevServer = (
        await import('./server/scripts/setupWebpackDevServer')
      ).default;
      await setupWebpackDevServer(app);
    } else {
      app.use('/build', express.static('build'));
    }
  }

  setupAppRoutes(app, models, templateFile, sendFile);

  setupErrorHandlers(app, rollbar);

  setupServer(app, rollbar, models, rabbitMQController, redisCache);

  // database clean-up jobs (should be run after the API so, we don't affect start-up time
  databaseCleaner.initLoop(
    models,
    Number(DATABASE_CLEAN_HOUR),
    redisCache,
    rollbar,
  );

  isServiceHealthy = true;
}

main().catch((e) => console.log(e));
export default app;
