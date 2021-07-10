import {
  IDisconnectedRange,
  IEventHandler,
  EventSupportingChains,
  SubstrateTypes,
  chainSupportedBy,
  CWEvent
} from '@commonwealth/chain-events';

import * as WebSocket from 'ws';
import fs from 'fs';
import EventStorageHandler, {
  StorageFilterConfig
} from '../eventHandlers/storage';
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
import config from '../util/rabbitmq/RabbitMQconfig.json';

const log = factory.getLogger(formatFilename(__filename));

// emit globally any transfer over 1% of total issuance
// TODO: config this
const BALANCE_TRANSFER_THRESHOLD_PERMILL: number = 10_000;

const envIden = process.env.HANDLE_Identity;
export const HANDLE_IDENTITY =
  envIden === 'publish' || envIden === 'handle' ? envIden : null;

const discoverReconnectRange = async (
  _models,
  chain: string
): Promise<IDisconnectedRange> => {
  const lastChainEvent = await _models.ChainEvent.findAll({
    limit: 1,
    order: [['block_number', 'DESC']],
    // this $...$ queries the data inside the include (ChainEvents don't have `chain` but ChainEventTypes do)...
    // we might be able to replicate this behavior with where and required: true inside the include
    where: {
      '$ChainEventType.chain$': chain
    },
    include: [{ model: _models.ChainEventType }]
  });
  if (lastChainEvent && lastChainEvent.length > 0 && lastChainEvent[0]) {
    const lastEventBlockNumber = lastChainEvent[0].block_number;
    log.info(`Discovered chain event in db at block ${lastEventBlockNumber}.`);
    return { startBlock: lastEventBlockNumber + 1 };
  } else {
    return { startBlock: null };
  }
};

// returns either the RabbitMQ config specified by the filepath or the default config
export function getRabbitMQConfig(filepath?: string) {
  if (typeof filepath === 'string' && filepath.length === 0) return config;
  else {
    try {
      const raw = fs.readFileSync(filepath);
      return JSON.parse(raw.toString());
    } catch (error) {
      console.error(`Failed to load the configuration file at: ${filepath}`);
      console.warn('Using default RabbitMQ configuration');
      return config;
    }
  }
}

const setupChainEventListeners = async (
  _models,
  wss: WebSocket.Server,
  chains: string[] | 'all' | 'none',
  skipCatchup?: boolean
): Promise<{}> => {
  const queryNode = (c: string): Promise<ChainNodeInstance> =>
    _models.ChainNode.findOne({
      where: { chain: c },
      include: [
        {
          model: _models.Chain,
          where: { active: true },
          required: true
        }
      ]
    });
  log.info('Fetching node urls...');
  await sequelize.authenticate();
  const nodes: ChainNodeInstance[] = [];
  if (chains === 'all') {
    const n = (
      await Promise.all(EventSupportingChains.map((c) => queryNode(c)))
    ).filter((c) => !!c);
    nodes.push(...n);
  } else if (chains !== 'none') {
    const n = (
      await Promise.all(
        EventSupportingChains.filter((c) => chains.includes(c)).map((c) =>
          queryNode(c)
        )
      )
    ).filter((c) => !!c);
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
  const generateHandlers = (
    node: ChainNodeInstance,
    storageConfig: StorageFilterConfig = {}
  ) => {
    // writes events into the db as ChainEvents rows
    const storageHandler = new EventStorageHandler(
      _models,
      node.chain,
      storageConfig
    );

    // emits notifications by writing into the db's Notifications table, and also optionally
    // sending a notification to the client via websocket
    const excludedNotificationEvents = [
      SubstrateTypes.EventKind.DemocracyTabled
    ];
    const notificationHandler = new EventNotificationHandler(
      _models,
      wss,
      excludedNotificationEvents
    );

    // creates and updates ChainEntity rows corresponding with entity-related events
    const entityArchivalHandler = new EntityArchivalHandler(
      _models,
      node.chain,
      wss
    );

    // creates empty Address and OffchainProfile models for users who perform certain
    // actions, like voting on proposals or registering an identity
    const profileCreationHandler = new ProfileCreationHandler(
      _models,
      node.chain
    );

    // the set of handlers, run sequentially on all incoming chain events
    const handlers: IEventHandler[] = [
      storageHandler,
      notificationHandler,
      entityArchivalHandler,
      profileCreationHandler
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
        SubstrateTypes.EventKind.HeartbeatReceived
      ];
      handlers[node.chain] = generateHandlers(node, { excludedEvents });
    } else {
      handlers[node.chain] = generateHandlers(node);
    }
  });

  // feed the events into their respective handlers
  async function processClassicEvents(event: CWEvent): Promise<void> {
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

  const identityHandlers: { [key: string]: IEventHandler } = {};
  async function processIdentityEvents(event: CWEvent): Promise<void> {
    if (!identityHandlers[event.chain])
      identityHandlers[event.chain] = new IdentityHandler(_models, event.chain);

    const handler = identityHandlers[event.chain];
    try {
      await handler.handle(event, null);
    } catch (err) {
      log.error(`Event handle failure: ${err.message}`);
    }
  }

  let rbbtMqConfig =
    HANDLE_IDENTITY === 'publish'
      ? '../src/rabbitmq/WithIdentityQueueConfig.json'
      : null;
  const consumer = new Consumer(getRabbitMQConfig(rbbtMqConfig));
  await consumer.init();

  const eventsSubscriber = await consumer.consumeEvents(
    processClassicEvents,
    'eventsSub'
  );

  if (HANDLE_IDENTITY === 'publish') {
    const identitySubscriber = await consumer.consumeEvents(
      processIdentityEvents,
      'identitySub'
    );
  }

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
