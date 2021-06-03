import crypto from 'crypto';
import BN from 'bn.js';
import { EventSupportingChains, SubstrateTypes, MolochTypes, chainSupportedBy } from '@commonwealth/chain-events';

import { NotificationCategories } from '../../shared/types';
import { ADDRESS_TOKEN_EXPIRES_IN } from '../config';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

const nodes = [
  [ 'ws://localhost:9944', 'edgeware-local' ],
  [ 'wss://beresheet1.edgewa.re', 'edgeware-testnet' ],
  [ 'wss://beresheet2.edgewa.re', 'edgeware-testnet' ],
  [ 'wss://beresheet3.edgewa.re', 'edgeware-testnet' ],
  [ 'ws://mainnet1.edgewa.re:9944', 'edgeware' ],
  // [ 'localhost:9944', 'kusama-local' ],
  [ 'wss://kusama-rpc.polkadot.io', 'kusama' ],
  [ 'wss://rpc.polkadot.io', 'polkadot' ],
  // [ 'wss://mainnet.infura.io/ws', 'ethereum' ],
  [ 'wss://kovan.infura.io/ws', 'ethereum-kovan' ],   // ethereum kovan
  [ 'ws://127.0.0.1:7545', 'ethereum-local' ],  // ethereum local
  [ 'wss://kovan.infura.io/ws', 'common-protocol-kovan', '0x129daa4C94694d082266778E63E9DF21B7FC11C2' ],   // CWP using kovan etherum
  [ 'ws://127.0.0.1:7545', 'common-protocol-local', '0x5FbDB2315678afecb367f032d93F642f64180aa3' ],  // CWP using local ethreum
  // [ '18.223.143.102:9944', 'edgeware-testnet' ],
  // [ '157.230.218.41:9944', 'edgeware-testnet' ],
  // [ '157.230.125.18:9944', 'edgeware-testnet' ],
  // [ '206.189.33.216:9944', 'edgeware-testnet' ],
  // [ 'localhost:26657', 'cosmos-local' ],
  // [ 'gaia13k1.commonwealth.im:26657', 'cosmos-testnet' ],
  // [ 'cosmoshub1.commonwealth.im:26657', 'cosmos' ],
  [ 'http://localhost:3030', 'near-local' ],
  [ 'https://rpc.nearprotocol.com', 'near' ],
  [ 'wss://mainnet.infura.io/ws', 'moloch', '0x1fd169A4f5c59ACf79d0Fd5d91D1201EF1Bce9f1'],
  [ 'wss://mainnet.infura.io/ws', 'moloch', '0x1fd169A4f5c59ACf79d0Fd5d91D1201EF1Bce9f1'],
  [ 'wss://rpc.kulupu.corepaper.org/ws', 'kulupu'],
  [ 'wss://rpc.plasmnet.io/ws', 'plasm'],
  [ 'wss://scan-rpc.stafi.io/ws', 'stafi'],
  [ 'wss://cc1.darwinia.network/ws', 'darwinia'],
  [ 'wss://poc3.phala.com/ws', 'phala'],
  [ 'wss://fullnode.centrifuge.io', 'centrifuge'],
  // [ 'wss://mainnet.infura.io/ws', 'metacartel', '0x0372f3696fa7dc99801f435fd6737e57818239f2'],
  // [ 'wss://mainnet.infura.io/ws', 'moloch', '0x0372f3696fa7dc99801f435fd6737e57818239f2'],
  // [ 'ws://127.0.0.1:9545', 'moloch-local', '0x9561C133DD8580860B6b7E504bC5Aa500f0f06a7'],
  [ 'wss://mainnet.infura.io/ws', 'marlin', '0xEa2923b099b4B588FdFAD47201d747e3b9599A5f'],
  [ 'ws://127.0.0.1:9545', 'marlin-local', '0xe0D6a92B91B83D5c8A95557f1c966cAFd97f7171'], // TODO: Can't seem to keep this consistent which each local deploy
  [ 'ws://api.clover.finance', 'clover'],
  [ 'wss://rpc-01.snakenet.hydradx.io', 'hydradx'],
  [ 'wss://ropsten.infura.io/ws', 'alex-ropsten', '0xFab46E002BbF0b4509813474841E0716E6730136']
];
const resetServer = (models): Promise<number> => {
  log.debug('Resetting database...');
  return new Promise((resolve) => {
    models.sequelize.sync({ force: true }).then(async () => {
      log.debug('Initializing default models...');
      // Users
      const [dillon, raymond, drew] = await Promise.all([
        models.User.create({
          email: 'dillon@commonwealth.im',
          emailVerified: true,
          isAdmin: true,
          lastVisited: '{}',
        }),
        models.User.create({
          email: 'raymond@commonwealth.im',
          emailVerified: true,
          isAdmin: true,
          lastVisited: '{}',
        }),
        models.User.create({
          email: 'drew@commonwealth.im',
          emailVerified: true,
          isAdmin: true,
          lastVisited: '{}',
        }),
      ]);

      // Initialize contract categories for all smart contract supporting chains
      await Promise.all([
        models.ContractCategory.create({
          name: 'Tokens',
          description: 'Token related contracts',
          color: '#4a90e2',
        }),
        models.ContractCategory.create({
          name: 'DAOs',
          description: 'DAO related contracts',
          color: '#9013fe',
        }),
      ]);

      // Initialize different chain + node URLs
      const chains = await Promise.all([
        models.Chain.create({
          id: 'edgeware-local',
          network: 'edgeware',
          symbol: 'EDG',
          name: 'Edgeware (local)',
          icon_url: '/static/img/protocols/edg.png',
          active: true,
          type: 'chain',
          base: 'substrate',
          ss58_prefix: 7,
        }),
        models.Chain.create({
          id: 'edgeware-testnet',
          network: 'edgeware',
          symbol: 'EDG',
          name: 'Edgeware (testnet)',
          icon_url: '/static/img/protocols/edg.png',
          active: true,
          type: 'chain',
          base: 'substrate',
          ss58_prefix: 7,
        }),
        models.Chain.create({
          id: 'edgeware',
          network: 'edgeware',
          symbol: 'EDG',
          name: 'Edgeware',
          icon_url: '/static/img/protocols/edg.png',
          active: true,
          type: 'chain',
          base: 'substrate',
          ss58_prefix: 7,
          collapsed_on_homepage: false,
        }),
        models.Chain.create({
          id: 'kusama-local',
          network: 'kusama',
          symbol: 'KSM',
          name: 'Kusama (local)',
          icon_url: '/static/img/protocols/ksm.png',
          active: true,
          type: 'chain',
          base: 'substrate',
          ss58_prefix: 42,
        }),
        models.Chain.create({
          id: 'kusama',
          network: 'kusama',
          symbol: 'KSM',
          name: 'Kusama',
          icon_url: '/static/img/protocols/ksm.png',
          active: true,
          type: 'chain',
          base: 'substrate',
          ss58_prefix: 2,
          collapsed_on_homepage: false,
        }),
        models.Chain.create({
          id: 'polkadot-local',
          network: 'polkadot',
          symbol: 'DOT',
          name: 'Polkadot (local)',
          icon_url: '/static/img/protocols/dot.png',
          active: true,
          type: 'chain',
          base: 'substrate',
          ss58_prefix: 42,
        }),
        models.Chain.create({
          id: 'polkadot',
          network: 'polkadot',
          symbol: 'DOT',
          name: 'Polkadot',
          icon_url: '/static/img/protocols/dot.png',
          active: true,
          type: 'chain',
          base: 'substrate',
          ss58_prefix: 0,
          collapsed_on_homepage: false,
        }),
        models.Chain.create({
          id: 'kulupu',
          network: 'kulupu',
          symbol: 'KLP',
          name: 'Kulupu',
          icon_url: '/static/img/protocols/klp.png',
          active: true,
          type: 'chain',
          base: 'substrate',
          ss58_prefix: 16,
          collapsed_on_homepage: false,
        }),
        models.Chain.create({
          id: 'plasm',
          network: 'plasm',
          symbol: 'PLM',
          name: 'Plasm',
          icon_url: '/static/img/protocols/plm.png',
          active: true,
          type: 'chain',
          base: 'substrate',
          ss58_prefix: 5,
          collapsed_on_homepage: false,
        }),
        models.Chain.create({
          id: 'stafi',
          network: 'stafi',
          symbol: 'FIS',
          name: 'StaFi',
          icon_url: '/static/img/protocols/fis.png',
          active: true,
          type: 'chain',
          base: 'substrate',
          ss58_prefix: 20,
          collapsed_on_homepage: false,
        }),
        models.Chain.create({
          id: 'darwinia',
          network: 'darwinia',
          symbol: 'RING',
          name: 'Darwinia',
          icon_url: '/static/img/protocols/ring.png',
          active: true,
          type: 'chain',
          base: 'substrate',
          ss58_prefix: 18,
          collapsed_on_homepage: false,
        }),
        models.Chain.create({
          id: 'phala',
          network: 'phala',
          symbol: 'PHA',
          name: 'Phala Network',
          icon_url: '/static/img/protocols/pha.png',
          active: true,
          type: 'chain',
          base: 'substrate',
          ss58_prefix: 30,
          collapsed_on_homepage: false,
        }),
        models.Chain.create({
          id: 'centrifuge',
          network: 'centrifuge',
          symbol: 'RAD',
          name: 'Centrifuge',
          icon_url: '/static/img/protocols/rad.png',
          active: true,
          type: 'chain',
          base: 'substrate',
          ss58_prefix: 36,
          collapsed_on_homepage: false,
        }),
        models.Chain.create({
          id: 'cosmos-local',
          network: 'cosmos',
          symbol: 'stake',
          name: 'Cosmos (local)',
          icon_url: '/static/img/protocols/atom.png',
          active: true,
          type: 'chain',
          base: 'cosmos',
        }),
        models.Chain.create({
          id: 'cosmos-testnet',
          network: 'cosmos',
          symbol: 'muon',
          name: 'Cosmos (Gaia 13006 Testnet)',
          icon_url: '/static/img/protocols/atom.png',
          active: true,
          type: 'chain',
          base: 'cosmos',
        }),
        models.Chain.create({
          id: 'cosmos',
          network: 'cosmos',
          symbol: 'uatom',
          name: 'Cosmos',
          icon_url: '/static/img/protocols/atom.png',
          active: true,
          type: 'chain',
          base: 'cosmos',
          collapsed_on_homepage: false,
        }),
        // models.Chain.create({
        //   id: 'ethereum-ropsten',
        //   network: 'ethereum',
        //   symbol: 'ETH',
        //   name: 'Ethereum Ropsten',
        //   icon_url: '/static/img/protocols/eth.png',
        //   active: false,
        //   type: 'chain',
        //   base: 'ethereum',
        // }),
        models.Chain.create({
          id: 'ethereum-kovan',
          network: 'ethereum',
          symbol: 'ETH',
          name: 'Ethereum (kovan)',
          icon_url: '/static/img/protocols/eth.png',
          active: true,
          type: 'chain',
          base: 'ethereum',
        }),
        models.Chain.create({
          id: 'ethereum-local',
          network: 'ethereum',
          symbol: 'ETH',
          name: 'Ethereum (local)',
          icon_url: '/static/img/protocols/eth.png',
          active: true,
          type: 'chain',
          base: 'ethereum',
        }),
        models.Chain.create({
          id: 'ethereum',
          network: 'ethereum',
          symbol: 'ETH',
          name: 'Ethereum',
          icon_url: '/static/img/protocols/eth.png',
          active: true,
          type: 'chain',
          base: 'ethereum',
          collapsed_on_homepage: false,
        }),
        models.Chain.create({
          id: 'near-local',
          network: 'near',
          symbol: 'NEAR',
          name: 'NEAR Protocol (local)',
          icon_url: '/static/img/protocols/near.png',
          active: true,
          type: 'chain',
          base: 'near',
        }),
        models.Chain.create({
          id: 'near',
          network: 'near',
          symbol: 'NEAR',
          name: 'NEAR Protocol',
          icon_url: '/static/img/protocols/near.png',
          active: true,
          type: 'chain',
          base: 'near',
          collapsed_on_homepage: false,
        }),
        models.Chain.create({
          id: 'moloch',
          network: 'moloch',
          symbol: 'SHARE',
          name: 'Moloch',
          icon_url: '/static/img/protocols/molochdao.png',
          active: true,
          type: 'dao',
          base: 'ethereum',
          collapsed_on_homepage: false,
        }),
        // This is the same exact as Moloch, but I want to show the picture on the front end
        models.Chain.create({
          id: 'metacartel',
          network: 'metacartel',
          symbol: 'SHARE',
          name: 'Metacartel',
          icon_url: '/static/img/protocols/metacartel.png',
          active: true,
          type: 'dao',
          base: 'ethereum',
          collapsed_on_homepage: false,
        }),
        models.Chain.create({
          id: 'moloch-local',
          network: 'moloch',
          symbol: 'SHARE',
          name: 'Moloch (local)',
          icon_url: '/static/img/protocols/molochdao.png',
          active: true,
          type: 'dao',
          base: 'ethereum',
        }),
        models.Chain.create({
          id: 'marlin',
          network: 'marlin',
          symbol: 'LIN',
          name: 'Marlin',
          icon_url: '/static/img/protocols/eth.png',
          active: true,
          type: 'dao',
          collapsed_on_homepage: false,
        }),
        models.Chain.create({
          id: 'marlin-local',
          network: 'marlin',
          symbol: 'LIN',
          name: 'Marlin (local)',
          icon_url: '/static/img/protocols/eth.png',
          active: true,
          type: 'dao',
        }),
        models.Chain.create({
          id: 'clover',
          network: 'clover',
          symbol: 'CLOV',
          name: 'Clover',
          icon_url: '/static/img/protocols/clover.png',
          active: true,
          type: 'chain',
          collapsed_on_homepage: false,
        }),
        models.Chain.create({
          id: 'hydradx',
          network: 'hydradx',
          symbol: 'HDX',
          name: 'HydraDX',
          icon_url: '/static/img/protocols/hydradx.png',
          active: true,
          type: 'chain',
          collapsed_on_homepage: false,
        }),
        models.Chain.create({
          id: 'alex-ropsten',
          network: 'alex',
          symbol: 'ALEX',
          name: 'Alex (ropsten)',
          icon_url: '/static/img/protocols/eth.png',
          active: true,
          type: 'token',
          base: 'ethereum',
        }),
        // for CWP
        models.Chain.create({
          id: 'common-protocol-kovan',
          network: 'CMN-kovan',
          symbol: 'ETH',
          name: 'Common Protocol (kovan)',
          icon_url: '/static/img/protocols/eth.png',
          active: true,
          type: 'chain',
          base: 'ethereum',
        }),
        models.Chain.create({
          id: 'common-protocol-local',
          network: 'CMN-local',
          symbol: 'ETH',
          name: 'Common Protocol (local)',
          icon_url: '/static/img/protocols/eth.png',
          active: false,
          type: 'chain',
          base: 'ethereum',
        }),
      ]);

      // Specific chains
      // Make sure to maintain this list if you make any changes!
      const [
        edgLocal, edgTest, edgMain,
        kusamaLocal, kusamaMain,
        polkadotLocal, polkadotMain,
        kulupuMain,
        atomLocal, atomTestnet, atom,
        // ethRopsten,
        ethLocal, eth,
        nearLocal, nearTestnet,
        moloch, metacartel, molochLocal,
        marlin, marlinLocal,
        alexRopsten,
      ] = chains;

      // Admin roles for specific communities
      await Promise.all([
        models.Address.create({
          user_id: 2,
          address: '0x34C3A5ea06a3A67229fb21a7043243B0eB3e853f',
          chain: 'ethereum',
          selected: true,
          verification_token: crypto.randomBytes(18).toString('hex'),
          verification_token_expires: new Date(+(new Date()) + ADDRESS_TOKEN_EXPIRES_IN * 60 * 1000),
          verified: new Date(),
        }),
        models.Address.create({
          address: '5DJA5ZCobDS3GVn8D2E5YRiotDqGkR2FN1bg6LtfNUmuadwX',
          chain: 'edgeware',
          verification_token: crypto.randomBytes(18).toString('hex'),
          verification_token_expires: new Date(+(new Date()) + ADDRESS_TOKEN_EXPIRES_IN * 60 * 1000),
          verified: true,
          keytype: 'sr25519',
        }),
        models.Address.create({
          address: 'ik52qFh92pboSctWPSFKtQwGEpypzz2m6D5ZRP8AYxqjHpM',
          chain: 'edgeware',
          verification_token: crypto.randomBytes(18).toString('hex'),
          verification_token_expires: new Date(+(new Date()) + ADDRESS_TOKEN_EXPIRES_IN * 60 * 1000),
          verified: true,
          keytype: 'sr25519',
        }),
        models.Address.create({
          address: 'js4NB7G3bqEsSYq4ruj9Lq24QHcoKaqauw6YDPD7hMr1Roj',
          chain: 'edgeware',
          verification_token: crypto.randomBytes(18).toString('hex'),
          verification_token_expires: new Date(+(new Date()) + ADDRESS_TOKEN_EXPIRES_IN * 60 * 1000),
          verified: true,
          keytype: 'sr25519',
        }),
      ]);

      // Notification Categories
      await Promise.all([
        models.NotificationCategory.create({
          name: NotificationCategories.NewCommunity,
          description: 'someone makes a new community'
        }),
        models.NotificationCategory.create({
          name: NotificationCategories.NewThread,
          description: 'someone makes a new thread'
        }),
        models.NotificationCategory.create({
          name: NotificationCategories.NewComment,
          description: 'someone makes a new comment',
        }),
        models.NotificationCategory.create({
          name: NotificationCategories.NewMention,
          description: 'someone @ mentions a user',
        }),
        models.NotificationCategory.create({
          name: NotificationCategories.NewReaction,
          description: 'someone reacts to a post',
        }),
        models.NotificationCategory.create({
          name: NotificationCategories.NewCollaboration,
          description: 'someone reacts to a post',
        }),
        models.NotificationCategory.create({
          name: NotificationCategories.ChainEvent,
          description: 'a chain event occurs',
        }),
      ]);

      // Admins need to be subscribed to mentions and collaborations
      await Promise.all([
        models.Subscription.create({
          subscriber_id: dillon.id,
          category_id: NotificationCategories.NewMention,
          object_id: `user-${dillon.id}`,
          is_active: true,
          immediate_email: true,
        }),
        models.Subscription.create({
          subscriber_id: raymond.id,
          category_id: NotificationCategories.NewMention,
          object_id: `user-${raymond.id}`,
          is_active: true,
          immediate_email: true,
        }),
        models.Subscription.create({
          subscriber_id: drew.id,
          category_id: NotificationCategories.NewMention,
          object_id: `user-${drew.id}`,
          is_active: true,
          immediate_email: true,
        }),
        models.Subscription.create({
          subscriber_id: dillon.id,
          category_id: NotificationCategories.NewCollaboration,
          object_id: `user-${dillon.id}`,
          is_active: true,
          immediate_email: true,
        }),
        models.Subscription.create({
          subscriber_id: raymond.id,
          category_id: NotificationCategories.NewCollaboration,
          object_id: `user-${raymond.id}`,
          is_active: true,
          immediate_email: true,
        }),
        models.Subscription.create({
          subscriber_id: drew.id,
          category_id: NotificationCategories.NewCollaboration,
          object_id: `user-${drew.id}`,
          is_active: true,
          immediate_email: true,
        }),
      ]);

      // Communities
      const communities = await Promise.all([
        models.OffchainCommunity.create({
          id: 'staking',
          name: 'Staking',
          creator_id: 1,
          description: 'All things staking',
          default_chain: 'ethereum',
        }),
        models.OffchainCommunity.create({
          id: 'governance',
          name: 'Governance',
          creator_id: 1,
          description: 'All things governance',
          default_chain: 'ethereum',
        }),
        models.OffchainCommunity.create({
          id: 'meta',
          name: 'Commonwealth Meta',
          creator_id: 1,
          description: 'All things Commonwealth',
          default_chain: 'edgeware',
        })
      ]);

      // Specific communities
      // Make sure to maintain this list if you make any changes!
      const [staking, governance, meta] = communities;

      // OffchainTopics
      await Promise.all(
        chains.map((chain) => models.OffchainTopic.create({
          name: 'General',
          description: 'General discussion about this blockchain\'s chain development and governance',
          chain_id: chain.id,
        }))
          .concat(
            chains.map((chain) => models.OffchainTopic.create({
              name: 'Random',
              description: 'Non-work banter and water cooler conversation',
              chain_id: chain.id,
            }))
          )
          .concat(
            communities.map((community) => models.OffchainTopic.create({
              name: 'General',
              description: 'General discussion',
              community_id: community.id,
            }))
          )
          .concat(
            communities.map((community) => models.OffchainTopic.create({
              name: 'Random',
              description: 'Non-work banter and water cooler conversation',
              community_id: community.id,
            }))
          )
      );

      await Promise.all([
        models.Role.create({
          address_id: 3,
          chain_id: 'edgeware',
          permission: 'admin',
        }),
        models.Role.create({
          address_id: 4,
          chain_id: 'edgeware',
          permission: 'admin',
        }),
        models.Role.create({
          address_id: 3,
          offchain_community_id: 'staking',
          permission: 'admin',
        }),
        models.Role.create({
          address_id: 4,
          offchain_community_id: 'staking',
          permission: 'admin',
        }),
      ]);

      await Promise.all(nodes.map(([ url, chain, address ]) => (models.ChainNode.create({ chain, url, address }))));

      log.debug('Reset database and initialized default models');
      resolve(0);
    }).catch((error) => {
      log.error(error.message);
      log.error('Error syncing db and initializing default models');
      resolve(1);
    });
  });
};

export default resetServer;
