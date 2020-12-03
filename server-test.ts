/* eslint-disable dot-notation */
import http from 'http';
import favicon from 'serve-favicon';
import logger from 'morgan';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import passport from 'passport';
import session from 'express-session';
import express from 'express';
import SessionSequelizeStore from 'connect-session-sequelize';
import WebSocket from 'ws';

import { SubstrateTypes } from '@commonwealth/chain-events';

import { SESSION_SECRET } from './server/config';
import setupAPI from './server/router';
import setupPassport from './server/passport';
import models from './server/database';
import setupWebsocketServer from './server/socket';
import { NotificationCategories } from './shared/types';
import ViewCountCache from './server/util/viewCountCache';
import IdentityFetchCache from './server/util/identityFetchCache';

require('express-async-errors');

const app = express();
const SequelizeStore = SessionSequelizeStore(session.Store);
// set cache TTL to 1 second to test invalidation
const viewCountCache = new ViewCountCache(1, 10 * 60);
const identityFetchCache = new IdentityFetchCache(0);
const wss = new WebSocket.Server({ clientTracking: false, noServer: true });
let server;

const sessionParser = session({
  secret: SESSION_SECRET,
  store: new SequelizeStore({
    db: models.sequelize,
    tableName: 'Sessions',
    checkExpirationInterval: 15 * 60 * 1000, // Clean up expired sessions every 15 minutes
    expiration: 7 * 24 * 60 * 60 * 1000 // Set session expiration to 7 days
  }),
  resave: false,
  saveUninitialized: true,
});

// serve static files
app.use(favicon(`${__dirname}/favicon.ico`));
app.use('/static', express.static('static'));

// add other middlewares
// app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(sessionParser);
app.use(passport.initialize());
app.use(passport.session());

// store wss into request obj
app.use((req, res, next) => {
  req['wss'] = wss;
  next();
});

const setupErrorHandlers = () => {
  // catch 404 and forward to error handler
  app.use((req, res, next) => {
    const err : any = new Error('Not Found');
    err.status = 404;
    next(err);
  });

  app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.json({ error: err.message });
  });
};

const resetServer = (debug=false): Promise<void> => {
  if (debug) console.log('Resetting database...');

  return new Promise((resolve) => {
    models.sequelize.sync({ force: true }).then(async () => {
      if (debug) console.log('Initializing default models...');

      const drew = await models['User'].create({
        email: 'drewstone329@gmail.com',
        emailVerified: true,
        isAdmin: true,
        lastVisited: '{}',
      });

      // For all smart contract support chains
      await models['ContractCategory'].create({
        name: 'Tokens',
        description: 'Token related contracts',
        color: '#4a90e2',
      });
      await models['ContractCategory'].create({
        name: 'DAOs',
        description: 'DAO related contracts',
        color: '#9013fe',
      });
      // Initialize different chain + node URLs
      const edgMain = await models['Chain'].create({
        id: 'edgeware',
        network: 'edgeware',
        symbol: 'EDG',
        name: 'Edgeware',
        icon_url: '/static/img/protocols/edg.png',
        active: true,
        type: 'chain',
      });
      const eth = await models['Chain'].create({
        id: 'ethereum',
        network: 'ethereum',
        symbol: 'ETH',
        name: 'Ethereum',
        icon_url: '/static/img/protocols/eth.png',
        active: true,
        type: 'chain',
      });

      // Admin roles for specific communities
      await Promise.all([
        models['Address'].create({
          user_id: 1,
          address: '0x34C3A5ea06a3A67229fb21a7043243B0eB3e853f',
          chain: 'ethereum',
          selected: true,
          verification_token: 'PLACEHOLDER',
          verification_token_expires: null,
          verified: new Date(),
        }),
        models['Address'].create({
          address: '5DJA5ZCobDS3GVn8D2E5YRiotDqGkR2FN1bg6LtfNUmuadwX',
          chain: 'edgeware',
          verification_token: 'PLACEHOLDER',
          verification_token_expires: null,
          verified: true,
          keytype: 'sr25519',
        }),
        models['Address'].create({
          address: 'ik52qFh92pboSctWPSFKtQwGEpypzz2m6D5ZRP8AYxqjHpM',
          chain: 'edgeware',
          verification_token: 'PLACEHOLDER',
          verification_token_expires: null,
          verified: true,
          keytype: 'sr25519',
        }),
        models['Address'].create({
          address: 'js4NB7G3bqEsSYq4ruj9Lq24QHcoKaqauw6YDPD7hMr1Roj',
          chain: 'edgeware',
          verification_token: 'PLACEHOLDER',
          verification_token_expires: null,
          verified: true,
          keytype: 'sr25519',
        }),
      ]);

      // Notification Categories
      await models['NotificationCategory'].create({
        name: NotificationCategories.NewCommunity,
        description: 'someone makes a new community'
      });
      await models['NotificationCategory'].create({
        name: NotificationCategories.NewThread,
        description: 'someone makes a new thread'
      });
      await models['NotificationCategory'].create({
        name: NotificationCategories.NewComment,
        description: 'someone makes a new comment',
      });
      await models['NotificationCategory'].create({
        name: NotificationCategories.NewMention,
        description: 'someone @ mentions a user',
      });
      await models['NotificationCategory'].create({
        name: NotificationCategories.ChainEvent,
        description: 'a chain event occurs',
      });
      await models['NotificationCategory'].create({
        name: NotificationCategories.NewReaction,
        description: 'someone reacts to a post',
      });

      // Admins need to be subscribed to mentions
      await models['Subscription'].create({
        subscriber_id: drew.id,
        category_id: NotificationCategories.NewMention,
        object_id: `user-${drew.id}`,
        is_active: true,
      });

      // Communities
      await models['OffchainCommunity'].create({
        id: 'staking',
        name: 'Staking',
        creator_id: 1,
        description: 'All things staking',
        default_chain: 'ethereum',
      });

      const nodes = [
        [ 'mainnet1.edgewa.re', 'edgeware' ],
        [ 'wss://mainnet.infura.io/ws', 'ethereum' ],
      ];
      await Promise.all(nodes.map(([ url, chain, address ]) => (models['ChainNode'].create({ chain, url, address }))));

      // initialize chain event types
      const initChainEventTypes = (chain) => {
        return Promise.all(
          SubstrateTypes.EventKinds.map((event_name) => {
            return models['ChainEventType'].create({
              id: `${chain}-${event_name}`,
              chain,
              event_name,
            });
          })
        );
      };

      await initChainEventTypes('edgeware');

      if (debug) console.log('Database reset!');
      resolve();
    });
  });
};

const setupServer = () => {
  const port = 8081;
  app.set('port', port);
  server = http.createServer(app);
  const onError = (error) => {
    if (error.syscall !== 'listen') {
      throw error;
    }
    switch (error.code) {
      case 'EACCES':
        console.error('Port requires elevated privileges');
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error('Port is already in use');
        process.exit(1);
        break;
      default:
        throw error;
    }
  };

  const onListen = () => {
    const addr = server.address();
    if (typeof addr === 'string') {
      console.log(`Listening on ${addr}`);
    } else {
      console.log(`Listening on port ${addr.port}`);
    }
  };

  setupWebsocketServer(wss, server, sessionParser, false);

  server.listen(port);
  server.on('error', onError);
  server.on('listening', onListen);
};

setupPassport(models);
setupAPI(app, models, viewCountCache, identityFetchCache);
setupErrorHandlers();
setupServer();

export const resetDatabase = () => resetServer();
export const getIdentityFetchCache = () => identityFetchCache;

export default app;
