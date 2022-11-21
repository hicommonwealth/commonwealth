import { Logger } from 'typescript-logging';

import { CWEvent, IEventHandler } from '../../../src';

export type Ithis = {
  allChainEventHandlers: IEventHandler[];
  log: Logger;
};

/**
 * This function ingests chain-events from the RabbitMQ {@link RascalSubscriptions.ChainEvents} subscription and
 * processes each of them using the given handlers. Event handlers mainly update the database and republish messages
 * to other queues.
 * @param event {CWEvent} The chain-event to pass to all the handlers
 */
export async function processChainEvents(
  this: Ithis,
  event: CWEvent
): Promise<void> {
  let prevResult = null;
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
