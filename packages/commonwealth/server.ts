import { SubstrateEvents } from 'chain-events/src';
import session from 'express-session';
import express from 'express';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import SessionSequelizeStore from 'connect-session-sequelize';
import fs from 'fs';

import Rollbar from 'rollbar';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import compression from 'compression';
import webpackHotMiddleware from 'webpack-hot-middleware';
import { redirectToHTTPS } from 'express-http-to-https';
import favicon from 'serve-favicon';
import logger from 'morgan';
import prerenderNode from 'prerender-node';
import { ChainBase } from 'common-common/src/types';
import { factory, formatFilename } from 'common-common/src/logging';
import TokenBalanceCache from 'token-balance-cache/src/index';
import devWebpackConfig from './webpack/webpack.config.dev.js';
import prodWebpackConfig from './webpack/webpack.config.prod.js';
const log = factory.getLogger(formatFilename(__filename));

import ViewCountCache from './server/util/viewCountCache';
import IdentityFetchCache, {
  IdentityFetchCacheNew,
} from './server/util/identityFetchCache';
import RuleCache from './server/util/rules/ruleCache';
import BanCache from './server/util/banCheckCache';
import {ROLLBAR_SERVER_TOKEN, SESSION_SECRET} from './server/config';
import models from './server/database';
import setupAppRoutes from './server/scripts/setupAppRoutes';
import setupServer from './server/scripts/setupServer';
import setupErrorHandlers from './server/scripts/setupErrorHandlers';
import setupPrerenderServer from './server/scripts/setupPrerenderService';
import { sendBatchedNotificationEmails } from './server/scripts/emails';
import setupAPI from './server/router';
import setupCosmosProxy from './server/util/cosmosProxy';
import setupPassport from './server/passport';
import setupChainEventListeners from './server/scripts/setupChainEventListeners';
import migrateIdentities from './server/scripts/migrateIdentities';
import migrateCouncillorValidatorFlags from './server/scripts/migrateCouncillorValidatorFlags';

// set up express async error handling hack
require('express-async-errors');

const app = express();
async function main() {
  const DEV = process.env.NODE_ENV !== 'production';

  // CLI parameters for which task to run
  const SHOULD_SEND_EMAILS = process.env.SEND_EMAILS === 'true';
  const SHOULD_ADD_MISSING_DECIMALS_TO_TOKENS =
    process.env.SHOULD_ADD_MISSING_DECIMALS_TO_TOKENS === 'true';

  const NO_CLIENT_SERVER =
    process.env.NO_CLIENT === 'true' ||
    SHOULD_SEND_EMAILS ||
    SHOULD_ADD_MISSING_DECIMALS_TO_TOKENS;

  // CLI parameters used to configure specific tasks
  const SKIP_EVENT_CATCHUP = process.env.SKIP_EVENT_CATCHUP === 'true';
  const IDENTITY_MIGRATION = process.env.IDENTITY_MIGRATION;
  const FLAG_MIGRATION = process.env.FLAG_MIGRATION;
  const CHAIN_EVENTS = process.env.CHAIN_EVENTS;
  const RUN_AS_LISTENER = process.env.RUN_AS_LISTENER === 'true';
  const USE_NEW_IDENTITY_CACHE = process.env.USE_NEW_IDENTITY_CACHE === 'true';

  // if running in old mode then use old identityCache but if running with dbNode.ts use the new db identityCache
  let identityFetchCache: IdentityFetchCacheNew | IdentityFetchCache;
  if (!USE_NEW_IDENTITY_CACHE) {
    identityFetchCache = new IdentityFetchCache(10 * 60);
  } else {
    identityFetchCache = new IdentityFetchCacheNew();
  }

  const tokenBalanceCache = new TokenBalanceCache();
  const ruleCache = new RuleCache();
  const listenChainEvents = async () => {
    try {
      // configure chain list from events
      let chains: string[] | 'all' | 'none' = 'all';
      if (CHAIN_EVENTS === 'none' || CHAIN_EVENTS === 'all') {
        chains = CHAIN_EVENTS;
      } else if (CHAIN_EVENTS) {
        chains = CHAIN_EVENTS.split(',');
      }
      const subscribers = await setupChainEventListeners(
        null,
        chains,
        SKIP_EVENT_CATCHUP
      );
      // construct storageFetchers needed for the identity cache
      const fetchers = {};
      for (const [chain, subscriber] of subscribers) {
        if (chain.base === ChainBase.Substrate) {
          fetchers[chain.id] = new SubstrateEvents.StorageFetcher(
            subscriber.api
          );
        }
      }
      await (<IdentityFetchCache>identityFetchCache).start(models, fetchers);
      return 0;
    } catch (e) {
      console.error(`Chain event listener setup failed: ${e.message}`);
      return 1;
    }
  };
  let rc = null;
  if (RUN_AS_LISTENER) {
    // hack to keep process running indefinitely
    process.stdin.resume();
    listenChainEvents().then((retcode) => {
      if (retcode) {
        process.exit(retcode);
      }
      // if recode === 0, continue indefinitely
    });
    return;
  } else if (SHOULD_SEND_EMAILS) {
    rc = await sendBatchedNotificationEmails(models);
  } else if (IDENTITY_MIGRATION) {
    log.info('Started migrating chain identities into the DB');
    try {
      await migrateIdentities(models);
      log.info('Finished migrating chain identities into the DB');
      rc = 0;
    } catch (e) {
      log.error('Failed migrating chain identities into the DB: ', e.message);
      rc = 1;
    }
  } else if (FLAG_MIGRATION) {
    log.info('Started migrating councillor and validator flags into the DB');
    try {
      await migrateCouncillorValidatorFlags(models);
      log.info('Finished migrating councillor and validator flags into the DB');
      rc = 0;
    } catch (e) {
      log.error(
        'Failed migrating councillor and validator flags into the DB: ',
        e.message
      );
      rc = 1;
    }
  }

  // exit if we have performed a one-off event
  if (rc !== null) {
    process.exit(rc);
  }

  const WITH_PRERENDER = process.env.WITH_PRERENDER;
  const NO_PRERENDER = process.env.NO_PRERENDER || NO_CLIENT_SERVER;

  const compiler = DEV ? webpack(devWebpackConfig) : webpack(prodWebpackConfig);
  const SequelizeStore = SessionSequelizeStore(session.Store);
  const devMiddleware =
    DEV && !NO_CLIENT_SERVER
      ? webpackDevMiddleware(compiler, {
          publicPath: '/build',
        })
      : null;
  const viewCountCache = new ViewCountCache(2 * 60, 10 * 60);

  const closeMiddleware = (): Promise<void> => {
    if (!NO_CLIENT_SERVER) {
      return new Promise((resolve) => devMiddleware.close(() => resolve()));
    } else {
      return Promise.resolve();
    }
  };

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
      if (host.match(/commonwealthapp.herokuapp.com/i)) {
        res.redirect(301, `https://commonwealth.im${req.url}`);
      } else {
        next();
      }
    });

    // redirect to https:// unless we are using a test domain
    app.use(
      redirectToHTTPS([/localhost:(\d{4})/, /127.0.0.1:(\d{4})/], [], 301)
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

    // serve the compiled app
    if (!NO_CLIENT_SERVER) {
      if (DEV) {
        app.use(devMiddleware);
        app.use(webpackHotMiddleware(compiler));
      } else {
        app.use('/build', express.static('build'));
      }
    }

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
    app.use(bodyParser.json({ limit: '1mb' }));
    app.use(bodyParser.urlencoded({ limit: '1mb', extended: false }));
    app.use(cookieParser());
    app.use(sessionParser);
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(prerenderNode.set('prerenderServiceUrl', 'http://localhost:3000'));
  };

  const templateFile = (() => {
    try {
      return fs.readFileSync('./build/index.html');
    } catch (e) {
      console.error(`Failed to read template file: ${e.message}`);
    }
  })();

  const sendFile = (res) => res.sendFile(`${__dirname}/build/index.html`);

  // Only run prerender in DEV environment if the WITH_PRERENDER flag is provided.
  // On the other hand, run prerender by default on production.
  if (DEV) {
    if (WITH_PRERENDER) setupPrerenderServer();
  } else {
    if (!NO_PRERENDER) setupPrerenderServer();
  }

  setupMiddleware();
  setupPassport(models);

  await tokenBalanceCache.start();
  await ruleCache.start();
  const banCache = new BanCache(models);
  setupAPI(
    app,
    models,
    viewCountCache,
    <any>identityFetchCache,
    tokenBalanceCache,
    ruleCache,
    banCache,
  );
  setupCosmosProxy(app, models);
  setupAppRoutes(app, models, devMiddleware, templateFile, sendFile);

  const rollbar = new Rollbar({
    accessToken: ROLLBAR_SERVER_TOKEN,
    environment: process.env.NODE_ENV,
    captureUncaught: true,
    captureUnhandledRejections: true,
  });

  setupErrorHandlers(app, rollbar);

  if (CHAIN_EVENTS) {
    const exitCode = await listenChainEvents();
    console.log(`setup chain events listener with code: ${exitCode}`);
    if (exitCode) {
      await models.sequelize.close();
      await closeMiddleware();
      process.exit(exitCode);
    }
  }
  setupServer(app, rollbar, models);
}

main();
export default app;
