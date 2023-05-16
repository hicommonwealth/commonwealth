import type { Logger } from 'typescript-logging';
import { StatsDController } from 'common-common/src/statsd';

import type { CWEvent, IEventHandler } from '../../../src';

export type Ithis = {
  allChainEventHandlers: IEventHandler[];
  log: Logger;
};

/**
 * This function ingests chain-events from the RabbitMQ subscription and
 * processes each of them using the given handlers. Event handlers mainly update the database and republish messages
 * to other queues.
 * @param event {CWEvent} The chain-event to pass to all the handlers
 */
export async function processChainEvents(
  this: Ithis,
  event: CWEvent
): Promise<void> {
  let prevResult = null;
  StatsDController.get().increment('ce.event', {
    chain: event.chain || '',
    network: event.network,
    blockNumber: `${event.blockNumber}`,
    kind: event.data.kind,
  });
  for (const handler of this.allChainEventHandlers) {
    try {
      prevResult = await handler.handle(event, prevResult);
    } catch (err) {
      this.log.error(
        `${
          handler.name
        } handler failed to process the following event: ${JSON.stringify(
          event,
          null,
          2
        )}`,
        err
      );
      break;
    }
  }
}
