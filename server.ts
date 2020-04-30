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
import { factory, formatFilename } from './server/util/logging';
const log = factory.getLogger(formatFilename(__filename));

import ViewCountCache from './server/util/viewCountCache';
import { SESSION_SECRET, ROLLBAR_SERVER_TOKEN, NO_ARCHIVE, QUERY_URL_OVERRIDE } from './server/config';
import models from './server/database';
import { updateEvents, updateBalances } from './server/util/eventPoller';
import { updateSupernovaStats } from './server/lockdrops/supernova';
import resetServer from './server/scripts/resetServer';
import setupAppRoutes from './server/scripts/setupAppRoutes';
import setupServer from './server/scripts/setupServer';
import setupErrorHandlers from './server/scripts/setupErrorHandlers';
import setupPrerenderServer from './server/scripts/setupPrerenderService';
import setupAPI from './server/router';
import setupPassport from './server/passport';
import addChainObjectQueries from './server/scripts/addChainObjectQueries';
import ChainObjectFetcher from './server/util/chainObjectFetcher';
import { UserRequest } from './server/types.js';
import { fetchStats } from './server/routes/getEdgewareLockdropStats';

// set up express async error handling hack
require('express-async-errors');

const DEV = process.env.NODE_ENV !== 'production';
const SHOULD_RESET_DB = process.env.RESET_DB === 'true';
const SHOULD_UPDATE_EVENTS = process.env.UPDATE_EVENTS === 'true';
const SHOULD_UPDATE_BALANCES = process.env.UPDATE_BALANCES === 'true';
const SHOULD_UPDATE_SUPERNOVA_STATS = process.env.UPDATE_SUPERNOVA === 'true';
const SHOULD_UPDATE_CHAIN_OBJECTS_IMMEDIATELY = process.env.UPDATE_OBJECTS === 'true';
const SHOULD_ADD_TEST_QUERIES = process.env.ADD_TEST_QUERIES === 'true';
const SHOULD_UPDATE_EDGEWARE_LOCKDROP_STATS = process.env.UPDATE_EDGEWARE_LOCKDROP_STATS === 'true';
const FETCH_INTERVAL_MS = +process.env.FETCH_INTERVAL_MS || 600000; // default fetch interval is 10min
const NO_CLIENT_SERVER = process.env.NO_CLIENT === 'true';

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
const fetcher = new ChainObjectFetcher(models, FETCH_INTERVAL_MS, QUERY_URL_OVERRIDE);
const viewCountCache = new ViewCountCache(2 * 60, 10 * 60);
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
    expiration: 7 * 24 * 60 * 60 * 1000      // Set session expiration to 7 days
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
  app.use((req: UserRequest, res, next) => {
    req.wss = wss;
    next();
  });
};

const templateFile = (() => {
  try {
    return fs.readFileSync('./build/index.html');
  } catch (e) {}
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
setupAPI(app, models, fetcher, viewCountCache);
setupAppRoutes(app, models, devMiddleware, templateFile, sendFile);
setupErrorHandlers(app, rollbar);

if (SHOULD_RESET_DB) {
  resetServer(models, closeMiddleware);
} else if (SHOULD_UPDATE_EVENTS) {
  updateEvents(app, models);
} else if (SHOULD_UPDATE_BALANCES) {
  updateBalances(app, models);
} else if (SHOULD_UPDATE_EDGEWARE_LOCKDROP_STATS) {
  // Run fetchStats here to populate lockdrop stats for Edgeware Lockdrop.
  // This only needs to run once on prod to make the necessary queries.
  fetchStats(models, 'mainnet').then((result) => {
    log.info('Finished adding Lockdrop statistics into the DB');
    process.exit(0);
  });
} else if (SHOULD_UPDATE_SUPERNOVA_STATS) {
  // MAINNET Cosmos
  // const cosmosRestUrl = 'http://cosmoshub1.commonwealth.im:1318';
  // const cosmosChainType = 'cosmos';
  // TESTNET Cosmos
  const cosmosRestUrl = 'http://gaia13k1.commonwealth.im:1318';
  const cosmosChainType = 'gaia13k1';
  updateSupernovaStats(models, cosmosRestUrl, cosmosChainType);
} else if (SHOULD_ADD_TEST_QUERIES) {
  import('./server/test/chainObjectQueries')
    .then((object) => addChainObjectQueries(object.default, app, models))
    .then(() => (models.sequelize.close()))
    .then(() => (closeMiddleware()))
    .then(() => {
      log.info('Finished adding test queries to db.');
      process.exit(0);
    });
} else if (!NO_ARCHIVE && SHOULD_UPDATE_CHAIN_OBJECTS_IMMEDIATELY) {
  fetcher.fetch()
    .then(() => {
      closeMiddleware().then(() => {
        log.info('Finished fetching chain objects.');
        process.exit(0);
      });
    })
    .catch((err) => {
      closeMiddleware().then(() => {
        console.error(err);
        process.exit(1);
      });
    });
} else {
  setupServer(app, wss, sessionParser);
  if (!NO_ARCHIVE) fetcher.enable();
}

export default app;
