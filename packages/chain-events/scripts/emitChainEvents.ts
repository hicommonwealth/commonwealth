import * as fs from 'fs';
import type { IEventHandler, CWEvent } from 'chain-events/src';

import ceModels, { sequelize } from '../services/database/database';
import cwModels from '../../commonwealth/server/database';
import { factory, formatFilename } from 'common-common/src/logging';
import type { ChainInstance } from 'commonwealth/server/models/chain';
import type { StorageFilterConfig } from '../services/ChainEventsConsumer/ChainEventHandlers';
import {
  EntityArchivalHandler,
  NotificationHandler,
  StorageHandler,
} from '../services/ChainEventsConsumer/ChainEventHandlers';
import type { BrokerConfig } from 'rascal';
import {
  MockRabbitMQController,
  getRabbitMQConfig,
} from 'common-common/src/rabbitmq';

const log = factory.getLogger(formatFilename(__filename));
const rmqController = new MockRabbitMQController(
  <BrokerConfig>getRabbitMQConfig('localhost')
);

const handleEventFn = async (
  handlers: IEventHandler[],
  event: CWEvent<any>
): Promise<void> => {
  let prevResult = null;
  for (const handler of handlers) {
    try {
      // pass result of last handler into next one (chaining db events)
      prevResult = await handler.handle(event, prevResult);
    } catch (err) {
      log.error(`Event handle failure: ${err.message}`);
      break;
    }
  }
};

export const generateHandlers = (
  chain: ChainInstance,
  storageConfig: StorageFilterConfig = {}
): IEventHandler[] => {
  // writes events into the db as ChainEvents rows
  const storageHandler = new StorageHandler(
    ceModels,
    rmqController,
    chain.id,
    storageConfig
  );

  // emits notifications by writing into the db's Notifications table, and also optionally
  // sending a notification to the client via websocket
  const notificationHandler = new NotificationHandler(ceModels, rmqController);

  // creates and updates ChainEntity rows corresponding with entity-related events
  const entityArchivalHandler = new EntityArchivalHandler(
    ceModels,
    rmqController,
    chain.id
  );

  // the set of handlers, run sequentially on all incoming chain events
  const handlers: IEventHandler[] = [
    storageHandler,
    notificationHandler,
    entityArchivalHandler,
  ];

  return handlers;
};

async function main(chain: string, eventsPath: string) {
  // load event from file
  let events: CWEvent<any>[];
  try {
    const fileData = fs.readFileSync(eventsPath).toString();
    const eventData = JSON.parse(fileData);
    if (Array.isArray(eventData)) {
      events = eventData;
    } else if (typeof events === 'object') {
      events = [eventData];
    } else {
      throw new Error(`Invalid json format: ${typeof events}`);
    }
  } catch (err) {
    log.error(`Failed to read events file: ${err.message}`);
    process.exit(1);
  }

  // little bit of manual validation for objects
  for (const event of events) {
    if (!event.blockNumber || !event.data?.kind) {
      log.error(`Malformed event: ${JSON.stringify(event, null, 2)}`);
      process.exit(1);
    }
  }

  // load chain and handlers
  let handlers: IEventHandler[];
  try {
    await sequelize.authenticate();
    const chainInstance = await cwModels.Chain.findOne({
      where: { id: chain, active: true },
      include: [
        {
          model: cwModels.ChainNode,
          required: true,
        },
      ],
    });
    if (!chainInstance) {
      throw new Error(`Chain not found: ${chain}`);
    }
    handlers = generateHandlers(chainInstance);
  } catch (err) {
    log.error(`Failed to load event handlers: ${err.message}`);
    process.exit(1);
  }

  // process events
  for (const event of events) {
    try {
      await handleEventFn(handlers, event);
      log.info(`Emitted chain event: ${JSON.stringify(event, null, 2)}`);
    } catch (err) {
      log.error(`Event handling failed for ${JSON.stringify(event, null, 2)}`);
      log.error(`Reason: ${err.message}`);
    }
  }
  process.exit(0);
}

const [chain, eventPath] = process.argv.slice(2);
if (!chain || !eventPath) {
  log.error('Must provide chain and event path arguments.');
  process.exit(1);
}
main(chain, eventPath);
