import { CacheDecorator, setupErrorHandlers } from '@hicommonwealth/adapters';
import { logger, stats } from '@hicommonwealth/core';
import type { DB } from '@hicommonwealth/model';
import { PRODUCTION_DOMAIN } from '@hicommonwealth/shared';
import sgMail from '@sendgrid/mail';
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
import pino from 'pino';
import pinoHttp from 'pino-http';
import prerenderNode from 'prerender-node';
import { buildFarcasterManifest } from 'server/util/buildFarcasterManifest';
import { renderIndex } from 'server/util/renderIndex';
import { fileURLToPath } from 'url';
import * as v8 from 'v8';
import * as api from './server/api';
import { config } from './server/config';
import DatabaseValidationService from './server/middleware/databaseValidationService';
import setupPassport from './server/passport';
import setupAPI from './server/routing/router';
import setupServer from './server/scripts/setupServer';

const __dirname = dirname(fileURLToPath(import.meta.url));

const parseJson = json({ limit: '1mb' });

const latencyInfo: Record<string, { invocationCount: number; total: number }> =
  {};

/**
 * Bootstraps express app
 */
export async function main(
  app: express.Express,
  db: DB,
  {
    port,
    withLoggingMiddleware = false,
    withPrerender = false,
  }: {
    port: number;
    withLoggingMiddleware?: boolean;
    withPrerender?: boolean;
  },
) {
  console.log(1);
  const log = logger(import.meta);
  console.log(2);
  log.info(
    `Node Option max-old-space-size set to: ${JSON.stringify(
      v8.getHeapStatistics().heap_size_limit / 1000000000,
    )} GB`,
  );

  console.log(3);
  // @ts-expect-error StrictNullChecks
  sgMail.setApiKey(config.SENDGRID.API_KEY);

  console.log(4);
  const cacheDecorator = new CacheDecorator();

  console.log(5);
  const SequelizeStore = SessionSequelizeStore(session.Store);

  console.log(6);
  const sessionStore = new SequelizeStore({
    db: db.sequelize,
    tableName: 'Sessions',
    checkExpirationInterval: 15 * 60 * 1000, // Clean up expired sessions every 15 minutes
    expiration: config.AUTH.SESSION_EXPIRY_MILLIS,
  });

  console.log(7);
  sessionStore.sync();

  console.log(8);
  const sessionParser = session({
    secret: config.AUTH.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: config.AUTH.SESSION_EXPIRY_MILLIS,
      sameSite: 'lax',
    },
  });

  console.log(9);
  const setupMiddleware = () => {
    console.log(10);
    // redirect from commonwealthapp.herokuapp.com to PRODUCTION_DOMAIN
    app.all(/.*/, (req, res, next) => {
      if (req.header('host')?.match(/commonwealthapp.herokuapp.com/i)) {
        res.redirect(301, `https://${PRODUCTION_DOMAIN}{req.url}`);
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

    console.log(11);
    // dynamic compression settings used
    app.use(compression());

    console.log(12);
    // add security middleware
    app.use(function applyXFrameAndCSP(req, res, next) {
      res.set('X-Frame-Options', 'DENY');
      res.set('Content-Security-Policy', "frame-ancestors 'none';");
      next();
    });

    console.log(13);
    // Report stats for all routes
    app.use((req, res, next) => {
      try {
        const routePattern = `${req.method.toUpperCase()} ${req.path}`;
        stats().increment('cw.path.called', {
          path: routePattern,
        });
        const start = Date.now();
        if (!latencyInfo[routePattern])
          latencyInfo[routePattern] = { invocationCount: 0, total: 0 };

        res.on('finish', () => {
          const latency = Date.now() - start;
          latencyInfo[routePattern].invocationCount += 1;
          latencyInfo[routePattern].total += latency;
          if (latencyInfo[routePattern].invocationCount >= 3) {
            stats().histogram(
              `cw.path.latency`,
              Math.round(latencyInfo[routePattern].total / 3),
              {
                path: routePattern,
                statusCode: `${res.statusCode}`,
              },
            );
            latencyInfo[routePattern].invocationCount = 0;
            latencyInfo[routePattern].total = 0;
          }
        });
      } catch (e) {
        log.error('Failed to record stats', e, {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
        });
      }
      next();
    });

    console.log(14);
    withLoggingMiddleware &&
      app.use(
        pinoHttp({
          ...(config.APP_ENV === 'production'
            ? {
                logger: pino({
                  formatters: {
                    level: (label: string) => {
                      return { level: label.toUpperCase() };
                    },
                  },
                }),
              }
            : {}),
          quietReqLogger: false,
          customLogLevel: function (_, res, err) {
            if (res.statusCode >= 400 && res.statusCode < 500) {
              return 'warn';
            } else if (res.statusCode >= 500 || err) {
              return 'error';
            }

            if (config.APP_ENV === 'production') return 'silent';
            else return 'info';
          },
          ...(config.APP_ENV !== 'production'
            ? {
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
              }
            : {}),
        }),
      );

    console.log(15);
    app.use((req, res, next) => {
      if (req.path.startsWith(`${api.integration.PATH}/chainevent/`)) next();
      else parseJson(req, res, next);
    });

    console.log(16);
    app.use(urlencoded({ limit: '1mb', extended: false }) as RequestHandler);
    app.use(cookieParser());
    app.use(sessionParser);
    app.use(passport.initialize());
    app.use(passport.session());

    console.log(17);
    if (withPrerender) {
      const rendererInstance = prerenderNode.set(
        'prerenderToken',
        config.PRERENDER_TOKEN,
      );
      app.use((req, res, next) => {
        if (req.path.startsWith(`${api.integration.PATH}/farcaster/`)) next();
        else rendererInstance(req, res, next);
      });
    }
  };

  console.log(18);
  setupMiddleware();

  console.log(19);
  setupPassport(db);

  console.log(20);
  // Declare Validation Middleware Service
  // middleware to use for all requests
  const dbValidationService: DatabaseValidationService =
    new DatabaseValidationService(db);

  console.log(21);
  setupAPI('/api', app, db, dbValidationService, cacheDecorator);

  console.log(22);
  app.use('/.well-known/assetlinks.json', (req: Request, res: Response) => {
    res.sendFile(`${__dirname}/.well-known/assetlinks.json`);
  });

  console.log(23);
  app.use(
    '/.well-known/apple-app-site-association',
    (req: Request, res: Response) => {
      res.setHeader('Content-Type', 'application/json');
      res.sendFile(`${__dirname}/.well-known/apple-app-site-association`);
    },
  );

  console.log(24);
  app.use('/robots.txt', (req: Request, res: Response) => {
    res.sendFile(`${__dirname}/robots.txt`);
  });

  console.log(25);
  app.use('/blank.html', (req: Request, res: Response) => {
    res.sendFile(`${__dirname}/blank.html`);
  });

  console.log(26);
  app.use('/manifest.json', (req: Request, res: Response) => {
    res.sendFile(`${__dirname}/manifest.json`);
  });

  console.log(27);
  app.use('/.well-known/farcaster.json', (req, res) => {
    res.json(buildFarcasterManifest());
  });

  console.log(28);
  app.use('/firebase-messaging-sw.js', (req: Request, res: Response) => {
    res.sendFile(`${__dirname}/firebase-messaging-sw.js`);
  });

  console.log(29);
  app.use(
    '/assets',
    express.static(path.join(__dirname, 'assets'), {
      setHeaders: (res) => {
        res.setHeader('Cache-Control', 'public');
      },
    }),
  );

  console.log(30);
  app.use(
    '/brand_assets',
    express.static(path.join(__dirname, 'brand_assets'), {
      setHeaders: (res) => {
        res.setHeader('Cache-Control', 'public');
      },
    }),
  );

  console.log(31);
  app.get('*', async (req: Request, res: Response) => {
    try {
      const indexFilePath = path.join(__dirname, 'index.html');
      const html = await renderIndex(indexFilePath);
      res.send(html);
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
  });

  console.log(32);
  setupErrorHandlers(app);

  console.log(33);
  const server = setupServer(app, port);

  console.log(34);
  return { server, cacheDecorator };
}
