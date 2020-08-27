import { SubstrateEvents, SubstrateTypes } from '@commonwealth/chain-events';
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
import devWebpackConfig from './webpack/webpack.config.dev.js';
import prodWebpackConfig from './webpack/webpack.config.prod.js';
import { factory, formatFilename } from './shared/logging';
const log = factory.getLogger(formatFilename(__filename));

import ViewCountCache from './server/util/viewCountCache';
import IdentityFetchCache from './server/util/identityFetchCache';
import { SESSION_SECRET, ROLLBAR_SERVER_TOKEN } from './server/config';
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
import migrateChainEntities from './server/scripts/migrateChainEntities';
import migrateIdentities from './server/scripts/migrateIdentities';

// set up express async error handling hack
require('express-async-errors');

const DEV = process.env.NODE_ENV !== 'production';
const SHOULD_RESET_DB = process.env.RESET_DB === 'true';
const SHOULD_UPDATE_EVENTS = process.env.UPDATE_EVENTS === 'true';
const SHOULD_UPDATE_BALANCES = process.env.UPDATE_BALANCES === 'true';
const SHOULD_UPDATE_EDGEWARE_LOCKDROP_STATS = process.env.UPDATE_EDGEWARE_LOCKDROP_STATS === 'true';
const NO_CLIENT_SERVER = process.env.NO_CLIENT === 'true';
const SKIP_EVENT_CATCHUP = process.env.SKIP_EVENT_CATCHUP === 'true';
const ENTITY_MIGRATION = process.env.ENTITY_MIGRATION;
const IDENTITY_MIGRATION = process.env.IDENTITY_MIGRATION;
const NO_EVENTS = process.env.NO_EVENTS === 'true';
const CHAIN_EVENTS = process.env.CHAIN_EVENTS;

const rollbar = process.env.NODE_ENV === 'production' && new Rollbar({
  accessToken: ROLLBAR_SERVER_TOKEN,
  environment: process.env.NODE_ENV,
  captureUncaught: true,
  captureUnhandledRejections: true,
});

const app = express();
const compiler = DEV ? webpack(devWebpackConfig) : webpack(prodWebpackConfig);
const SequelizeStore = SessionSequelizeStore(session.Store);
const devMiddleware = (DEV && !NO_CLIENT_SERVER) ? webpackDevMiddleware(compiler, {
  publicPath: '/build',
}) : null;
const viewCountCache = new ViewCountCache(2 * 60, 10 * 60);
const identityFetchCache = new IdentityFetchCache(10 * 60);
const wss = new WebSocket.Server({ clientTracking: false, noServer: true });

const closeMiddleware = (): Promise<void> => {
  if (!NO_CLIENT_SERVER) {
    return new Promise((resolve) => devMiddleware.close(() => resolve()));
  } else {
    return Promise.resolve();
  }
};

const sessionParser = session({
  secret: SESSION_SECRET,
  store: new SequelizeStore({
    db: models.sequelize,
    tableName: 'Sessions',
    checkExpirationInterval: 15 * 60 * 1000, // Clean up expired sessions every 15 minutes
    expiration: 7 * 24 * 60 * 60 * 1000, // Set session expiration to 7 days
  }),
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
  app.use(redirectToHTTPS([/localhost:(\d{4})/, /127.0.0.1:(\d{4})/], [], 301));

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
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
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
  if (process.env.WITH_PRERENDER) setupPrerenderServer();
} else {
  setupPrerenderServer();
}

setupMiddleware();
setupPassport(models);
setupAPI(app, models, viewCountCache, identityFetchCache);
setupAppRoutes(app, models, devMiddleware, templateFile, sendFile);
setupErrorHandlers(app, rollbar);
sendBatchedNotificationEmails(models, 'monthly');

async function main() {
  if (SHOULD_RESET_DB) {
    resetServer(models, closeMiddleware);
  } else if (SHOULD_UPDATE_EVENTS) {
    updateEvents(app, models);
  } else if (SHOULD_UPDATE_BALANCES) {
    await updateBalances(app, models);
  } else if (SHOULD_UPDATE_EDGEWARE_LOCKDROP_STATS) {
    // Run fetchStats here to populate lockdrop stats for Edgeware Lockdrop.
    // This only needs to run once on prod to make the necessary queries.
    await fetchStats(models, 'mainnet');
    log.info('Finished adding Lockdrop statistics into the DB');
    process.exit(0);
  } else {
    if (NO_EVENTS) {
      setupServer(app, wss, sessionParser);
    } else {
      // handle various chain-event cases
      if (ENTITY_MIGRATION) {
        // "all" means run for all supported chains, otherwise we pass in the name of
        // the specific chain to migrate
        log.info('Started migrating chain entities into the DB');
        await migrateChainEntities(models, ENTITY_MIGRATION === 'all' ? undefined : ENTITY_MIGRATION);
        log.info('Finished migrating chain entities into the DB');
        process.exit(0);
      }

      if (IDENTITY_MIGRATION) {
        log.info('Started migrating chain identities into the DB');
        await migrateIdentities(models);
        log.info('Finished migrating chain identities into the DB');
        process.exit(0);
      }

      let exitCode = 0;
      try {
        // configure chain list from events
        let chains: string[] | 'all' | 'none' = [ 'edgeware' ];
        if (CHAIN_EVENTS === 'none' || CHAIN_EVENTS === 'all') {
          chains = CHAIN_EVENTS;
        } else if (CHAIN_EVENTS) {
          chains = CHAIN_EVENTS.split(',');
        }
        const subscribers = await setupChainEventListeners(models, wss, chains, SKIP_EVENT_CATCHUP);

        // construct storageFetchers needed for the identity cache
        const fetchers = {};
        for (const [ chain, subscriber ] of Object.entries(subscribers)) {
          if (SubstrateTypes.EventChains.includes(chain)) {
            fetchers[chain] = new SubstrateEvents.StorageFetcher(subscriber.api);
          }
        }
        identityFetchCache.start(models, fetchers);
      } catch (e) {
        exitCode = 1;
        console.error(`Chain event listener setup failed: ${e.message}`);
      }
      if (exitCode) {
        await models.sequelize.close();
        await closeMiddleware();
        process.exit(exitCode);
      }

      setupServer(app, wss, sessionParser);
    }
  }
}

main();
export default app;
