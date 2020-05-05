import crypto from 'crypto';
import { NotificationCategories } from '../../shared/types';
import { ADDRESS_TOKEN_EXPIRES_IN } from '../config';
import addChainObjectQueries from './addChainObjectQueries';
import app from '../../server';
import { SubstrateEventKinds } from '../../shared/events/edgeware/types';
import { factory, formatFilename } from '../util/logging';
const log = factory.getLogger(formatFilename(__filename));

const nodes = [
  [ 'localhost:9944', 'edgeware-local' ],
  [ 'berlin1.edgewa.re', 'edgeware-testnet' ],
  [ 'berlin2.edgewa.re', 'edgeware-testnet' ],
  [ 'berlin3.edgewa.re', 'edgeware-testnet' ],
  [ 'mainnet1.edgewa.re', 'edgeware' ],
  // [ 'localhost:9944', 'kusama-local' ],
  [ 'wss://kusama-rpc.polkadot.io', 'kusama' ],
  [ 'ws://127.0.0.1:7545', 'ethereum-local' ],
  [ 'wss://mainnet.infura.io/ws', 'ethereum' ],
  // [ '18.223.143.102:9944', 'edgeware-testnet' ],
  // [ '157.230.218.41:9944', 'edgeware-testnet' ],
  // [ '157.230.125.18:9944', 'edgeware-testnet' ],
  // [ '206.189.33.216:9944', 'edgeware-testnet' ],
  [ 'localhost:26657', 'cosmos-local' ],
  [ 'gaia13k1.commonwealth.im:26657', 'cosmos-testnet' ],
  [ 'cosmoshub1.commonwealth.im:26657', 'cosmos' ],
  [ 'http://localhost:3030', 'near-local' ],
  [ 'https://rpc.nearprotocol.com', 'near' ],
  [ 'wss://mainnet.infura.io/ws', 'moloch', '0x1fd169a4f5c59acf79d0fd5d91d1201ef1bce9f1'],
  [ 'wss://mainnet.infura.io/ws', 'metacartel', '0x0372f3696fa7dc99801f435fd6737e57818239f2'],
  // [ 'wss://mainnet.infura.io/ws', 'moloch', '0x0372f3696fa7dc99801f435fd6737e57818239f2'],
  [ 'ws://127.0.0.1:9545', 'moloch-local', '0x9561C133DD8580860B6b7E504bC5Aa500f0f06a7'],
];
const resetServer = (models, closeMiddleware) => {
  log.debug('Resetting database...');

  models.sequelize.sync({ force: true }).then(async () => {
    log.debug('Initializing default models...');
    // Users
    const dillon = await models.User.create({
      email: 'dillon@commonwealth.im',
      emailVerified: true,
      isAdmin: true,
      lastVisited: '{}',
    });
    const raymond = await models.User.create({
      email: 'raymond@commonwealth.im',
      emailVerified: true,
      isAdmin: true,
      lastVisited: '{}',
    });
    const drew = await models.User.create({
      email: 'drew@commonwealth.im',
      emailVerified: true,
      isAdmin: true,
      lastVisited: '{}',
    });
    // Initialize contract categories for all smart contract supporting chains
    await models.ContractCategory.create({
      name: 'Tokens',
      description: 'Token related contracts',
      color: '#4a90e2',
    });
    await models.ContractCategory.create({
      name: 'DAOs',
      description: 'DAO related contracts',
      color: '#9013fe',
    });

    // Initialize different chain + node URLs
    const edgLocal = await models.Chain.create({
      id: 'edgeware-local',
      network: 'edgeware',
      symbol: 'EDG',
      name: 'Edgeware Local',
      icon_url: '/static/img/protocols/edg.png',
      active: true,
      type: 'chain',
    });
    const edgTest = await models.Chain.create({
      id: 'edgeware-testnet',
      network: 'edgeware',
      symbol: 'EDG',
      name: 'Edgeware Testnet',
      icon_url: '/static/img/protocols/edg.png',
      active: true,
      type: 'chain',
    });
    const edgMain = await models.Chain.create({
      id: 'edgeware',
      network: 'edgeware',
      symbol: 'EDG',
      name: 'Edgeware Mainnet',
      icon_url: '/static/img/protocols/edg.png',
      active: true,
      type: 'chain',
    });
    const kusamaLocal = await models.Chain.create({
      id: 'kusama-local',
      network: 'kusama',
      symbol: 'KSM',
      name: 'Kusama Local',
      icon_url: '/static/img/protocols/ksm.png',
      active: true,
      type: 'chain',
    });
    const kusamaMain = await models.Chain.create({
      id: 'kusama',
      network: 'kusama',
      symbol: 'KSM',
      name: 'Kusama',
      icon_url: '/static/img/protocols/ksm.png',
      active: true,
      type: 'chain',
    });
    const atomLocal = await models.Chain.create({
      id: 'cosmos-local',
      network: 'cosmos',
      symbol: 'stake',
      name: 'Cosmos Local',
      icon_url: '/static/img/protocols/atom.png',
      active: true,
      type: 'chain',
    });
    const atomTestnet = await models.Chain.create({
      id: 'cosmos-testnet',
      network: 'cosmos',
      symbol: 'muon',
      name: 'Gaia 13006 Testnet',
      icon_url: '/static/img/protocols/atom.png',
      active: true,
      type: 'chain',
    });
    const atom = await models.Chain.create({
      id: 'cosmos',
      network: 'cosmos',
      symbol: 'uatom',
      name: 'Cosmos Hub',
      icon_url: '/static/img/protocols/atom.png',
      active: true,
      type: 'chain',
    });
    const mkr = await models.Chain.create({
      id: 'maker',
      network: 'maker',
      symbol: 'MKR',
      name: 'Maker',
      icon_url: '/static/img/protocols/mkr.png',
      active: false,
      type: 'dao',
    });
    const xtz = await models.Chain.create({
      id: 'tezos',
      network: 'tezos',
      symbol: 'XTZ',
      name: 'Tezos',
      icon_url: '/static/img/protocols/xtz.png',
      active: false,
      type: 'chain',
    });
    const dot = await models.Chain.create({
      id: 'polkadot',
      network: 'polkadot',
      symbol: 'DOT',
      name: 'Polkadot',
      icon_url: '/static/img/protocols/dot.png',
      active: false,
      type: 'chain',
    });
    // const ethRopsten = await models.Chain.create({
    //   id: 'ethereum-ropsten',
    //   network: 'ethereum',
    //   symbol: 'ETH',
    //   name: 'Ethereum Ropsten',
    //   icon_url: '/static/img/protocols/eth.png',
    //   active: false,
    //   type: 'chain',
    // });
    const ethLocal = await models.Chain.create({
      id: 'ethereum-local',
      network: 'ethereum',
      symbol: 'ETH',
      name: 'Ethereum Local Testnet',
      icon_url: '/static/img/protocols/eth.png',
      active: true,
      type: 'chain',
    });
    const eth = await models.Chain.create({
      id: 'ethereum',
      network: 'ethereum',
      symbol: 'ETH',
      name: 'Ethereum',
      icon_url: '/static/img/protocols/eth.png',
      active: true,
      type: 'chain',
    });
    const nearLocal = await models.Chain.create({
      id: 'near-local',
      network: 'near',
      symbol: 'NEAR',
      name: 'NEAR Protocol',
      icon_url: '/static/img/protocols/near.png',
      active: true,
      type: 'chain',
    });
    const nearTestnet = await models.Chain.create({
      id: 'near',
      network: 'near',
      symbol: 'NEAR',
      name: 'NEAR Protocol',
      icon_url: '/static/img/protocols/near.png',
      active: true,
      type: 'chain',
    });
    const moloch = await models.Chain.create({
      id: 'moloch',
      network: 'moloch',
      symbol: 'Moloch',
      name: 'Moloch',
      icon_url: '/static/img/protocols/molochdao.png',
      active: true,
      type: 'dao',
    });

    // This is the same exact as Moloch, but I want to show the picture on the front end
    const metacartel = await models.Chain.create({
      id: 'metacartel',
      network: 'metacartel',
      symbol: 'Metacartel',
      name: 'Metacartel',
      icon_url: '/static/img/protocols/metacartel.png',
      active: true,
      type: 'dao',
    });

    // add queries for daos
    const molochQueries = (await import('../queries/moloch')).default;
    await addChainObjectQueries(molochQueries, app, models);

    const metacartelQueries = (await import('../queries/metacartel')).default;
    await addChainObjectQueries(metacartelQueries, app, models);

    const molochLocal = await models.Chain.create({
      id: 'moloch-local',
      network: 'moloch',
      symbol: 'Moloch',
      name: 'Moloch',
      icon_url: '/static/img/protocols/molochdao.png',
      active: true,
      type: 'dao',
    });
    // Admin roles for specific communities
    await models.Address.create({
      user_id: 2,
      address: '0x34C3A5ea06a3A67229fb21a7043243B0eB3e853f',
      chain: 'ethereum',
      selected: true,
      verification_token: crypto.randomBytes(18).toString('hex'),
      verification_token_expires: new Date(+(new Date()) + ADDRESS_TOKEN_EXPIRES_IN * 60 * 1000),
      verified: new Date(),
    });
    await models.Address.create({
      address: '5DJA5ZCobDS3GVn8D2E5YRiotDqGkR2FN1bg6LtfNUmuadwX',
      chain: 'edgeware',
      verification_token: crypto.randomBytes(18).toString('hex'),
      verification_token_expires: new Date(+(new Date()) + ADDRESS_TOKEN_EXPIRES_IN * 60 * 1000),
      verified: true,
      keytype: 'sr25519',
    });
    await models.Address.create({
      address: 'ik52qFh92pboSctWPSFKtQwGEpypzz2m6D5ZRP8AYxqjHpM',
      chain: 'edgeware',
      verification_token: crypto.randomBytes(18).toString('hex'),
      verification_token_expires: new Date(+(new Date()) + ADDRESS_TOKEN_EXPIRES_IN * 60 * 1000),
      verified: true,
      keytype: 'sr25519',
    });
    await models.Address.create({
      address: 'js4NB7G3bqEsSYq4ruj9Lq24QHcoKaqauw6YDPD7hMr1Roj',
      chain: 'edgeware',
      verification_token: crypto.randomBytes(18).toString('hex'),
      verification_token_expires: new Date(+(new Date()) + ADDRESS_TOKEN_EXPIRES_IN * 60 * 1000),
      verified: true,
      keytype: 'sr25519',
    });
    // Notification Categories
    await models.NotificationCategory.create({
      name: NotificationCategories.NewCommunity,
      description: 'someone makes a new community'
    });
    await models.NotificationCategory.create({
      name: NotificationCategories.NewThread,
      description: 'someone makes a new thread'
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
      name: NotificationCategories.NewReaction,
      description: 'someone reacts to a post',
    });
    await models.NotificationCategory.create({
      name: NotificationCategories.ChainEvent,
      description: 'a chain event occurs',
    });

    // Admins need to be subscribed to mentions
    await models.Subscription.create({
      subscriber_id: dillon.id,
      category_id: NotificationCategories.NewMention,
      object_id: `user-${dillon.id}`,
      is_active: true,
    });
    await models.Subscription.create({
      subscriber_id: raymond.id,
      category_id: NotificationCategories.NewMention,
      object_id: `user-${raymond.id}`,
      is_active: true,
    });
    await models.Subscription.create({
      subscriber_id: drew.id,
      category_id: NotificationCategories.NewMention,
      object_id: `user-${drew.id}`,
      is_active: true,
    });

    // Communities
    await models.OffchainCommunity.create({
      id: 'staking',
      name: 'Staking',
      creator_id: 1,
      description: 'All things staking',
      default_chain: 'ethereum',
    });
    await models.OffchainCommunity.create({
      id: 'governance',
      name: 'Governance',
      creator_id: 1,
      description: 'All things governance',
      default_chain: 'ethereum',
    });
    await models.OffchainCommunity.create({
      id: 'meta',
      name: 'Commonwealth Meta',
      creator_id: 1,
      description: 'All things Commonwealth',
      default_chain: 'edgeware',
    });
    await models.OffchainCommunity.create({
      id: 'research-daos',
      name: 'Political and Research DAOs',
      creator_id: 1,
      description: 'Decentralized research funding',
      default_chain: 'ethereum',
    });
    await models.OffchainCommunity.create({
      id: 'crypto-education',
      name: 'New to Crypto',
      creator_id: 1,
      description: 'This is just the beginning',
      default_chain: 'ethereum',
    });
    await models.Role.create({
      address_id: 3,
      chain_id: 'edgeware',
      permission: 'admin',
    });
    await models.Role.create({
      address_id: 4,
      chain_id: 'edgeware',
      permission: 'admin',
    });
    await models.Role.create({
      address_id: 3,
      offchain_community_id: 'staking',
      permission: 'admin',
    });
    await models.Role.create({
      address_id: 4,
      offchain_community_id: 'staking',
      permission: 'admin',
    });

    await Promise.all(nodes.map(([ url, chain, address ]) => (models.ChainNode.create({ chain, url, address }))));

    // initialize chain event types
    const initChainEventTypes = (chain) => {
      return Promise.all(
        SubstrateEventKinds.map((event_name) => {
          return models.ChainEventType.create({
            id: `${chain}-${event_name}`,
            chain,
            event_name,
          });
        })
      );
    };

    await initChainEventTypes('edgeware');
    await initChainEventTypes('edgeware-local');

    closeMiddleware().then(() => {
      log.debug('Reset database and initialized default models');
      process.exit(0);
    });
  }).catch((error) => {
    closeMiddleware().then(() => {
      log.error(error);
      log.error('Error syncing db and initializing default models');
      process.exit(1);
    });
  });
};

export default resetServer;
