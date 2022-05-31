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
} from '@commonwealth/chain-events';

import { CommunityAttributes } from '../models/community';
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
  const chain = node.community_id;

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
  const profileCreationHandler = new ProfileCreationHandler(models, node.community_id);

  // the set of handlers, run sequentially on all incoming chain events
  const handlers: IEventHandler[] = [
    storageHandler,
    notificationHandler,
    entityArchivalHandler,
    profileCreationHandler,
  ];

  // only handle identities and user flags on substrate chains
  if (node.Community.base === ChainBase.Substrate) {
    // populates identity information in OffchainProfiles when received (Substrate only)
    const identityHandler = new IdentityHandler(models, node.community_id);

    // populates is_validator and is_councillor flags on Addresses when validator and
    // councillor sets are updated (Substrate only)
    const userFlagsHandler = new UserFlagsHandler(models, node.community_id);

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
  const whereOptions: WhereOptions<CommunityAttributes> =
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
        if (node.Community.base === ChainBase.Substrate) {
          const nodeUrl = constructSubstrateUrl(node.url);
          const api = await SubstrateEvents.createApi(
            nodeUrl,
            node.Community.substrate_spec
          );
          const excludedEvents = [
            SubstrateTypes.EventKind.Reward,
            SubstrateTypes.EventKind.TreasuryRewardMinting,
            SubstrateTypes.EventKind.TreasuryRewardMintingV2,
            SubstrateTypes.EventKind.HeartbeatReceived,
          ];

          const handlers = generateHandlers(node, wss, { excludedEvents });
          subscriber = await SubstrateEvents.subscribeEvents({
            chain: node.community_id,
            handlers,
            skipCatchup,
            discoverReconnectRange: () => discoverReconnectRange(node.community_id),
            api,
            enricherConfig: {
              balanceTransferThresholdPermill:
                BALANCE_TRANSFER_THRESHOLD_PERMILL,
            },
          });
        } else if (node.Community.network === ChainNetwork.Moloch) {
          const contractVersion = 1;
          const api = await MolochEvents.createApi(
            node.url,
            contractVersion,
            node.address
          );
          const handlers = generateHandlers(node, wss);
          subscriber = await MolochEvents.subscribeEvents({
            chain: node.community_id,
            handlers,
            skipCatchup,
            discoverReconnectRange: () => discoverReconnectRange(node.community_id),
            api,
            contractVersion,
          });
        } else if (node.Community.network === ChainNetwork.Compound) {
          const api = await CompoundEvents.createApi(node.url, node.address);
          const handlers = generateHandlers(node, wss);
          subscriber = await CompoundEvents.subscribeEvents({
            chain: node.community_id,
            handlers,
            skipCatchup,
            discoverReconnectRange: () => discoverReconnectRange(node.community_id),
            api,
          });
        } else if (node.Community.network === ChainNetwork.Aave) {
          const api = await AaveEvents.createApi(node.url, node.address);
          const handlers = generateHandlers(node, wss);
          subscriber = await AaveEvents.subscribeEvents({
            chain: node.community_id,
            handlers,
            skipCatchup,
            discoverReconnectRange: () => discoverReconnectRange(node.community_id),
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
        return [node, subscriber];
      }
    )
  );
  return subscribers;
};

export default setupChainEventListeners;
