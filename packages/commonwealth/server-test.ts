/* eslint-disable dot-notation */
import bodyParser from 'body-parser';
import setupErrorHandlers from 'common-common/src/scripts/setupErrorHandlers';
import {
  BalanceType,
  ChainBase,
  ChainNetwork,
  ChainType,
  NotificationCategories,
} from 'common-common/src/types';
import SessionSequelizeStore from 'connect-session-sequelize';
import cookieParser from 'cookie-parser';
import type { Express } from 'express';
import express from 'express';
import session from 'express-session';
import http from 'http';
import passport from 'passport';
import Rollbar from 'rollbar';
import favicon from 'serve-favicon';
import setupAPI from './server/routing/router'; // performance note: this takes 15 seconds
import { TokenBalanceCache } from 'token-balance-cache/src/index';

import {
  ROLLBAR_ENV,
  ROLLBAR_SERVER_TOKEN,
  SESSION_SECRET,
} from './server/config';
import models from './server/database';
import DatabaseValidationService from './server/middleware/databaseValidationService';
import setupPassport from './server/passport';
import BanCache from './server/util/banCheckCache';
import GlobalActivityCache from './server/util/globalActivityCache';
import RuleCache from './server/util/rules/ruleCache';
import ViewCountCache from './server/util/viewCountCache';
import { MockTokenBalanceProvider } from './test/util/modelUtils';
import setupCosmosProxy from 'server/util/cosmosProxy';

import { cacheDecorator } from '../common-common/src/cacheDecorator';
import { ServerError } from 'common-common/src/errors';
import {
  lookupKeyDurationInReq,
  CustomRequest,
} from '../common-common/src/cacheKeyUtils';

import { factory, formatFilename } from 'common-common/src/logging';

const log = factory.getLogger(formatFilename(__filename));

require('express-async-errors');

const app = express();
const SequelizeStore = SessionSequelizeStore(session.Store);
// set cache TTL to 1 second to test invalidation
const viewCountCache = new ViewCountCache(1, 10 * 60);
const mockTokenBalanceProvider = new MockTokenBalanceProvider();
const tokenBalanceCache = new TokenBalanceCache(0, 0, [
  mockTokenBalanceProvider,
]);
const ruleCache = new RuleCache();
const databaseValidationService = new DatabaseValidationService(models);
let server;

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

const resetServer = (debug = false): Promise<void> => {
  if (debug) log.info('Resetting database...');
  return new Promise(async (resolve) => {
    try {
      await models.sequelize.sync({ force: true });
      log.info('done syncing.');
      if (debug) log.info('Initializing default models...');
      const drew = await models.User.create({
        email: 'drewstone329@gmail.com',
        emailVerified: true,
        isAdmin: true,
        lastVisited: '{}',
      });

      const nodes = [
        ['mainnet1.edgewa.re', 'Edgeware Mainnet', null, BalanceType.Substrate],
        [
          'wss://eth-mainnet.alchemyapi.io/v2/cNC4XfxR7biwO2bfIO5aKcs9EMPxTQfr',
          'Ethereum Mainnet',
          '1',
        ],
        [
          'wss://eth-ropsten.alchemyapi.io/v2/2xXT2xx5AvA3GFTev3j_nB9LzWdmxPk7',
          'Ropsten Testnet',
          '3',
        ],
        ['https://rpc-juno.itastakers.com', 'Juno', null, BalanceType.Cosmos],
        [
          'https://cosmos-devnet.herokuapp.com/rpc',
          'Cosmos SDK v0.46.11 devnet',
          null,
          BalanceType.Cosmos,
          'https://cosmos-devnet.herokuapp.com/lcd/',
        ],
      ];

      const [edgewareNode, mainnetNode, testnetNode, junoNode, csdkNode] =
        await Promise.all(
          nodes.map(([url, name, eth_chain_id, balance_type, alt_wallet_url]) =>
            models.ChainNode.create({
              url,
              name,
              eth_chain_id: eth_chain_id ? +eth_chain_id : null,
              balance_type:
                balance_type || eth_chain_id
                  ? BalanceType.Ethereum
                  : BalanceType.Substrate,
              alt_wallet_url,
            })
          )
        );

      // Initialize different chain + node URLs
      await models.Community.create({
        id: 'edgeware',
        network: ChainNetwork.Edgeware,
        default_symbol: 'EDG',
        name: 'Edgeware',
        icon_url: '/static/img/protocols/edg.png',
        active: true,
        type: ChainType.Chain,
        base: ChainBase.Substrate,
        ss58_prefix: 7,
        has_chain_events_listener: false,
        chain_node_id: edgewareNode.id,
      });
      await models.Community.create({
        id: 'ethereum',
        network: ChainNetwork.Ethereum,
        default_symbol: 'ETH',
        name: 'Ethereum',
        icon_url: '/static/img/protocols/eth.png',
        active: true,
        type: ChainType.Chain,
        base: ChainBase.Ethereum,
        has_chain_events_listener: false,
        chain_node_id: mainnetNode.id,
      });
      const alex = await models.Community.create({
        id: 'alex',
        network: ChainNetwork.ERC20,
        default_symbol: 'ALEX',
        name: 'Alex',
        icon_url: '/static/img/protocols/eth.png',
        active: true,
        type: ChainType.Token,
        base: ChainBase.Ethereum,
        has_chain_events_listener: false,
        chain_node_id: testnetNode.id,
      });
      await models.Community.create({
        id: 'juno',
        network: ChainNetwork.Osmosis,
        default_symbol: 'JUNO',
        name: 'Juno',
        icon_url: '/static/img/protocols/cosmos.png',
        active: true,
        type: ChainType.Chain,
        base: ChainBase.CosmosSDK,
        has_chain_events_listener: false,
        chain_node_id: junoNode.id,
      });
      await models.Community.create({
        id: 'csdk',
        network: ChainNetwork.Osmosis,
        default_symbol: 'STAKE',
        name: 'Cosmos SDK v0.46.11 devnet',
        icon_url: '/static/img/protocols/cosmos.png',
        active: true,
        type: ChainType.Chain,
        base: ChainBase.CosmosSDK,
        has_chain_events_listener: false,
        chain_node_id: csdkNode.id,
      });
      const alexContract = await models.Contract.create({
        address: '0xFab46E002BbF0b4509813474841E0716E6730136',
        token_name: 'Alex',
        symbol: 'ALEX',
        type: ChainNetwork.ERC20,
        chain_node_id: testnetNode.id,
      });
      await models.CommunityContract.create({
        chain_id: alex.id,
        contract_id: alexContract.id,
      });
      const yearn = await models.Community.create({
        id: 'yearn',
        network: ChainNetwork.ERC20,
        default_symbol: 'YFI',
        name: 'yearn.finance',
        icon_url: '/static/img/protocols/eth.png',
        active: true,
        type: ChainType.Token,
        base: ChainBase.Ethereum,
        has_chain_events_listener: false,
        chain_node_id: mainnetNode.id,
      });
      const yearnContract = await models.Contract.create({
        address: '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
        token_name: 'yearn',
        symbol: 'YFI',
        type: ChainNetwork.ERC20,
        chain_node_id: mainnetNode.id,
      });
      await models.CommunityContract.create({
        chain_id: yearn.id,
        contract_id: yearnContract.id,
      });
      const sushi = await models.Community.create({
        id: 'sushi',
        network: ChainNetwork.ERC20,
        default_symbol: 'SUSHI',
        name: 'Sushi',
        icon_url: '/static/img/protocols/eth.png',
        active: true,
        type: ChainType.Token,
        base: ChainBase.Ethereum,
        has_chain_events_listener: false,
        chain_node_id: mainnetNode.id,
      });
      const sushiContract = await models.Contract.create({
        address: '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2',
        token_name: 'sushi',
        symbol: 'SUSHI',
        type: ChainNetwork.ERC20,
        chain_node_id: mainnetNode.id,
      });
      await models.CommunityContract.create({
        chain_id: sushi.id,
        contract_id: sushiContract.id,
      });

      // Admin roles for specific communities
      await Promise.all([
        models.Address.create({
          user_id: 1,
          address: '0x34C3A5ea06a3A67229fb21a7043243B0eB3e853f',
          chain: 'ethereum',
          // selected: true,
          verification_token: 'PLACEHOLDER',
          verification_token_expires: null,
          verified: new Date(),
        }),
        models.Address.create({
          address: '5DJA5ZCobDS3GVn8D2E5YRiotDqGkR2FN1bg6LtfNUmuadwX',
          chain: 'edgeware',
          verification_token: 'PLACEHOLDER',
          verification_token_expires: null,
          verified: new Date(),
          keytype: 'sr25519',
        }),
        models.Address.create({
          address: 'ik52qFh92pboSctWPSFKtQwGEpypzz2m6D5ZRP8AYxqjHpM',
          chain: 'edgeware',
          verification_token: 'PLACEHOLDER',
          verification_token_expires: null,
          verified: new Date(),
          keytype: 'sr25519',
        }),
        models.Address.create({
          address: 'js4NB7G3bqEsSYq4ruj9Lq24QHcoKaqauw6YDPD7hMr1Roj',
          chain: 'edgeware',
          verification_token: 'PLACEHOLDER',
          verification_token_expires: null,
          verified: new Date(),
          keytype: 'sr25519',
        }),
      ]);

      // Notification Categories
      await models.NotificationCategory.create({
        name: NotificationCategories.NewCommunity,
        description: 'someone makes a new community',
      });
      await models.NotificationCategory.create({
        name: NotificationCategories.NewThread,
        description: 'someone makes a new thread',
      });
      await models.NotificationCategory.create({
        name: NotificationCategories.NewComment,
        description: 'someone makes a new comment',
      });
      await models.NotificationCategory.create({
        name: NotificationCategories.NewMention,
        description: 'someone @ mentions a user',
      });
      await models.NotificationCategory.create({
        name: NotificationCategories.NewCollaboration,
        description: 'someone collaborates with a user',
      });
      await models.NotificationCategory.create({
        name: NotificationCategories.ChainEvent,
        description: 'a chain event occurs',
      });
      await models.NotificationCategory.create({
        name: NotificationCategories.NewReaction,
        description: 'someone reacts to a post',
      });
      await models.NotificationCategory.create({
        name: NotificationCategories.ThreadEdit,
        description: 'someone edited a thread',
      });
      await models.NotificationCategory.create({
        name: NotificationCategories.CommentEdit,
        description: 'someoned edited a comment',
      });
      await models.NotificationCategory.create({
        name: NotificationCategories.NewRoleCreation,
        description: 'someone created a role',
      });
      await models.NotificationCategory.create({
        name: NotificationCategories.EntityEvent,
        description: 'an entity-event as occurred',
      });
      await models.NotificationCategory.create({
        name: NotificationCategories.NewChatMention,
        description: 'someone mentions a user in chat',
      });

      // Admins need to be subscribed to mentions and collaborations
      await models.Subscription.create({
        subscriber_id: drew.id,
        category_id: NotificationCategories.NewMention,
        object_id: `user-${drew.id}`,
        is_active: true,
      });
      await models.Subscription.create({
        subscriber_id: drew.id,
        category_id: NotificationCategories.NewCollaboration,
        object_id: `user-${drew.id}`,
        is_active: true,
      });
      await models.SnapshotSpace.create({
        snapshot_space: 'test space',
      });
      await models.SnapshotProposal.create({
        id: '1',
        title: 'Test Snapshot Proposal',
        body: 'This is a test proposal',
        choices: ['Yes', 'No'],
        space: 'test space',
        event: 'proposal/created',
        start: new Date().toString(),
        expire: new Date(
          new Date().getTime() + 100 * 24 * 60 * 60 * 1000
        ).toString(),
      });

      if (debug) log.info('Database reset!');
    } catch (error) {
      log.info('error', error);
    }
    resolve();
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
        console.error(`Port ${port} already in use`);
        process.exit(1);
        break;
      default:
        throw error;
    }
  };

  const onListen = () => {
    const addr = server.address();
    if (typeof addr === 'string') {
      log.info(`Listening on ${addr}`);
    } else {
      log.info(`Listening on port ${addr.port}`);
    }
  };

  server.listen(port);
  server.on('error', onError);
  server.on('listening', onListen);
};

export enum CACHE_ENDPOINTS {
  BROKEN_5XX = '/cachedummy/broken5xx',
  BROKEN_4XX = '/cachedummy/broken4xx',
  JSON = '/cachedummy/json',
  TEXT = '/cachedummy/text',
  CUSTOM_KEY_DURATION = '/cachedummy/customKeyDuration',
}

export const setupCacheTestEndpoints = (appAttach: Express) => {
  log.info('setupCacheTestEndpoints');

  // /cachedummy endpoint for testing
  appAttach.get(
    CACHE_ENDPOINTS.BROKEN_4XX,
    cacheDecorator.cacheMiddleware(3),
    async (req, res) => {
      log.info(`${CACHE_ENDPOINTS.BROKEN_4XX} called`);
      res.status(400).json({ message: 'cachedummy 400 response' });
    }
  );

  appAttach.get(
    CACHE_ENDPOINTS.JSON,
    cacheDecorator.cacheMiddleware(3),
    async (req, res) => {
      log.info(`${CACHE_ENDPOINTS.JSON} called`);
      res.json({ message: 'cachedummy response' });
    }
  );

  appAttach.post(
    CACHE_ENDPOINTS.CUSTOM_KEY_DURATION,
    (req: CustomRequest, res, next) => {
      log.info(`${CACHE_ENDPOINTS.CUSTOM_KEY_DURATION} called`);
      const body = req.body;
      if (!body || !body.duration || !body.key) {
        return next();
      }
      req.cacheKey = body.key;
      req.cacheDuration = body.duration;
      return next();
    },
    cacheDecorator.cacheMiddleware(3, lookupKeyDurationInReq),
    async (req, res) => {
      res.json(req.body);
    }
  );

  // Uncomment the following lines if you want to use the /cachedummy/json route
  // app.post('/cachedummy/json', cacheDecorator.cacheInvalidMiddleware(3), async (req, res) => {
  //   res.json({ 'message': 'cachedummy response' });
  // });

  appAttach.get(
    CACHE_ENDPOINTS.TEXT,
    cacheDecorator.cacheMiddleware(3),
    async function cacheTextEndpoint(req, res) {
      log.info(`${CACHE_ENDPOINTS.TEXT} called`);
      res.send('cachedummy response');
    }
  );

  appAttach.get(
    CACHE_ENDPOINTS.BROKEN_5XX,
    cacheDecorator.cacheMiddleware(3),
    async (req, res, next) => {
      log.info(`${CACHE_ENDPOINTS.BROKEN_5XX} called`);
      const err = new Error('route error');
      return next(new ServerError('broken route', err));
    }
  );
};

const banCache = new BanCache(models);
const globalActivityCache = new GlobalActivityCache(models);
globalActivityCache.start();
setupPassport(models);
// TODO: mock RabbitMQController
setupAPI(
  '/api',
  app,
  models,
  viewCountCache,
  tokenBalanceCache,
  ruleCache,
  banCache,
  globalActivityCache,
  databaseValidationService
);
setupCosmosProxy(app, models);
setupCacheTestEndpoints(app);

const rollbar = new Rollbar({
  accessToken: ROLLBAR_SERVER_TOKEN,
  environment: ROLLBAR_ENV,
  captureUncaught: true,
  captureUnhandledRejections: true,
});

setupErrorHandlers(app, rollbar);
setupServer();

function availableRoutes() {
  return app._router.stack
    .filter((r) => r.route)
    .map((r) => {
      return {
        method: Object.keys(r.route.methods)[0].toUpperCase(),
        path: r.route.path,
      };
    });
}

console.log(JSON.stringify(availableRoutes(), null, 2));

export const resetDatabase = () => resetServer();
export const getTokenBalanceCache = () => tokenBalanceCache;
export const getBanCache = () => banCache;
export const getMockBalanceProvider = () => mockTokenBalanceProvider;

export default app;
