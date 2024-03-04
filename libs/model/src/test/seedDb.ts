import {
  BalanceType,
  ChainBase,
  ChainNetwork,
  ChainType,
  NotificationCategories,
  logger,
} from '@hicommonwealth/core';
import { QueryTypes, Sequelize } from 'sequelize';
import type { ChainNodeAttributes } from '../models/chain_node';
import {
  AddressSchema,
  ChainNodeSchema,
  CommunityContractSchema,
  CommunitySchema,
  CommunityStakeSchema,
  ContractSchema,
  NotificationCategorySchema,
  SnapshotProposalSchema,
  SnapshotSpaceSchema,
  SubscriptionSchema,
  TopicSchema,
  UserSchema,
} from './mockTypes';
import { SeedOptions, bulkSeed, seed } from './seed';

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

export const seedDb = async (debug = false): Promise<void> => {
  const log = logger().getLogger(__filename);
  if (debug) log.info('Seeding test db...');
  try {
    await checkDb();

    // connect and seed
    const { models } = await import('..');

    await models.sequelize.sync({ force: true });
    log.info('done syncing.');
    if (debug) log.info('Initializing default models...');

    const seedOptions: SeedOptions = { mock: false };

    const drew = await seed(
      UserSchema,
      {
        email: 'drewstone329@gmail.com',
        emailVerified: true,
        isAdmin: true,
      },
      seedOptions,
    );

    await seed(
      UserSchema,
      {
        email: 'temp@gmail.com',
        emailVerified: true,
        isAdmin: true,
      },
      seedOptions,
    );

    const nodes: Record<string, ChainNodeAttributes> = {
      edgeware: {
        url: 'mainnet1.edgewa.re',
        name: 'Edgeware Mainnet',
        balance_type: BalanceType.Substrate,
      },
      ethereum: {
        url: 'https://eth-mainnet.alchemyapi.io/v2/dummy_key',
        name: 'Ethereum Mainnet',
        eth_chain_id: 1,
        balance_type: BalanceType.Ethereum,
      },
      sepolia: {
        id: 1263,
        url: 'https://ethereum-sepolia.publicnode.com',
        name: 'Sepolia Testnet',
        eth_chain_id: 11155111,
        balance_type: BalanceType.Ethereum,
      },
      osmosis: {
        url: 'https://rpc-osmosis.ecostake.com',
        name: 'Osmosis',
        balance_type: BalanceType.Cosmos,
        cosmos_chain_id: 'osmosis',
        bech32: 'osmo',
      },
      csdkBeta: {
        url: 'https://cosmos-devnet-beta.herokuapp.com/rpc',
        name: 'Cosmos SDK v0.45.0 devnet',
        balance_type: BalanceType.Cosmos,
        alt_wallet_url: 'https://cosmos-devnet-beta.herokuapp.com/lcd/',
        cosmos_chain_id: 'csdkbetaci',
        bech32: 'cosmos',
      },
      csdkV1: {
        url: 'https://cosmos-devnet.herokuapp.com/rpc',
        name: 'Cosmos SDK v0.46.11 devnet',
        balance_type: BalanceType.Cosmos,
        alt_wallet_url: 'https://cosmos-devnet.herokuapp.com/lcd/',
        cosmos_chain_id: 'csdkv1',
        bech32: 'cosmos',
      },
    };

    const [
      edgewareNode,
      mainnetNode,
      testnetNode,
      osmosisNode,
      csdkBetaNode,
      csdkV1Node,
    ] = await bulkSeed(ChainNodeSchema, Object.values(nodes), seedOptions);

    // Initialize different chain + node URLs
    await seed(
      CommunitySchema,
      {
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
        chain_node_id: edgewareNode.toJSON().id,
      },
      seedOptions,
    );
    await seed(
      TopicSchema,
      {
        community_id: 'edgeware',
        name: 'General',
      },
      seedOptions,
    );
    await seed(
      CommunitySchema,
      {
        id: 'ethereum',
        network: ChainNetwork.Ethereum,
        default_symbol: 'ETH',
        name: 'Ethereum',
        icon_url: '/static/img/protocols/eth.png',
        active: true,
        type: ChainType.Chain,
        base: ChainBase.Ethereum,
        has_chain_events_listener: false,
        chain_node_id: mainnetNode.toJSON().id,
      },
      seedOptions,
    );
    await seed(
      TopicSchema,
      {
        community_id: 'ethereum',
        name: 'General',
      },
      seedOptions,
    );
    const alex = await seed(
      CommunitySchema,
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
        chain_node_id: testnetNode.toJSON().id,
      },
      seedOptions,
    );
    await seed(
      TopicSchema,
      {
        community_id: 'alex',
        name: 'General',
      },
      seedOptions,
    );
    await seed(
      CommunitySchema,
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
        chain_node_id: osmosisNode.toJSON().id,
        bech32_prefix: 'osmo',
      },
      seedOptions,
    );
    await seed(
      TopicSchema,
      {
        community_id: 'osmosis',
        name: 'General',
      },
      seedOptions,
    );
    await seed(
      CommunitySchema,
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
        chain_node_id: csdkBetaNode.toJSON().id,
        bech32_prefix: 'cosmos',
      },
      seedOptions,
    );
    await seed(
      TopicSchema,
      {
        community_id: 'csdk-beta',
        name: 'General',
      },
      seedOptions,
    );
    await seed(
      CommunitySchema,
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
        chain_node_id: csdkV1Node.toJSON().id,
        bech32_prefix: 'cosmos',
      },
      seedOptions,
    );
    await seed(
      TopicSchema,
      {
        community_id: 'csdk',
        name: 'General',
      },
      seedOptions,
    );
    const alexContract = await seed(
      ContractSchema,
      {
        address: '0xFab46E002BbF0b4509813474841E0716E6730136',
        token_name: 'Alex',
        symbol: 'ALEX',
        type: ChainNetwork.ERC20,
        chain_node_id: testnetNode.toJSON().id,
      },
      seedOptions,
    );
    await seed(
      CommunityContractSchema,
      {
        community_id: alex.toJSON().id,
        contract_id: alexContract.toJSON().id!,
      },
      seedOptions,
    );
    const yearn = await seed(
      CommunitySchema,
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
        chain_node_id: mainnetNode.toJSON().id,
      },
      seedOptions,
    );
    await seed(
      TopicSchema,
      {
        community_id: 'yearn',
        name: 'General',
      },
      seedOptions,
    );
    const yearnContract = await seed(
      ContractSchema,
      {
        address: '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
        token_name: 'yearn',
        symbol: 'YFI',
        type: ChainNetwork.ERC20,
        chain_node_id: mainnetNode.toJSON().id,
      },
      seedOptions,
    );
    await seed(
      CommunityContractSchema,
      {
        community_id: yearn.toJSON().id,
        contract_id: yearnContract.toJSON().id!,
      },
      seedOptions,
    );
    const sushi = await seed(
      CommunitySchema,
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
        chain_node_id: mainnetNode.toJSON().id,
      },
      seedOptions,
    );
    await seed(
      TopicSchema,
      {
        community_id: 'sushi',
        name: 'General',
      },
      seedOptions,
    );
    const sushiContract = await seed(
      ContractSchema,
      {
        address: '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2',
        token_name: 'sushi',
        symbol: 'SUSHI',
        type: ChainNetwork.ERC20,
        chain_node_id: mainnetNode.toJSON().id,
      },
      seedOptions,
    );
    await seed(
      CommunityContractSchema,
      {
        community_id: sushi.toJSON().id,
        contract_id: sushiContract.toJSON().id!,
      },
      seedOptions,
    );
    await seed(
      CommunitySchema,
      {
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
      },
      seedOptions,
    );
    await seed(
      CommunityStakeSchema,
      {
        // id: 1, –– ID doesn't exist on the DB table?
        community_id: 'ethereum',
        stake_id: 1,
        stake_token: '',
        vote_weight: 1,
        stake_enabled: true,
      },
      seedOptions,
    );

    // Admin roles for specific communities
    await bulkSeed(
      AddressSchema,
      [
        {
          user_id: 1,
          address: '0x34C3A5ea06a3A67229fb21a7043243B0eB3e853f',
          community_id: 'ethereum',
          // selected: true,
          verification_token: 'PLACEHOLDER',
          verification_token_expires: undefined,
          verified: new Date(),
          role: 'admin',
          is_user_default: false,
        },
        {
          address: '5DJA5ZCobDS3GVn8D2E5YRiotDqGkR2FN1bg6LtfNUmuadwX',
          community_id: 'edgeware',
          verification_token: 'PLACEHOLDER',
          verification_token_expires: undefined,
          verified: new Date(),
          keytype: 'sr25519',
          role: 'admin',
          is_user_default: false,
        },
        {
          address: 'ik52qFh92pboSctWPSFKtQwGEpypzz2m6D5ZRP8AYxqjHpM',
          community_id: 'edgeware',
          verification_token: 'PLACEHOLDER',
          verification_token_expires: undefined,
          verified: new Date(),
          keytype: 'sr25519',
          role: 'admin',
          is_user_default: false,
        },
        {
          address: 'js4NB7G3bqEsSYq4ruj9Lq24QHcoKaqauw6YDPD7hMr1Roj',
          community_id: 'edgeware',
          verification_token: 'PLACEHOLDER',
          verification_token_expires: undefined,
          verified: new Date(),
          keytype: 'sr25519',
          role: 'admin',
          is_user_default: false,
        },
        {
          // be careful modifying me, can break namespace
          address: '0x42D6716549A78c05FD8EF1f999D52751Bbf9F46a',
          user_id: 2,
          community_id: 'ethereum',
          verification_token: 'PLACEHOLDER',
          verification_token_expires: undefined,
          verified: new Date(),
          keytype: 'sr25519',
          role: 'admin',
          is_user_default: false,
        },
        {
          address: '0xtestAddress',
          user_id: 2,
          community_id: 'common-protocol',
          verification_token: 'PLACEHOLDER',
          verification_token_expires: undefined,
          verified: new Date(),
          keytype: 'sr25519',
          role: 'admin',
          is_user_default: false,
        },
      ],
      seedOptions,
    );

    await bulkSeed(
      NotificationCategorySchema,
      [
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
      ],
      seedOptions,
    );

    // Admins need to be subscribed to mentions and collaborations
    await seed(
      SubscriptionSchema,
      {
        subscriber_id: drew.toJSON().id,
        category_id: NotificationCategories.NewMention,
        is_active: true,
      },
      seedOptions,
    );
    await seed(
      SubscriptionSchema,
      {
        subscriber_id: drew.toJSON().id,
        category_id: NotificationCategories.NewCollaboration,
        is_active: true,
      },
      seedOptions,
    );
    await seed(
      SnapshotSpaceSchema,
      {
        snapshot_space: 'test space',
      },
      seedOptions,
    );
    await seed(
      SnapshotProposalSchema,
      {
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
      },
      seedOptions,
    );

    await seed(
      TopicSchema,
      {
        name: 'Test Topic',
        description: 'A topic made for testing',
        community_id: 'ethereum',
      },
      seedOptions,
    );

    if (debug) log.info('Database reset!');
  } catch (error) {
    log.error(
      'Error seeding test db',
      error instanceof Error ? error : undefined,
    );
    throw error;
  }
};
