import {
  IDisconnectedRange, IEventHandler, EventSupportingChains,
  SubstrateTypes, chainSupportedBy, CWEvent,
} from '@commonwealth/chain-events';

import * as WebSocket from 'ws';
import EventStorageHandler, { StorageFilterConfig } from '../eventHandlers/storage';
import EventNotificationHandler from '../eventHandlers/notifications';
import EntityArchivalHandler from '../eventHandlers/entityArchival';
import IdentityHandler from '../eventHandlers/identity';
import UserFlagsHandler from '../eventHandlers/userFlags';
import ProfileCreationHandler from '../eventHandlers/profileCreation';
import models, { sequelize } from '../database';
import { constructSubstrateUrl } from '../../shared/substrate';
import { factory, formatFilename } from '../../shared/logging';
import { ChainNodeInstance } from '../models/chain_node';

import { Consumer } from '../util/rabbitmq/consumer';

const log = factory.getLogger(formatFilename(__filename));

// emit globally any transfer over 1% of total issuance
// TODO: config this
const BALANCE_TRANSFER_THRESHOLD_PERMILL: number = 10_000;

const discoverReconnectRange = async (_models, chain: string): Promise<IDisconnectedRange> => {
  const lastChainEvent = await _models.ChainEvent.findAll({
    limit: 1,
    order: [ [ 'block_number', 'DESC' ]],
    // this $...$ queries the data inside the include (ChainEvents don't have `chain` but ChainEventTypes do)...
    // we might be able to replicate this behavior with where and required: true inside the include
    where: {
      '$ChainEventType.chain$': chain,
    },
    include: [
      { model: _models.ChainEventType }
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
  _models, wss: WebSocket.Server, chains: string[] | 'all' | 'none', skipCatchup?: boolean
): Promise<{}> => {
  const queryNode = (c: string): Promise<ChainNodeInstance> => _models.ChainNode.findOne({
    where: { chain: c },
    include: [{
      model: _models.Chain,
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
    const storageHandler = new EventStorageHandler(_models, node.chain, storageConfig);

    // emits notifications by writing into the db's Notifications table, and also optionally
    // sending a notification to the client via websocket
    const excludedNotificationEvents = [
      SubstrateTypes.EventKind.DemocracyTabled,
    ];
    const notificationHandler = new EventNotificationHandler(_models, wss, excludedNotificationEvents);

    // creates and updates ChainEntity rows corresponding with entity-related events
    const entityArchivalHandler = new EntityArchivalHandler(_models, node.chain, wss);

    // creates empty Address and OffchainProfile models for users who perform certain
    // actions, like voting on proposals or registering an identity
    const profileCreationHandler = new ProfileCreationHandler(_models, node.chain);

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
      const identityHandler = new IdentityHandler(_models, node.chain);

      // populates is_validator and is_councillor flags on Addresses when validator and
      // councillor sets are updated (Substrate only)
      const userFlagsHandler = new UserFlagsHandler(_models, node.chain);

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

  // feed the events into their respective handlers
  async function processEvents(event: CWEvent): Promise<void> {
    const eventHandlers = handlers[event.chain];
    if (eventHandlers === undefined || eventHandlers === null) {
      log.info(`Processing events from ${event.chain} is not enabled`);
      return;
    }
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

  const consumer = new Consumer();
  await consumer.init();
  await consumer.consumeEvents(processEvents);

  return {};
};

const SKIP_EVENT_CATCHUP = process.env.SKIP_EVENT_CATCHUP === 'true';
const CHAIN_EVENTS = process.env.CHAIN_EVENTS;

// configure chain list from events
let chains: string[] | 'all' | 'none' = 'all';
if (CHAIN_EVENTS === 'none' || CHAIN_EVENTS === 'all') {
  chains = CHAIN_EVENTS;
} else if (CHAIN_EVENTS) {
  chains = CHAIN_EVENTS.split(',');
}

try {
  log.info('Starting listener process');
  setupChainEventListeners(models, null, chains, SKIP_EVENT_CATCHUP);
} catch (e) {
  console.error(`Chain event listener setup failed: ${e.message}`);
}

export default setupChainEventListeners;
