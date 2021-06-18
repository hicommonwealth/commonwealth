import { SubstrateEvents, SubstrateTypes, chainSupportedBy } from '@commonwealth/chain-events';
import session from 'express-session';
import Rollbar from 'rollbar';
import express from 'express';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import SessionSequelizeStore from 'connect-session-sequelize';
import WebSocket from 'ws';
import fs from 'fs';

import passport from 'passport';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import webpackHotMiddleware from 'webpack-hot-middleware';
import { redirectToHTTPS } from 'express-http-to-https';
import favicon from 'serve-favicon';
import logger from 'morgan';
import prerenderNode from 'prerender-node';

import { Magic } from '@magic-sdk/admin';

import devWebpackConfig from './webpack/webpack.config.dev.js';
import prodWebpackConfig from './webpack/webpack.config.prod.js';
import { factory, formatFilename } from './shared/logging';
const log = factory.getLogger(formatFilename(__filename));

import ViewCountCache from './server/util/viewCountCache';
import IdentityFetchCache from './server/util/identityFetchCache';
import TokenBalanceCache from './server/util/tokenBalanceCache';
import TokenListCache from './server/util/tokenListCache';
import { SESSION_SECRET, ROLLBAR_SERVER_TOKEN, MAGIC_API_KEY } from './server/config';
import models from './server/database';
import { updateEvents, updateBalances } from './server/util/eventPoller';
import resetServer from './server/scripts/resetServer';
import setupAppRoutes from './server/scripts/setupAppRoutes';
import setupServer from './server/scripts/setupServer';
import setupErrorHandlers from './server/scripts/setupErrorHandlers';
import setupPrerenderServer from './server/scripts/setupPrerenderService';
import { sendBatchedNotificationEmails } from './server/scripts/emails';
import setupAPI from './server/router';
import setupPassport from './server/passport';
import setupChainEventListeners from './server/scripts/setupChainEventListeners';
import { fetchStats } from './server/routes/getEdgewareLockdropStats';
import { migrateChainEntities, migrateChainEntity } from './server/scripts/migrateChainEntities';
import migrateIdentities from './server/scripts/migrateIdentities';
import migrateCouncillorValidatorFlags from './server/scripts/migrateCouncillorValidatorFlags';

// set up express async error handling hack
require('express-async-errors');

const app = express();
async function main() {
  const DEV = process.env.NODE_ENV !== 'production';

  // CLI parameters for which task to run
  const SHOULD_SEND_EMAILS = process.env.SEND_EMAILS === 'true';
  const SHOULD_RESET_DB = process.env.RESET_DB === 'true';
  const SHOULD_UPDATE_EVENTS = process.env.UPDATE_EVENTS === 'true';
  const SHOULD_UPDATE_BALANCES = process.env.UPDATE_BALANCES === 'true';
  const SHOULD_UPDATE_EDGEWARE_LOCKDROP_STATS = process.env.UPDATE_EDGEWARE_LOCKDROP_STATS === 'true';

  const NO_CLIENT_SERVER = process.env.NO_CLIENT === 'true'
    || SHOULD_SEND_EMAILS
    || SHOULD_RESET_DB
    || SHOULD_UPDATE_EVENTS
    || SHOULD_UPDATE_BALANCES
    || SHOULD_UPDATE_EDGEWARE_LOCKDROP_STATS;

  // CLI parameters used to configure specific tasks
  const SKIP_EVENT_CATCHUP = process.env.SKIP_EVENT_CATCHUP === 'true';
  const ENTITY_MIGRATION = process.env.ENTITY_MIGRATION;
  const IDENTITY_MIGRATION = process.env.IDENTITY_MIGRATION;
  const FLAG_MIGRATION = process.env.FLAG_MIGRATION;
  const CHAIN_EVENTS = process.env.CHAIN_EVENTS;
  const RUN_AS_LISTENER = process.env.RUN_AS_LISTENER === 'true';

  const magic = MAGIC_API_KEY ? new Magic(MAGIC_API_KEY) : null;
  const identityFetchCache = new IdentityFetchCache(10 * 60);
  const tokenListCache = new TokenListCache();
  const tokenBalanceCache = new TokenBalanceCache(tokenListCache);
  const listenChainEvents = async () => {
    try {
      // configure chain list from events
      let chains: string[] | 'all' | 'none';
      if (CHAIN_EVENTS === 'none' || CHAIN_EVENTS === 'all') {
        chains = CHAIN_EVENTS;
      } else if (CHAIN_EVENTS) {
        chains = CHAIN_EVENTS.split(',');
      }
      chains = ['dydx-ropsten'];
      const subscribers = await setupChainEventListeners(models, null, chains, SKIP_EVENT_CATCHUP);
      // construct storageFetchers needed for the identity cache
      const fetchers = {};
      for (const [ chain, subscriber ] of Object.entries(subscribers)) {
        if (chainSupportedBy(chain, SubstrateTypes.EventChains)) {
          fetchers[chain] = new SubstrateEvents.StorageFetcher(subscriber.api);
        }
      }
      await identityFetchCache.start(models, fetchers);
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
  } else if (SHOULD_RESET_DB) {
    rc = await resetServer(models);
  } else if (SHOULD_UPDATE_EVENTS) {
    rc = await updateEvents(app, models);
  } else if (SHOULD_UPDATE_BALANCES) {
    try {
      rc = await updateBalances(app, models);
    } catch (e) {
      log.error('Failed updating balances: ', e.message);
      rc = 1;
    }
  } else if (SHOULD_UPDATE_EDGEWARE_LOCKDROP_STATS) {
    // Run fetchStats here to populate lockdrop stats for Edgeware Lockdrop.
    // This only needs to run once on prod to make the necessary queries.
    try {
      await fetchStats(models, 'mainnet');
      log.info('Finished adding Lockdrop statistics into the DB');
      rc = 0;
    } catch (e) {
      log.error('Failed adding Lockdrop statistics into the DB: ', e.message);
      rc = 1;
    }
  } else if (ENTITY_MIGRATION) {
    // "all" means run for all supported chains, otherwise we pass in the name of
    // the specific chain to migrate
    log.info('Started migrating chain entities into the DB');
    try {
      await (ENTITY_MIGRATION === 'all'
        ? migrateChainEntities(models)
        : migrateChainEntity(models, ENTITY_MIGRATION));
      log.info('Finished migrating chain entities into the DB');
      rc = 0;
    } catch (e) {
      log.error('Failed migrating chain entities into the DB: ', e.message);
      rc = 1;
    }
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
      log.error('Failed migrating councillor and validator flags into the DB: ', e.message);
      rc = 1;
    }
  }

  // exit if we have performed a one-off event
  if (rc !== null) {
    process.exit(rc);
  }

  const WITH_PRERENDER = process.env.WITH_PRERENDER;
  const NO_PRERENDER = process.env.NO_PRERENDER || NO_CLIENT_SERVER;

  const rollbar = process.env.NODE_ENV === 'production' && new Rollbar({
    accessToken: ROLLBAR_SERVER_TOKEN,
    environment: process.env.NODE_ENV,
    captureUncaught: true,
    captureUnhandledRejections: true,
  });

  const compiler = DEV ? webpack(devWebpackConfig) : webpack(prodWebpackConfig);
  const SequelizeStore = SessionSequelizeStore(session.Store);
  const devMiddleware = (DEV && !NO_CLIENT_SERVER) ? webpackDevMiddleware(compiler, {
    publicPath: '/build',
  }) : null;
  const wss = new WebSocket.Server({ clientTracking: false, noServer: true });
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
    saveUninitialized: true,
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
    app.use(redirectToHTTPS(DEV ? [
      /gov.edgewa.re:(\d{4})/,
      /gov2.edgewa.re:(\d{4})/,
      /gov3.edgewa.re:(\d{4})/,
      /localhost:(\d{4})/,
      /127.0.0.1:(\d{4})/
    ] : [
      /localhost:(\d{4})/,
      /127.0.0.1:(\d{4})/
    ], [], 301));

    // serve the compiled app
    if (!NO_CLIENT_SERVER) {
      if (DEV) {
        app.use(devMiddleware);
        app.use(webpackHotMiddleware(compiler));
      } else {
        app.use('/build', express.static('build'));
      }
    }

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

    // store wss into request obj
    app.use((req: express.Request, res, next) => {
      req.wss = wss;
      next();
    });
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
  setupPassport(models, magic);

  await tokenBalanceCache.start(models);
  setupAPI(app, models, viewCountCache, identityFetchCache, tokenBalanceCache, magic);
  setupAppRoutes(app, models, devMiddleware, templateFile, sendFile);
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
  setupServer(app, wss, sessionParser);
}

main();
export default app;
