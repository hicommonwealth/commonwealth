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
import passport from 'passport';
import path, { dirname } from 'path';
import pinoHttp from 'pino-http';
import prerenderNode from 'prerender-node';
import { fileURLToPath } from 'url';
import * as v8 from 'v8';
import { config } from './server/config';
import DatabaseValidationService from './server/middleware/databaseValidationService';
import setupPassport from './server/passport';
import setupAPI from './server/routing/router';
import setupServer from './server/scripts/setupServer';
import BanCache from './server/util/banCheckCache';
import ViewCountCache from './server/util/viewCountCache';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const parseJson = json({ limit: '1mb' });

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
    withPrerender = false,
  }: {
    port: number;
    noGlobalActivityCache?: boolean;
    withLoggingMiddleware?: boolean;
    withPrerender?: boolean;
  },
) {
  const log = logger(__filename);
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
    expiration: config.AUTH.SESSION_EXPIRY_MILLIS,
  });

  sessionStore.sync();

  const sessionParser = session({
    secret: config.AUTH.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: config.AUTH.SESSION_EXPIRY_MILLIS,
    },
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

    // add security middleware
    app.use(function applyXFrameAndCSP(req, res, next) {
      res.set('X-Frame-Options', 'DENY');
      res.set('Content-Security-Policy', "frame-ancestors 'none';");
      next();
    });

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

    app.use((req, res, next) => {
      if (req.path.startsWith('/api/v1/rest/chainevent/')) next();
      else parseJson(req, res, next);
    });

    app.use(urlencoded({ limit: '1mb', extended: false }) as RequestHandler);
    app.use(cookieParser());
    app.use(sessionParser);
    app.use(passport.initialize());
    app.use(passport.session());

    withPrerender &&
      app.use(prerenderNode.set('prerenderToken', config.PRERENDER_TOKEN));
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
    cacheDecorator,
  );

  app.use('/robots.txt', (req: Request, res: Response) => {
    res.sendFile(`${__dirname}/robots.txt`);
  });

  app.use('/manifest.json', (req: Request, res: Response) => {
    res.sendFile(`${__dirname}/manifest.json`);
  });

  app.use('/firebase-messaging-sw.js', (req: Request, res: Response) => {
    res.sendFile(`${__dirname}/firebase-messaging-sw.js`);
  });

  app.use(
    '/assets',
    express.static(path.join(__dirname, 'assets'), {
      setHeaders: (res) => {
        res.setHeader('Cache-Control', 'public');
      },
    }),
  );

  app.use(
    '/brand_assets',
    express.static(path.join(__dirname, 'brand_assets'), {
      setHeaders: (res) => {
        res.setHeader('Cache-Control', 'public');
      },
    }),
  );

  app.get('*', (req: Request, res: Response) => {
    res.sendFile(`${__dirname}/index.html`);
  });

  setupErrorHandlers(app);

  const server = setupServer(app, port);

  return { server, cacheDecorator };
}
