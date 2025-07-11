import { CacheDecorator, setupErrorHandlers } from '@hicommonwealth/adapters';
import { logger, stats } from '@hicommonwealth/core';
import { sequelize } from '@hicommonwealth/model/db';
import { PRODUCTION_DOMAIN } from '@hicommonwealth/shared';
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
import setupPassport from './server/passport';
import setupAPI from './server/routing/router';
import setupServer from './server/scripts/setupServer';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Bootstraps express app
 */
export async function main(
  app: express.Express,
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
  const log = logger(import.meta);
  log.info(
    `Node Option max-old-space-size set to: ${JSON.stringify(
      v8.getHeapStatistics().heap_size_limit / 1000000000,
    )} GB`,
  );

  const cacheDecorator = new CacheDecorator();

  const SequelizeStore = SessionSequelizeStore(session.Store);

  const sessionStore = new SequelizeStore({
    db: sequelize,
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
      sameSite: 'lax',
    },
  });

  const setupMiddleware = () => {
    // redirect from commonwealthapp.herokuapp.com to PRODUCTION_DOMAIN
    app.all(/.*/, (req, res, next) => {
      if (req.header('host')?.match(/commonwealthapp.herokuapp.com/i)) {
        res.redirect(301, `https://${PRODUCTION_DOMAIN}{req.url}`);
      } else {
        next();
      }
    });

    // Disable https redirects on non-prod Railway apps
    if (
      config.RAILWAY.RAILWAY_PUBLIC_DOMAIN &&
      config.APP_ENV !== 'production'
    ) {
      log.warn('HTTP -> HTTPS redirects disabled');
    } else {
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
    }

    app.use((req, res, next) => {
      const contentLength = parseInt(req.headers['content-length'] || '0', 10);
      if (contentLength > 1024 * 1024) {
        return res.status(413).json({ error: 'Request entity too large' });
      }
      next();
    });

    app.use(urlencoded({ limit: '1mb', extended: false }) as RequestHandler);
    const parseJson = json({ limit: '1mb' });
    app.use((req, res, next) => {
      if (req.path.startsWith(`${api.integration.PATH}/chainevent/`)) next();
      else parseJson(req, res, next);
    });

    // dynamic compression settings used
    app.use(compression());

    // add security middleware
    app.use(function applyXFrameAndCSP(req, res, next) {
      res.set('X-Frame-Options', 'DENY');
      res.set('Content-Security-Policy', "frame-ancestors 'none';");
      next();
    });

    // Report stats for all routes
    app.use((req, res, next) => {
      try {
        if (!req.path.startsWith('/api')) return next();
        const routePattern = `${req.method.toUpperCase()} ${req.path}`;
        const start = Date.now();
        res.on('finish', () => {
          const latency = Date.now() - start;
          stats().distribution(`cw.path.metrics`, latency, 0.3, {
            path: routePattern,
            statusCode: `${res.statusCode}`,
          });
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

    app.use(cookieParser());
    app.use(sessionParser);
    app.use(passport.initialize());
    app.use(passport.session());

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

  setupMiddleware();
  setupPassport();

  setupAPI(app, cacheDecorator);

  app.use('/.well-known/assetlinks.json', (req: Request, res: Response) => {
    res.sendFile(`${__dirname}/.well-known/assetlinks.json`);
  });

  app.use(
    '/.well-known/apple-app-site-association',
    (req: Request, res: Response) => {
      res.setHeader('Content-Type', 'application/json');
      res.sendFile(`${__dirname}/.well-known/apple-app-site-association`);
    },
  );

  app.use('/robots.txt', (req: Request, res: Response) => {
    res.sendFile(`${__dirname}/robots.txt`);
  });

  app.use('/blank.html', (req: Request, res: Response) => {
    res.sendFile(`${__dirname}/blank.html`);
  });

  app.use('/manifest.json', (req: Request, res: Response) => {
    res.sendFile(`${__dirname}/manifest.json`);
  });

  app.use('/.well-known/farcaster.json', (req, res) => {
    res.json(buildFarcasterManifest());
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

  setupErrorHandlers(app);

  const server = setupServer(app, port);

  return { server, cacheDecorator };
}
