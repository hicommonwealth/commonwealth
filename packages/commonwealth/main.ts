import { CacheDecorator, setupErrorHandlers } from '@hicommonwealth/adapters';
import { logger } from '@hicommonwealth/core';
import type { DB } from '@hicommonwealth/model';
import { GlobalActivityCache } from '@hicommonwealth/model';
import compression from 'compression';
import SessionSequelizeStore from 'connect-session-sequelize';
import cookieParser from 'cookie-parser';
import express, {
  RequestHandler,
  json,
  urlencoded,
  type Request,
  type Response,
} from 'express';
import { redirectToHTTPS } from 'express-http-to-https';
import session from 'express-session';
import { dirname } from 'node:path';
import passport from 'passport';
import pinoHttp from 'pino-http';
import prerenderNode from 'prerender-node';
import favicon from 'serve-favicon';
import expressStatsInit from 'server/scripts/setupExpressStats';
import { fileURLToPath } from 'url';
import * as v8 from 'v8';
import { PRERENDER_TOKEN, SESSION_SECRET } from './server/config';
import DatabaseValidationService from './server/middleware/databaseValidationService';
import setupPassport from './server/passport';
import setupAPI from './server/routing/router';
import setupServer from './server/scripts/setupServer';
import BanCache from './server/util/banCheckCache';
import setupCosmosProxy from './server/util/cosmosProxy';
import setupIpfsProxy from './server/util/ipfsProxy';
import ViewCountCache from './server/util/viewCountCache';

// set up express async error handling hack

const DEV = process.env.NODE_ENV !== 'production';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Bootstraps express app
 */
export async function main(
  app: express.Express,
  db: DB,
  {
    port,
    noGlobalActivityCache = true,
    withLoggingMiddleware = false,
    withStatsMiddleware = false,
    withFrontendBuild = false,
    withPrerender = false,
  }: {
    port: number;
    noGlobalActivityCache?: boolean;
    withLoggingMiddleware?: boolean;
    withStatsMiddleware?: boolean;
    withFrontendBuild?: boolean;
    withPrerender?: boolean;
  },
) {
  const log = logger().getLogger(__filename);
  log.info(
    `Node Option max-old-space-size set to: ${JSON.stringify(
      v8.getHeapStatistics().heap_size_limit / 1000000000,
    )} GB`,
  );

  const cacheDecorator = new CacheDecorator();

  const SequelizeStore = SessionSequelizeStore(session.Store);
  const viewCountCache = new ViewCountCache(2 * 60, 10 * 60);

  const sessionStore = new SequelizeStore({
    db: db.sequelize,
    tableName: 'Sessions',
    checkExpirationInterval: 15 * 60 * 1000, // Clean up expired sessions every 15 minutes
    expiration: 14 * 24 * 60 * 60 * 1000, // Set session expiration to 7 days
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
      if (req.header('host')?.match(/commonwealthapp.herokuapp.com/i)) {
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

    withLoggingMiddleware &&
      app.use(
        pinoHttp({
          quietReqLogger: false,
          transport: {
            target: 'pino-http-print',
            options: {
              destination: 1,
              all: false,
              colorize: true,
              relativeUrl: true,
              translateTime: 'HH:MM:ss.l',
            },
          },
        }),
      );
    withStatsMiddleware && app.use(expressStatsInit());

    app.use(json({ limit: '1mb' }) as RequestHandler);
    app.use(urlencoded({ limit: '1mb', extended: false }) as RequestHandler);
    app.use(cookieParser());
    app.use(sessionParser);
    app.use(passport.initialize());
    app.use(passport.session());

    withPrerender &&
      app.use(prerenderNode.set('prerenderToken', PRERENDER_TOKEN));
  };

  setupMiddleware();
  setupPassport(db);

  const banCache = new BanCache(db);

  // TODO: decouple as global singleton
  const globalActivityCache = GlobalActivityCache.getInstance(db);
  // initialize async to avoid blocking startup
  if (!noGlobalActivityCache) globalActivityCache.start();

  // Declare Validation Middleware Service
  // middleware to use for all requests
  const dbValidationService: DatabaseValidationService =
    new DatabaseValidationService(db);

  setupAPI(
    '/api',
    app,
    db,
    viewCountCache,
    banCache,
    globalActivityCache,
    dbValidationService,
  );

  setupCosmosProxy(app, db, cacheDecorator);
  setupIpfsProxy(app, cacheDecorator);

  if (withFrontendBuild) {
    if (DEV) {
      // lazy import because we want to keep all of webpacks dependencies in devDependencies
      const setupWebpackDevServer = (
        await import('./server/scripts/setupWebpackDevServer')
      ).default;
      await setupWebpackDevServer(app);
    } else {
      app.use(
        '/build',
        express.static('build', {
          setHeaders: (res) => {
            res.setHeader('Cache-Control', 'public');
          },
        }),
      );
    }
  }

  app.get('*', (req: Request, res: Response) => {
    log.info(`setupAppRoutes sendFiles ${req.path}`);
    res.sendFile(`${__dirname}/index.html`);
  });

  setupErrorHandlers(app);

  const server = setupServer(app, port);

  return { server, cacheDecorator };
}
