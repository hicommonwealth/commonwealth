import fs from 'fs';
import { IEventHandler, CWEvent } from '@commonwealth/chain-events';

import { generateHandlers } from './setupChainEventListeners';
import { default as models, sequelize } from '../database';
import { factory, formatFilename } from 'common-common/src/logging';
const log = factory.getLogger(formatFilename(__filename));

const handleEventFn = async (handlers: IEventHandler[], event: CWEvent<any>): Promise<void> => {
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
    const chainInstance = await models.Chain.findOne({
      where: { id: chain, active: true },
      include: [{
        model: models.ChainNode,
        required: true,
      }],
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
