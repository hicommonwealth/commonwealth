import WebSocket from 'ws';
import _ from 'underscore';
import { Op, WhereOptions } from 'sequelize';
import {
  IDisconnectedRange,
  IEventHandler,
  IEventSubscriber,
  SubstrateTypes,
  SubstrateEvents,
  MolochEvents,
  CompoundEvents,
  AaveEvents,
  Erc20Events
} from '@commonwealth/chain-events';

import { ChainAttributes } from '../models/chain';
import EventStorageHandler, {
  StorageFilterConfig,
} from '../eventHandlers/storage';
import EventNotificationHandler from '../eventHandlers/notifications';
import EntityArchivalHandler from '../eventHandlers/entityArchival';
import IdentityHandler from '../eventHandlers/identity';
import UserFlagsHandler from '../eventHandlers/userFlags';
import ProfileCreationHandler from '../eventHandlers/profileCreation';
import { default as models, sequelize } from '../database';
import { ChainBase, ChainNetwork } from '../../shared/types';
import { constructSubstrateUrl } from '../../shared/substrate';
import { factory, formatFilename } from '../../shared/logging';
import { ChainNodeInstance } from '../models/chain_node';
const log = factory.getLogger(formatFilename(__filename));

// emit globally any transfer over 1% of total issuance
// TODO: config this
const BALANCE_TRANSFER_THRESHOLD_PERMILL = 10_000;
const BALANCE_TRANSFER_THRESHOLD: number = 10 ** 22;
/* TODO: both of these are imperfect solutions. The BALANCE_TRANSFER_THRESHOLD_PERMILL used
by the Substrate enricher uses an API call to get the max token amount of the chain its referring to
for every event it processes. This seems like too much overheard for the ERC20 enricher which
could end being processed on through hundreds of chains all with rapid transfers happening. So
I have made it a fixed value here (1000 tokens if they're using the default decimal value) but
the ideal solution would be to have every chain's max token amount stored in the database. */

const discoverReconnectRange = async (
  chain: string
): Promise<IDisconnectedRange> => {
  const lastChainEvent = await models.ChainEvent.findAll({
    limit: 1,
    order: [['block_number', 'DESC']],
    // this $...$ queries the data inside the include (ChainEvents don't have `chain` but ChainEventTypes do)...
    // we might be able to replicate this behavior with where and required: true inside the include
    where: {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      '$ChainEventType.chain$': chain,
    },
    include: [{ model: models.ChainEventType }],
  });
  if (lastChainEvent && lastChainEvent.length > 0 && lastChainEvent[0]) {
    const lastEventBlockNumber = lastChainEvent[0].block_number;
    log.info(`Discovered chain event in db at block ${lastEventBlockNumber}.`);
    return { startBlock: lastEventBlockNumber + 1 };
  } else {
    return { startBlock: null };
  }
};

export const generateHandlers = (
  node: ChainNodeInstance,

  wss?: WebSocket.Server,
  storageConfig: StorageFilterConfig = {}
) => {
  const chain = node.chain;

  // writes events into the db as ChainEvents rows
  const storageHandler = new EventStorageHandler(models, chain, storageConfig);

  // emits notifications by writing into the db's Notifications table, and also optionally
  // sending a notification to the client via websocket
  const excludedNotificationEvents = [SubstrateTypes.EventKind.DemocracyTabled];
  const notificationHandler = new EventNotificationHandler(
    models,
    wss,
    excludedNotificationEvents
  );

  // creates and updates ChainEntity rows corresponding with entity-related events
  const entityArchivalHandler = new EntityArchivalHandler(models, chain, wss);

  // creates empty Address and OffchainProfile models for users who perform certain
  // actions, like voting on proposals or registering an identity
  const profileCreationHandler = new ProfileCreationHandler(models, node.chain);

  // the set of handlers, run sequentially on all incoming chain events
  const handlers: IEventHandler[] = [
    storageHandler,
    notificationHandler,
    entityArchivalHandler,
    profileCreationHandler,
  ];

  // only handle identities and user flags on substrate chains
  if (node.Chain.base === ChainBase.Substrate) {
    // populates identity information in OffchainProfiles when received (Substrate only)
    const identityHandler = new IdentityHandler(models, node.chain);

    // populates is_validator and is_councillor flags on Addresses when validator and
    // councillor sets are updated (Substrate only)
    const userFlagsHandler = new UserFlagsHandler(models, node.chain);

    handlers.push(identityHandler, userFlagsHandler);
  }

  return handlers;
};

const setupChainEventListeners = async (
  wss: WebSocket.Server,
  chains: string[] | 'all' | 'none',
  skipCatchup?: boolean
): Promise<[ChainNodeInstance, IEventSubscriber<any, any>][]> => {
  await sequelize.authenticate();
  log.info('Fetching node urls...');
  if (chains === 'none') {
    log.info('No event listeners configured.');
    return [];
  }
  const whereOptions: WhereOptions<ChainAttributes> =
    chains === 'all'
      ? {
          active: true,
          has_chain_events_listener: true,
        }
      : {
          active: true,
          has_chain_events_listener: true,
          id: { [Op.in]: chains },
        };
  const nodes = await models.ChainNode.findAll({
    include: [
      {
        model: models.Chain,
        where: whereOptions,
        required: true,
      },
    ],
  });
  if (nodes.length === 0) {
    log.info('No event listeners found.');
    return [];
  }

  log.info('Setting up event listeners...');
  const subscribers = await Promise.all(
    nodes.map(
      async (
        node
      ): Promise<[ChainNodeInstance, IEventSubscriber<any, any>]> => {
        let subscriber: IEventSubscriber<any, any>;
        if (node.Chain.base === ChainBase.Substrate) {
          const nodeUrl = constructSubstrateUrl(node.url);
          const api = await SubstrateEvents.createApi(
            nodeUrl,
            node.Chain.substrate_spec
          );
          const excludedEvents = [
            SubstrateTypes.EventKind.Reward,
            SubstrateTypes.EventKind.TreasuryRewardMinting,
            SubstrateTypes.EventKind.TreasuryRewardMintingV2,
            SubstrateTypes.EventKind.HeartbeatReceived,
          ];

          const handlers = generateHandlers(node, wss, { excludedEvents });
          subscriber = await SubstrateEvents.subscribeEvents({
            chain: node.chain,
            handlers,
            skipCatchup,
            discoverReconnectRange: () => discoverReconnectRange(node.chain),
            api,
            enricherConfig: {
              balanceTransferThresholdPermill:
                BALANCE_TRANSFER_THRESHOLD_PERMILL,
            },
          });
        } else if (node.Chain.network === ChainNetwork.Moloch) {
          const contractVersion = 1;
          const api = await MolochEvents.createApi(
            node.url,
            contractVersion,
            node.address
          );
          const handlers = generateHandlers(node, wss);
          subscriber = await MolochEvents.subscribeEvents({
            chain: node.chain,
            handlers,
            skipCatchup,
            discoverReconnectRange: () => discoverReconnectRange(node.chain),
            api,
            contractVersion,
          });
        } else if (node.Chain.network === ChainNetwork.Compound) {
          const api = await CompoundEvents.createApi(node.url, node.address);
          const handlers = generateHandlers(node, wss);
          subscriber = await CompoundEvents.subscribeEvents({
            chain: node.chain,
            handlers,
            skipCatchup,
            discoverReconnectRange: () => discoverReconnectRange(node.chain),
            api,
          });
        } else if (node.Chain.network === ChainNetwork.Aave) {
          const api = await AaveEvents.createApi(node.url, node.address);
          const handlers = generateHandlers(node, wss);
          subscriber = await AaveEvents.subscribeEvents({
            chain: node.chain,
            handlers,
            skipCatchup,
            discoverReconnectRange: () => discoverReconnectRange(node.chain),
            api,
            verbose: true,
          });
        }

    // hook for clean exit
    process.on('SIGTERM', () => {
      if (subscriber) {
        subscriber.unsubscribe();
      }
    });
    return [ node.chain, subscriber ];
  }));

  // Add Erc20 subscribers
  if (chains === 'all' || chains.includes('erc20')) {
    const erc20Nodes = await models.ChainNode.findAll({
      include: [{
        model: models.Chain,
        where: { type: 'token' },
        required: true,
      }],
    });
    const erc20Addresses = erc20Nodes.map((o) => o.address);

    // get ethereum's endpoint URL as most canonical one
    const ethNode = await models.ChainNode.findOne({
      where: {
        chain: 'ethereum'
      }
    });
    const ethUrl = ethNode.url;

    const api = await Erc20Events.createApi(ethUrl, erc20Addresses);
    // we only need notifications for ERC20s
    const storageHandler = new EventStorageHandler(models, 'erc20', {});
    const notificationHandler = new EventNotificationHandler(models, wss);
    const subscriber = await Erc20Events.subscribeEvents({
      chain: 'erc20',
      handlers: [ storageHandler, notificationHandler ],
      skipCatchup,
      api,
      // TODO: discover reconnect range for erc20 will need to provide the specific token's
      //   name at reconnect attempt, so we omit it for now.
      // discoverReconnectRange: async () => discoverReconnectRange(models, 'erc20'),
      enricherConfig: {
        balanceTransferThreshold: BALANCE_TRANSFER_THRESHOLD,
      }
    });
    process.on('SIGTERM', () => {
      if (subscriber) {
        subscriber.unsubscribe();
      }
    });
    subscribers.push([ 'erc20', subscriber ]);
  }

  return _.object<{ [chain: string]: IEventSubscriber<any, any> }>(subscribers);
};

export default setupChainEventListeners;
