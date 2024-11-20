import {
  BalanceType,
  ChainBase,
  ChainNetwork,
  ChainType,
  CosmosGovernanceVersion,
  Role,
  ZERO_ADDRESS,
} from '@hicommonwealth/shared';
import { bootstrap_testing } from './bootstrap';

/**
 * Legacy test seeder
 *
 * @deprecated Use `seed` from `libs/model/src/tester/seed.ts` instead
 *
 * Seeding entities in bulk obscures many specific details required for each test,
 * such as associated IDs and seed values. Additionally, not all tests require every
 * entity to be seeded, so focus should be on seeding only what is explicitly needed.
 */
export const seedDb = async (meta: ImportMeta) => {
  try {
    const models = await bootstrap_testing(meta);

    await models.User.bulkCreate(
      [{ email: 'drewstone329@gmail.com' }, { email: 'temp@gmail.com' }].map(
        (x) => ({
          ...x,
          emailVerified: true,
          isAdmin: true,
          is_welcome_onboard_flow_complete: true,
          disableRichText: false,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          emailNotificationInterval: 'never' as any,
          profile: {},
        }),
      ),
    );

    const [
      edgewareNode,
      mainnetNode,
      testnetNode,
      osmosisNode,
      csdkBetaNode,
      csdkV1Node,
      csdkBetaLocalNode,
      csdkV1LocalNode,
      ethermintLocalNode,
    ] = await models.ChainNode.bulkCreate(
      Object.values({
        edgeware: {
          url: 'mainnet1.edgewa.re',
          name: 'Edgeware Mainnet',
          balance_type: BalanceType.Substrate,
        },
        ethereum: {
          url: 'https://eth-mainnet.alchemyapi.io/v2/dummy_key',
          private_url: 'https://eth-mainnet.alchemyapi.io/v2/dummy_key',
          name: 'Ethereum Mainnet',
          eth_chain_id: 1,
          balance_type: BalanceType.Ethereum,
        },
        sepolia: {
          id: 1263,
          url: 'https://ethereum-sepolia.publicnode.com',
          private_url: 'https://ethereum-sepolia.publicnode.com',
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
          slip44: 118,
        },
        csdkBeta: {
          url: 'https://cosmos-devnet-beta.herokuapp.com/rpc',
          name: 'Cosmos SDK v0.45.0 devnet',
          balance_type: BalanceType.Cosmos,
          alt_wallet_url: 'https://cosmos-devnet-beta.herokuapp.com/lcd/',
          cosmos_chain_id: 'csdkbetaci',
          bech32: 'cosmos',
          slip44: 118,
        },
        csdkV1: {
          url: 'https://cosmos-devnet.herokuapp.com/rpc',
          name: 'Cosmos SDK v0.46.11 devnet',
          balance_type: BalanceType.Cosmos,
          alt_wallet_url: 'https://cosmos-devnet.herokuapp.com/lcd/',
          cosmos_chain_id: 'csdkv1',
          bech32: 'cosmos',
          cosmos_gov_version: CosmosGovernanceVersion.v1,
          slip44: 118,
        },
        csdkBetaLocal: {
          url: 'http://localhost:5050/rpc',
          name: 'CI: Cosmos SDK v0.45.0 devnet',
          balance_type: BalanceType.Cosmos,
          alt_wallet_url: 'http://localhost:5050/lcd/',
          cosmos_chain_id: 'csdkbetalocal',
          bech32: 'cosmos',
          cosmos_gov_version: CosmosGovernanceVersion.v1beta1,
          slip44: 118,
        },
        csdkV1CLocal: {
          url: 'http://localhost:5051/rpc',
          name: 'CI: Cosmos SDK v0.46.11 devnet',
          balance_type: BalanceType.Cosmos,
          alt_wallet_url: 'http://localhost:5051/lcd/',
          cosmos_chain_id: 'csdkv1local',
          bech32: 'cosmos',
          cosmos_gov_version: CosmosGovernanceVersion.v1,
          slip44: 118,
        },
        ethermintLocal: {
          url: 'http://localhost:5052/rpc',
          name: 'CI: Ethermint devnet',
          balance_type: BalanceType.Cosmos,
          alt_wallet_url: 'http://localhost:5052/lcd/',
          cosmos_chain_id: 'evmosdevlocal',
          bech32: 'cosmos',
          slip44: 60,
        },
      }),
    );

    await models.Community.bulkCreate(
      [
        {
          id: 'alex',
          network: ChainNetwork.ERC20,
          default_symbol: 'ALEX',
          name: 'Alex',
          icon_url: 'assets/img/protocols/eth.png',
          active: true,
          type: ChainType.Token,
          base: ChainBase.Ethereum,
          chain_node_id: testnetNode.id!,
        },
        {
          id: 'yearn',
          network: ChainNetwork.ERC20,
          default_symbol: 'YFI',
          name: 'yearn.finance',
          icon_url: 'assets/img/protocols/eth.png',
          active: true,
          type: ChainType.Token,
          base: ChainBase.Ethereum,
          chain_node_id: mainnetNode.id!,
        },
        {
          id: 'sushi',
          network: ChainNetwork.ERC20,
          default_symbol: 'SUSHI',
          name: 'Sushi',
          icon_url: 'assets/img/protocols/eth.png',
          active: true,
          description: 'sushi community description',
          type: ChainType.Token,
          base: ChainBase.Ethereum,
          chain_node_id: mainnetNode.id!,
        },
        {
          id: 'edgeware',
          network: ChainNetwork.Edgeware,
          default_symbol: 'EDG',
          name: 'Edgeware',
          icon_url: 'assets/img/protocols/edg.png',
          active: true,
          type: ChainType.Chain,
          base: ChainBase.Substrate,
          ss58_prefix: 7,
          chain_node_id: edgewareNode.id!,
        },
        {
          id: 'ethereum',
          profile_count: 2,
          network: ChainNetwork.Ethereum,
          default_symbol: 'ETH',
          name: 'Ethereum',
          icon_url: 'assets/img/protocols/eth.png',
          active: true,
          type: ChainType.Chain,
          base: ChainBase.Ethereum,
          chain_node_id: mainnetNode.id!,
        },
        {
          id: 'osmosis',
          network: ChainNetwork.Osmosis,
          default_symbol: 'OSMO',
          name: 'Osmosis',
          icon_url: 'assets/img/protocols/cosmos.png',
          active: true,
          type: ChainType.Chain,
          base: ChainBase.CosmosSDK,
          chain_node_id: osmosisNode.id!,
          bech32_prefix: 'osmo',
        },
        {
          id: 'csdk-beta',
          network: ChainNetwork.Osmosis,
          default_symbol: 'STAKE',
          name: 'Cosmos SDK v0.45.0 devnet',
          icon_url: 'assets/img/protocols/cosmos.png',
          active: true,
          type: ChainType.Chain,
          base: ChainBase.CosmosSDK,
          chain_node_id: csdkBetaNode.id!,
          bech32_prefix: 'cosmos',
        },
        {
          id: 'csdk',
          network: ChainNetwork.Osmosis,
          default_symbol: 'STAKE',
          name: 'Cosmos SDK v0.46.11 devnet',
          icon_url: 'assets/img/protocols/cosmos.png',
          active: true,
          type: ChainType.Chain,
          base: ChainBase.CosmosSDK,
          chain_node_id: csdkV1Node.id!,
          bech32_prefix: 'cosmos',
        },
        {
          id: 'common-protocol',
          network: ChainNetwork.ERC20,
          default_symbol: 'cmn',
          name: 'Common Protocol',
          icon_url: 'assets/img/protocols/eth.png',
          active: true,
          description: '',
          type: ChainType.DAO,
          base: ChainBase.Ethereum,
          chain_node_id: 1263,
          namespace: 'IanSpace',
          namespace_address: ZERO_ADDRESS,
        },
        {
          id: 'csdk-beta-local',
          network: ChainNetwork.Osmosis,
          default_symbol: 'STAKE',
          name: 'CI: Cosmos SDK v0.45 devnet',
          icon_url: 'assets/img/protocols/cosmos.png',
          active: true,
          type: ChainType.Chain,
          base: ChainBase.CosmosSDK,
          chain_node_id: csdkBetaLocalNode.id!,
          bech32_prefix: 'cosmos',
        },
        {
          id: 'csdk-v1-local',
          network: ChainNetwork.Osmosis,
          default_symbol: 'STAKE',
          name: 'CI: Cosmos SDK v0.46.11 devnet',
          icon_url: 'assets/img/protocols/cosmos.png',
          active: true,
          type: ChainType.Chain,
          base: ChainBase.CosmosSDK,
          chain_node_id: csdkV1LocalNode.id!,
          bech32_prefix: 'cosmos',
        },
        {
          id: 'evmos-dev-local',
          network: ChainNetwork.Evmos,
          default_symbol: 'STAKE',
          name: 'CI: Ethermint devnet',
          icon_url: 'assets/img/protocols/cosmos.png',
          active: true,
          type: ChainType.Chain,
          base: ChainBase.CosmosSDK,
          chain_node_id: ethermintLocalNode.id!,
          bech32_prefix: 'cosmos',
        },
      ].map((x) => ({
        ...x,
        social_links: [],
        custom_stages: [],
        snapshot_spaces: [],
        stages_enabled: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        has_homepage: 'false' as any,
        collapsed_on_homepage: false,
        directory_page_enabled: false,
      })),
    );

    await models.Topic.bulkCreate(
      [
        {
          community_id: 'sushi',
          name: 'General',
        },
        {
          community_id: 'edgeware',
          name: 'General',
        },
        {
          community_id: 'ethereum',
          name: 'General',
        },
        {
          community_id: 'alex',
          name: 'General',
        },
        {
          community_id: 'osmosis',
          name: 'General',
        },
        {
          community_id: 'csdk-beta',
          name: 'General',
        },
        {
          community_id: 'csdk',
          name: 'General',
        },
        {
          community_id: 'yearn',
          name: 'General',
        },
        {
          community_id: 'csdk-beta-local',
          name: 'General',
        },
        {
          community_id: 'csdk-v1-local',
          name: 'General',
        },
        {
          community_id: 'evmos-dev-local',
          name: 'General',
        },
        {
          name: 'Test Topic',
          description: 'A topic made for testing',
          community_id: 'ethereum',
        },
      ].map((t) => ({
        description: '',
        ...t,
        featured_in_sidebar: false,
        featured_in_new_post: false,
        group_ids: [],
      })),
    );

    await models.CommunityStake.create({
      // id: 1, –– ID doesn't exist on the DB table?
      community_id: 'ethereum',
      stake_id: 1,
      stake_token: '',
      vote_weight: 1,
      stake_enabled: true,
    });

    // Admin roles for specific communities
    await models.Address.bulkCreate(
      [
        {
          user_id: 1,
          address: '0x34C3A5ea06a3A67229fb21a7043243B0eB3e853f',
          community_id: 'ethereum',
        },
        {
          address: '5DJA5ZCobDS3GVn8D2E5YRiotDqGkR2FN1bg6LtfNUmuadwX',
          community_id: 'edgeware',
        },
        {
          address: 'ik52qFh92pboSctWPSFKtQwGEpypzz2m6D5ZRP8AYxqjHpM',
          community_id: 'edgeware',
        },
        {
          address: 'js4NB7G3bqEsSYq4ruj9Lq24QHcoKaqauw6YDPD7hMr1Roj',
          community_id: 'edgeware',
        },
        {
          // be careful modifying me, can break namespace
          address: '0x42D6716549A78c05FD8EF1f999D52751Bbf9F46a',
          user_id: 2,
          community_id: 'ethereum',
        },
        {
          address: '0xtestAddress',
          user_id: 2,
          community_id: 'common-protocol',
        },
      ].map((x) => ({
        ...x,
        verification_token: 'PLACEHOLDER',
        verification_token_expires: undefined,
        verified: new Date(),
        role: 'admin' as Role,
        is_user_default: false,
        ghost_address: false,
        is_banned: false,
      })),
    );

    return models;
  } catch (error) {
    console.error('seedDB', error);
    throw error;
  }
};
