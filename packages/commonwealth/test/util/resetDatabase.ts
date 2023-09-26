import models from '../../server/database';
import {
  BalanceType,
  ChainBase,
  ChainNetwork,
  ChainType,
  NotificationCategories,
} from 'common-common/src/types';
import { factory, formatFilename } from 'common-common/src/logging';

const log = factory.getLogger(formatFilename(__filename));

export const resetDatabase = (debug = false): Promise<void> => {
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
      });

      const nodes = [
        ['mainnet1.edgewa.re', 'Edgeware Mainnet', null, BalanceType.Substrate],
        [
          'https://eth-mainnet.alchemyapi.io/v2/dummy_key',
          'Ethereum Mainnet',
          '1',
        ],
        [
          'https://eth-ropsten.alchemyapi.io/v2/dummy_key',
          'Ropsten Testnet',
          '3',
        ],
        [
          'https://rpc-osmosis.ecostake.com',
          'Osmosis',
          null,
          BalanceType.Cosmos,
        ],
        [
          'https://cosmos-devnet-beta.herokuapp.com/rpc',
          'Cosmos SDK v0.45.0 devnet',
          null,
          BalanceType.Cosmos,
          'https://cosmos-devnet-beta.herokuapp.com/lcd/',
        ],
        [
          'https://cosmos-devnet.herokuapp.com/rpc',
          'Cosmos SDK v0.46.11 devnet',
          null,
          BalanceType.Cosmos,
          'https://cosmos-devnet.herokuapp.com/lcd/',
        ],
      ];

      const [
        edgewareNode,
        mainnetNode,
        testnetNode,
        osmosisNode,
        csdkBetaNode,
        csdkNode,
      ] = await Promise.all(
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
      await models.Chain.create({
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
      await models.Chain.create({
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
      await models.Chain.create({
        id: 'osmosis',
        network: ChainNetwork.Osmosis,
        default_symbol: 'OSMO',
        name: 'Osmosis',
        icon_url: '/static/img/protocols/cosmos.png',
        active: true,
        type: ChainType.Chain,
        base: ChainBase.CosmosSDK,
        has_chain_events_listener: false,
        chain_node_id: osmosisNode.id,
      });
      await models.Chain.create({
        id: 'csdk-beta',
        network: ChainNetwork.Osmosis,
        default_symbol: 'STAKE',
        name: 'Cosmos SDK v0.45.0 devnet',
        icon_url: '/static/img/protocols/cosmos.png',
        active: true,
        type: ChainType.Chain,
        base: ChainBase.CosmosSDK,
        has_chain_events_listener: false,
        chain_node_id: csdkBetaNode.id,
      });
      await models.Chain.create({
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
      await models.CommunityContract.create({
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
        name: NotificationCategories.SnapshotProposal,
        description: 'Snapshot proposal notifications',
      });

      // Admins need to be subscribed to mentions and collaborations
      await models.Subscription.create({
        subscriber_id: drew.id,
        category_id: NotificationCategories.NewMention,
        is_active: true,
      });
      await models.Subscription.create({
        subscriber_id: drew.id,
        category_id: NotificationCategories.NewCollaboration,
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
