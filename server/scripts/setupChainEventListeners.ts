import WebSocket from 'ws';
import _ from 'underscore';
import {
  IDisconnectedRange, IEventHandler, EventSupportingChains, IEventSubscriber,
  SubstrateTypes, SubstrateEvents, MolochTypes, MolochEvents, chainSupportedBy,
  MarlinTypes, MarlinEvents, CWEvent,
} from '@commonwealth/chain-events';

import EventStorageHandler, { StorageFilterConfig } from '../eventHandlers/storage';
import EventNotificationHandler from '../eventHandlers/notifications';
import EntityArchivalHandler from '../eventHandlers/entityArchival';
import IdentityHandler from '../eventHandlers/identity';
import UserFlagsHandler from '../eventHandlers/userFlags';
import ProfileCreationHandler from '../eventHandlers/profileCreation';
import { sequelize } from '../database';
import { constructSubstrateUrl } from '../../shared/substrate';
import { factory, formatFilename } from '../../shared/logging';
import { ChainNodeInstance } from '../models/chain_node';

import { Consumer } from '../util/rabbitmq/consumer';

const log = factory.getLogger(formatFilename(__filename));

// emit globally any transfer over 1% of total issuance
// TODO: config this
const BALANCE_TRANSFER_THRESHOLD_PERMILL: number = 10_000;

const discoverReconnectRange = async (models, chain: string): Promise<IDisconnectedRange> => {
  const lastChainEvent = await models.ChainEvent.findAll({
    limit: 1,
    order: [ [ 'block_number', 'DESC' ]],
    // this $...$ queries the data inside the include (ChainEvents don't have `chain` but ChainEventTypes do)...
    // we might be able to replicate this behavior with where and required: true inside the include
    where: {
      '$ChainEventType.chain$': chain,
    },
    include: [
      { model: models.ChainEventType }
    ]
  });
  if (lastChainEvent && lastChainEvent.length > 0 && lastChainEvent[0]) {
    const lastEventBlockNumber = lastChainEvent[0].block_number;
    log.info(`Discovered chain event in db at block ${lastEventBlockNumber}.`);
    return { startBlock: lastEventBlockNumber + 1 };
  } else {
    return { startBlock: null };
  }
};

const setupChainEventListeners = async (
  models, wss: WebSocket.Server, chains: string[] | 'all' | 'none', skipCatchup?: boolean
): Promise<{}> => {
  const queryNode = (c: string): Promise<ChainNodeInstance> => models.ChainNode.findOne({
    where: { chain: c },
    include: [{
      model: models.Chain,
      where: { active: true },
      required: true,
    }],
  });
  log.info('Fetching node urls...');
  await sequelize.authenticate();
  const nodes: ChainNodeInstance[] = [];
  if (chains === 'all') {
    const n = (await Promise.all(EventSupportingChains.map((c) => queryNode(c)))).filter((c) => !!c);
    nodes.push(...n);
  } else if (chains !== 'none') {
    const n = (await Promise.all(EventSupportingChains
      .filter((c) => chains.includes(c))
      .map((c) => queryNode(c))))
      .filter((c) => !!c);
    nodes.push(...n);
  } else {
    log.info('No event listeners configured.');
    return {};
  }
  if (nodes.length === 0) {
    log.info('No event listeners found.');
    return {};
  }

  log.info('Setting up event listeners...');
  const generateHandlers = (node: ChainNodeInstance, storageConfig: StorageFilterConfig = {}) => {
    // writes events into the db as ChainEvents rows
    const storageHandler = new EventStorageHandler(models, node.chain, storageConfig);

    // emits notifications by writing into the db's Notifications table, and also optionally
    // sending a notification to the client via websocket
    const excludedNotificationEvents = [
      SubstrateTypes.EventKind.DemocracyTabled,
    ];
    const notificationHandler = new EventNotificationHandler(models, wss, excludedNotificationEvents);

    // creates and updates ChainEntity rows corresponding with entity-related events
    const entityArchivalHandler = new EntityArchivalHandler(models, node.chain, wss);

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
    if (chainSupportedBy(node.chain, SubstrateTypes.EventChains)) {
      // populates identity information in OffchainProfiles when received (Substrate only)
      const identityHandler = new IdentityHandler(models, node.chain);

      // populates is_validator and is_councillor flags on Addresses when validator and
      // councillor sets are updated (Substrate only)
      const userFlagsHandler = new UserFlagsHandler(models, node.chain);

      handlers.push(identityHandler, userFlagsHandler);
    }

    return handlers;
  };

  // Create instances of all the handlers needed to process the events we want from the queue
  const handlers = {};
  nodes.forEach((node) => {
    if (chainSupportedBy(node.chain, SubstrateTypes.EventChains)) {
      const excludedEvents = [
        SubstrateTypes.EventKind.Reward,
        SubstrateTypes.EventKind.TreasuryRewardMinting,
        SubstrateTypes.EventKind.TreasuryRewardMintingV2,
        SubstrateTypes.EventKind.HeartbeatReceived,
      ];
      handlers[node.chain] = generateHandlers(node, { excludedEvents });
    } else {
      handlers[node.chain] = generateHandlers(node);
    }
  });

  // feed the events into the different their respective handlers
  async function processEvents(event: CWEvent): Promise<void> {
    const eventHandlers = handlers[event.chain];
    let prevResult = null;
    for (const handler of eventHandlers) {
      try {
        prevResult = await handler.handle(event, prevResult);
      } catch (err) {
        log.error(`Event handle failure: ${err.message}`);
        break;
      }
    }
  }

  const InitSubscriber = new Consumer();
  await InitSubscriber.init();
  await InitSubscriber.consumeEvents(processEvents);

  return {};
};

export default setupChainEventListeners;
