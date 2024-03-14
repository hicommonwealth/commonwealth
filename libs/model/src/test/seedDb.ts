import {
  BalanceType,
  ChainBase,
  ChainNetwork,
  ChainType,
  CosmosGovernanceVersion,
  NotificationCategories,
  User,
  logger,
} from '@hicommonwealth/core';
import { QueryTypes, Sequelize } from 'sequelize';
import { seed } from './seed';

export const checkDb = async () => {
  let sequelize: Sequelize | undefined = undefined;
  try {
    sequelize = new Sequelize('postgresql://commonwealth:edgeware@localhost', {
      logging: false,
    });
    const testdbname = 'common_test';
    const [{ count }] = await sequelize.query<{ count: number }>(
      `SELECT COUNT(*) FROM pg_database WHERE datname = '${testdbname}'`,
      { type: QueryTypes.SELECT },
    );
    if (!+count) await sequelize.query(`CREATE DATABASE ${testdbname};`);
  } catch (error) {
    console.error('Error creating test db:', error);
  } finally {
    sequelize && sequelize.close();
  }
};

export const seedDb = async (debug = false): Promise<User> => {
  const log = logger().getLogger(__filename);
  if (debug) log.info('Seeding test db...');
  try {
    await checkDb();

    // connect and seed
    const { models } = await import('..');

    await models.sequelize.sync({ force: true });
    log.info('done syncing.');
    if (debug) log.info('Initializing default models...');

    const [drew] = await seed('User', {
      email: 'drewstone329@gmail.com',
      emailVerified: true,
      isAdmin: true,
    });
    const [testAdmin] = await seed('User', {
      id: 2,
      email: 'temp@gmail.com',
      emailVerified: true,
      isAdmin: true,
    });

    const [edgewareNode] = await seed('ChainNode', {
      url: 'mainnet1.edgewa.re',
      name: 'Edgeware Mainnet',
      balance_type: BalanceType.Substrate,
      contracts: [],
    });
    const [mainnetNode] = await seed('ChainNode', {
      url: 'https://eth-mainnet.alchemyapi.io/v2/dummy_key',
      name: 'Ethereum Mainnet',
      eth_chain_id: 1,
      balance_type: BalanceType.Ethereum,
      contracts: [],
    });
    const [testnetNode] = await seed('ChainNode', {
      id: 1263,
      url: 'https://ethereum-sepolia.publicnode.com',
      name: 'Sepolia Testnet',
      eth_chain_id: 11155111,
      balance_type: BalanceType.Ethereum,
      contracts: [],
    });
    const [osmosisNode] = await seed('ChainNode', {
      url: 'https://rpc-osmosis.ecostake.com',
      name: 'Osmosis',
      balance_type: BalanceType.Cosmos,
      cosmos_chain_id: 'osmosis',
      bech32: 'osmo',
      contracts: [],
    });
    const [csdkBetaNode] = await seed('ChainNode', {
      url: 'https://cosmos-devnet-beta.herokuapp.com/rpc',
      name: 'Cosmos SDK v0.45.0 devnet',
      balance_type: BalanceType.Cosmos,
      alt_wallet_url: 'https://cosmos-devnet-beta.herokuapp.com/lcd/',
      cosmos_chain_id: 'csdkbetaci',
      bech32: 'cosmos',
      contracts: [],
    });
    const [csdkV1Node] = await seed('ChainNode', {
      url: 'https://cosmos-devnet.herokuapp.com/rpc',
      name: 'Cosmos SDK v0.46.11 devnet',
      balance_type: BalanceType.Cosmos,
      alt_wallet_url: 'https://cosmos-devnet.herokuapp.com/lcd/',
      cosmos_chain_id: 'csdkv1',
      bech32: 'cosmos',
      cosmos_gov_version: CosmosGovernanceVersion.v1,
      contracts: [],
    });
    const [csdkBetaLocalNode] = await seed('ChainNode', {
      url: 'http://localhost:5050/rpc',
      name: 'CI: Cosmos SDK v0.45.0 devnet',
      balance_type: BalanceType.Cosmos,
      alt_wallet_url: 'http://localhost:5050/lcd/',
      cosmos_chain_id: 'csdkbetalocal',
      bech32: 'cosmos',
      cosmos_gov_version: CosmosGovernanceVersion.v1beta1,
      contracts: [],
    });
    const [csdkV1LocalNode] = await seed('ChainNode', {
      url: 'http://localhost:5051/rpc',
      name: 'CI: Cosmos SDK v0.46.11 devnet',
      balance_type: BalanceType.Cosmos,
      alt_wallet_url: 'http://localhost:5051/lcd/',
      cosmos_chain_id: 'csdkv1local',
      bech32: 'cosmos',
      cosmos_gov_version: CosmosGovernanceVersion.v1,
      contracts: [],
    });
    const [ethermintLocalNode] = await seed('ChainNode', {
      url: 'http://localhost:5052/rpc',
      name: 'CI: Ethermint devnet',
      balance_type: BalanceType.Cosmos,
      alt_wallet_url: 'http://localhost:5052/lcd/',
      cosmos_chain_id: 'evmosdevlocal',
      bech32: 'cosmos',
      contracts: [],
    });

    const [alex, yearn, sushi] = await models.Community.bulkCreate([
      {
        id: 'alex',
        network: ChainNetwork.ERC20,
        default_symbol: 'ALEX',
        name: 'Alex',
        icon_url: '/static/img/protocols/eth.png',
        active: true,
        type: ChainType.Token,
        base: ChainBase.Ethereum,
        has_chain_events_listener: false,
        chain_node_id: testnetNode!.id!,
      },
      {
        id: 'yearn',
        network: ChainNetwork.ERC20,
        default_symbol: 'YFI',
        name: 'yearn.finance',
        icon_url: '/static/img/protocols/eth.png',
        active: true,
        type: ChainType.Token,
        base: ChainBase.Ethereum,
        has_chain_events_listener: false,
        chain_node_id: mainnetNode!.id!,
      },
      {
        id: 'sushi',
        network: ChainNetwork.ERC20,
        default_symbol: 'SUSHI',
        name: 'Sushi',
        icon_url: '/static/img/protocols/eth.png',
        active: true,
        description: 'sushi community description',
        type: ChainType.Token,
        base: ChainBase.Ethereum,
        has_chain_events_listener: false,
        chain_node_id: mainnetNode!.id!,
      },
      {
        id: 'osmosis',
        network: ChainNetwork.Osmosis,
        default_symbol: 'OSMO',
        name: 'Osmosis',
        icon_url: '/static/img/protocols/cosmos.png',
        active: true,
        type: ChainType.Chain,
        base: ChainBase.CosmosSDK,
        has_chain_events_listener: false,
        chain_node_id: osmosisNode!.id!,
        bech32_prefix: 'osmo',
      },
      {
        id: 'csdk-beta',
        network: ChainNetwork.Osmosis,
        default_symbol: 'STAKE',
        name: 'Cosmos SDK v0.45.0 devnet',
        icon_url: '/static/img/protocols/cosmos.png',
        active: true,
        type: ChainType.Chain,
        base: ChainBase.CosmosSDK,
        has_chain_events_listener: false,
        chain_node_id: csdkBetaNode!.id!,
        bech32_prefix: 'cosmos',
      },
      {
        id: 'csdk',
        network: ChainNetwork.Osmosis,
        default_symbol: 'STAKE',
        name: 'Cosmos SDK v0.46.11 devnet',
        icon_url: '/static/img/protocols/cosmos.png',
        active: true,
        type: ChainType.Chain,
        base: ChainBase.CosmosSDK,
        has_chain_events_listener: true,
        chain_node_id: csdkV1Node!.id!,
        bech32_prefix: 'cosmos',
      },
      {
        id: 'csdk-beta-local',
        network: ChainNetwork.Osmosis,
        default_symbol: 'STAKE',
        name: 'CI: Cosmos SDK v0.45 devnet',
        icon_url: '/static/img/protocols/cosmos.png',
        active: true,
        type: ChainType.Chain,
        base: ChainBase.CosmosSDK,
        has_chain_events_listener: true,
        chain_node_id: csdkBetaLocalNode!.id!,
        bech32_prefix: 'cosmos',
      },
      {
        id: 'csdk-v1-local',
        network: ChainNetwork.Osmosis,
        default_symbol: 'STAKE',
        name: 'CI: Cosmos SDK v0.46.11 devnet',
        icon_url: '/static/img/protocols/cosmos.png',
        active: true,
        type: ChainType.Chain,
        base: ChainBase.CosmosSDK,
        has_chain_events_listener: true,
        chain_node_id: csdkV1LocalNode!.id!,
        bech32_prefix: 'cosmos',
      },
      {
        id: 'evmos-dev-local',
        network: ChainNetwork.Evmos,
        default_symbol: 'STAKE',
        name: 'CI: Ethermint devnet',
        icon_url: '/static/img/protocols/cosmos.png',
        active: true,
        type: ChainType.Chain,
        base: ChainBase.CosmosSDK,
        has_chain_events_listener: true,
        chain_node_id: ethermintLocalNode!.id!,
        bech32_prefix: 'cosmos',
      },
    ]);

    const [alexContract, yearnContract, sushiContract] =
      await models.Contract.bulkCreate([
        {
          address: '0xFab46E002BbF0b4509813474841E0716E6730136',
          token_name: 'Alex',
          symbol: 'ALEX',
          type: ChainNetwork.ERC20,
          chain_node_id: testnetNode!.id!,
        },
        {
          address: '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
          token_name: 'yearn',
          symbol: 'YFI',
          type: ChainNetwork.ERC20,
          chain_node_id: mainnetNode!.id!,
        },
        {
          address: '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2',
          token_name: 'sushi',
          symbol: 'SUSHI',
          type: ChainNetwork.ERC20,
          chain_node_id: mainnetNode!.id!,
        },
      ]);

    await models.CommunityContract.bulkCreate([
      {
        community_id: alex.toJSON().id!,
        contract_id: alexContract.toJSON().id!,
      },
      {
        community_id: yearn.toJSON().id!,
        contract_id: yearnContract.toJSON().id!,
      },
      {
        community_id: sushi.toJSON().id!,
        contract_id: sushiContract.toJSON().id!,
      },
    ]);

    await seed('Community', {
      id: 'common-protocol',
      network: ChainNetwork.ERC20,
      default_symbol: 'cmn',
      name: 'Common Protocol',
      icon_url: '/static/img/protocols/eth.png',
      active: true,
      description: '',
      type: ChainType.DAO,
      base: ChainBase.Ethereum,
      has_chain_events_listener: false,
      chain_node_id: 1263,
      namespace: 'IanSpace',
      Addresses: [
        {
          address: '0xtestAddress',
          user_id: testAdmin!.id,
          verification_token: 'PLACEHOLDER',
          verification_token_expires: undefined,
          verified: new Date(),
          keytype: 'sr25519',
          role: 'admin',
          is_user_default: false,
          profile_id: undefined,
        },
      ],
      CommunityStakes: [],
      groups: [],
    });

    await seed('Community', {
      id: 'ethereum',
      network: ChainNetwork.Ethereum,
      default_symbol: 'ETH',
      name: 'Ethereum',
      icon_url: '/static/img/protocols/eth.png',
      active: true,
      type: ChainType.Chain,
      base: ChainBase.Ethereum,
      has_chain_events_listener: false,
      chain_node_id: mainnetNode!.id!,
      CommunityStakes: [
        {
          stake_id: 1,
          stake_token: '',
          vote_weight: 1,
          stake_enabled: true,
        },
      ],
      Addresses: [
        {
          user_id: drew!.id,
          address: '0x34C3A5ea06a3A67229fb21a7043243B0eB3e853f',
          verification_token: 'PLACEHOLDER',
          verification_token_expires: undefined,
          verified: new Date(),
          role: 'admin',
          is_user_default: false,
          profile_id: undefined,
        },
        {
          // be careful modifying me, can break namespace
          address: '0x42D6716549A78c05FD8EF1f999D52751Bbf9F46a',
          user_id: testAdmin!.id,
          verification_token: 'PLACEHOLDER',
          verification_token_expires: undefined,
          verified: new Date(),
          keytype: 'sr25519',
          role: 'admin',
          is_user_default: false,
          profile_id: undefined,
        },
      ],
      topics: [
        {},
        {
          name: 'Test Topic',
          description: 'A topic made for testing',
        },
      ],
    });

    await seed('Community', {
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
      chain_node_id: edgewareNode!.id!,
      Addresses: [
        {
          address: '5DJA5ZCobDS3GVn8D2E5YRiotDqGkR2FN1bg6LtfNUmuadwX',
          verification_token: 'PLACEHOLDER',
          verification_token_expires: undefined,
          verified: new Date(),
          keytype: 'sr25519',
          role: 'admin',
          is_user_default: false,
          profile_id: undefined,
          user_id: undefined,
        },
        {
          address: 'ik52qFh92pboSctWPSFKtQwGEpypzz2m6D5ZRP8AYxqjHpM',
          verification_token: 'PLACEHOLDER',
          verification_token_expires: undefined,
          verified: new Date(),
          keytype: 'sr25519',
          role: 'admin',
          is_user_default: false,
          profile_id: undefined,
          user_id: undefined,
        },
        {
          address: 'js4NB7G3bqEsSYq4ruj9Lq24QHcoKaqauw6YDPD7hMr1Roj',
          verification_token: 'PLACEHOLDER',
          verification_token_expires: undefined,
          verified: new Date(),
          keytype: 'sr25519',
          role: 'admin',
          is_user_default: false,
          profile_id: undefined,
          user_id: undefined,
        },
      ],
      CommunityStakes: [],
    });

    await models.NotificationCategory.bulkCreate([
      {
        name: NotificationCategories.NewThread,
        description: 'someone makes a new thread',
      },
      {
        name: NotificationCategories.NewComment,
        description: 'someone makes a new comment',
      },
      {
        name: NotificationCategories.NewMention,
        description: 'someone @ mentions a user',
      },
      {
        name: NotificationCategories.NewCollaboration,
        description: 'someone collaborates with a user',
      },
      {
        name: NotificationCategories.ChainEvent,
        description: 'a chain event occurs',
      },
      {
        name: NotificationCategories.NewReaction,
        description: 'someone reacts to a post',
      },
      {
        name: NotificationCategories.ThreadEdit,
        description: 'someone edited a thread',
      },
      {
        name: NotificationCategories.CommentEdit,
        description: 'someone edited a comment',
      },
      {
        name: NotificationCategories.SnapshotProposal,
        description: 'Snapshot proposal notifications',
      },
    ]);

    // Admins need to be subscribed to mentions and collaborations
    await seed('Subscription', {
      subscriber_id: drew!.id,
      category_id: NotificationCategories.NewMention,
      is_active: true,
      community_id: undefined,
      thread_id: undefined,
      comment_id: undefined,
    });
    await seed('Subscription', {
      subscriber_id: drew!.id,
      category_id: NotificationCategories.NewCollaboration,
      is_active: true,
      community_id: undefined,
      thread_id: undefined,
      comment_id: undefined,
    });

    await seed('SnapshotSpace', {
      snapshot_space: 'test space',
    });

    await seed('SnapshotProposal', {
      id: '1',
      title: 'Test Snapshot Proposal',
      body: 'This is a test proposal',
      choices: ['Yes', 'No'],
      space: 'test space',
      event: 'proposal/created',
      start: new Date().toString(),
      expire: new Date(
        new Date().getTime() + 100 * 24 * 60 * 60 * 1000,
      ).toString(),
    });

    if (debug) log.info('Database reset!');

    return testAdmin as User;
  } catch (error) {
    log.error(
      'Error seeding test db',
      error instanceof Error ? error : undefined,
    );
    throw error;
  }
};
