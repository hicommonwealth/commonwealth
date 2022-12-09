"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingHandler = void 0;
const interfaces_1 = require("../interfaces");
const logging_1 = require("../logging");
class LoggingHandler extends interfaces_1.IEventHandler {
    async handle(event) {
        const log = logging_1.factory.getLogger((0, logging_1.addPrefix)(__filename, [event.network, event.chain]));
        log.info(`Received event: ${JSON.stringify(event, null, 2)}`);
        return null;
    }
}
exports.LoggingHandler = LoggingHandler;
