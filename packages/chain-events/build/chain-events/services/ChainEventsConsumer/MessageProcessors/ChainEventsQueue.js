"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processChainEvents = void 0;
const statsd_1 = require("../../../../common-common/src/statsd");
/**
 * This function ingests chain-events from the RabbitMQ {@link RascalSubscriptions.ChainEvents} subscription and
 * processes each of them using the given handlers. Event handlers mainly update the database and republish messages
 * to other queues.
 * @param event {CWEvent} The chain-event to pass to all the handlers
 */
async function processChainEvents(event) {
    let prevResult = null;
    statsd_1.StatsDController.get().increment('ce.event', {
        chain: event.chain || '',
        network: event.network,
        blockNumber: `${event.blockNumber}`,
        kind: event.data.kind
    });
    for (const handler of this.allChainEventHandlers) {
        try {
            prevResult = await handler.handle(event, prevResult);
        }
        catch (err) {
            this.log.error(`${handler.name} handler failed to process the following event: ${JSON.stringify(event, null, 2)}`, err);
            break;
        }
    }
}
exports.processChainEvents = processChainEvents;
