import { CWEvent, IEventHandler } from "../../../src";
import { factory, formatFilename } from "../../../src/logging";
import { Logger } from "typescript-logging";

const log = factory.getLogger(formatFilename(__filename));

export type Ithis = {
  allChainEventHandlers: IEventHandler[],
  log: Logger
}

/**
 * This function ingests chain-events from the RabbitMQ {@link RascalSubscriptions.ChainEvents} subscription and
 * processes each of them using the given handlers. Event handlers mainly update the database and republish messages
 * to other queues.
 * @param event {CWEvent} The chain-event to pass to all the handlers
 */
export async function processChainEvents(this: Ithis, event: CWEvent) {
  let prevResult = null;
  for (const handler of this.allChainEventHandlers) {
    try {
      prevResult = await handler.handle(event, prevResult);
    } catch (err) {
      this.log.error(
        `${handler.name} handler failed to process the following event: ${JSON.stringify(
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
