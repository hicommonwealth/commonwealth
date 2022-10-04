/* eslint-disable dot-notation */
import http from 'http';
import favicon from 'serve-favicon';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import passport from 'passport';
import session from 'express-session';
import express from 'express';
import SessionSequelizeStore from 'connect-session-sequelize';
import BN from 'bn.js';
import Rollbar from 'rollbar';
import {
  ChainBase,
  ChainNetwork,
  NotificationCategories,
  ChainType,
  BalanceType,
} from 'common-common/src/types';
import TokenBalanceCache from 'token-balance-cache/src/index';
import TokenBalanceProvider from 'token-balance-cache/src/provider';

import {ROLLBAR_SERVER_TOKEN, SESSION_SECRET} from './server/config';
import setupAPI from './server/router'; // performance note: this takes 15 seconds
import setupPassport from './server/passport';
import models from './server/database';
import ViewCountCache from './server/util/viewCountCache';
import IdentityFetchCache from './server/util/identityFetchCache';
import BanCache from './server/util/banCheckCache';
import setupErrorHandlers from './server/scripts/setupErrorHandlers';
import RuleCache from './server/util/rules/ruleCache';

require('express-async-errors');

const app = express();
const SequelizeStore = SessionSequelizeStore(session.Store);
// set cache TTL to 1 second to test invalidation
const viewCountCache = new ViewCountCache(1, 10 * 60);
const identityFetchCache = new IdentityFetchCache(10 * 60);

// always prune both token and non-token holders asap
class MockTokenBalanceProvider extends TokenBalanceProvider {
  public balanceFn: (tokenAddress: string, userAddress: string) => Promise<BN>;

  public async getEthTokenBalance(
    address: string,
    network: string,
    tokenAddress?: string,
    userAddress?: string
  ): Promise<BN> {
    if (this.balanceFn) {
      return this.balanceFn(tokenAddress, userAddress);
    } else {
      throw new Error('unable to fetch token balance');
    }
  }
}

const mockTokenBalanceProvider = new MockTokenBalanceProvider();
const tokenBalanceCache = new TokenBalanceCache(
  0,
  0,
  mockTokenBalanceProvider
);
const ruleCache = new RuleCache();
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
  if (debug) console.log('Resetting database...');
  return new Promise(async (resolve) => {
    try {
      await models.sequelize.sync({ force: true });
      console.log('done syncing.');
      if (debug) console.log('Initializing default models...');
      const drew = await models.User.create({
        email: 'drewstone329@gmail.com',
        emailVerified: true,
        isAdmin: true,
        lastVisited: '{}',
      });

      const nodes = [
        ['mainnet1.edgewa.re'],
        [
          'wss://eth-mainnet.alchemyapi.io/v2/cNC4XfxR7biwO2bfIO5aKcs9EMPxTQfr',
          '1',
        ],
        [
          'wss://eth-ropsten.alchemyapi.io/v2/2xXT2xx5AvA3GFTev3j_nB9LzWdmxPk7',
          '3',
        ],
      ];

      const [edgewareNode, mainnetNode, testnetNode] = await Promise.all(
        nodes.map(([url, eth_chain_id]) =>
          models.ChainNode.create({
            url,
            eth_chain_id: eth_chain_id ? +eth_chain_id : null,
            balance_type: BalanceType.Ethereum,
          })
        )
      );

      // Initialize different chain + node URLs
      const edgMain = await models.Chain.create({
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
      const eth = await models.Chain.create({
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
      const alex = await models.Chain.create({
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
      const alexContract = await models.Contract.create({
        address: '0xFab46E002BbF0b4509813474841E0716E6730136',
        token_name: 'Alex',
        symbol: 'ALEX',
        type: ChainNetwork.ERC20,
        chain_node_id: testnetNode.id,
      });
      const alexCommunityContract = await models.CommunityContract.create({
        chain_id: alex.id,
        contract_id: alexContract.id,
      })
      const yearn = await models.Chain.create({
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
      const yearnCommunityContract = await models.CommunityContract.create({
        chain_id: yearn.id,
        contract_id: yearnContract.id,
      });
      const sushi = await models.Chain.create({
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
      const sushiCommunityContract = await models.CommunityContract.create({
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
        description: 'someone edited a thread'
      })
      await models.NotificationCategory.create({
        name: NotificationCategories.CommentEdit,
        description: 'someoned edited a comment'
      })
      await models.NotificationCategory.create({
        name: NotificationCategories.NewRoleCreation,
        description: 'someone created a role'
      })
      await models.NotificationCategory.create({
        name: NotificationCategories.EntityEvent,
        description: 'an entity-event as occurred'
      })
      await models.NotificationCategory.create({
        name: NotificationCategories.NewChatMention,
        description: 'someone mentions a user in chat'
      })

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

      if (debug) console.log('Database reset!');
    } catch (error) {
      console.log('error', error);
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
      console.log(`Listening on ${addr}`);
    } else {
      console.log(`Listening on port ${addr.port}`);
    }
  };

  server.listen(port);
  server.on('error', onError);
  server.on('listening', onListen);
};

const banCache = new BanCache(models);
setupPassport(models);
setupAPI(app, models, viewCountCache, identityFetchCache, tokenBalanceCache, ruleCache, banCache);

const rollbar = new Rollbar({
  accessToken: ROLLBAR_SERVER_TOKEN,
  environment: process.env.NODE_ENV,
  captureUncaught: true,
  captureUnhandledRejections: true,
});

setupErrorHandlers(app, rollbar);

setupServer();

export const resetDatabase = () => resetServer();
export const getIdentityFetchCache = () => identityFetchCache;
export const getTokenBalanceCache = () => tokenBalanceCache;
export const getBanCache = () => banCache;
export const getMockBalanceProvider = () => mockTokenBalanceProvider;

export default app;
