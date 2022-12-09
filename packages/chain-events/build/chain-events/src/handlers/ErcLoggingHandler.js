"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErcLoggingHandler = void 0;
const interfaces_1 = require("../interfaces");
const logging_1 = require("../logging");
class ErcLoggingHandler extends interfaces_1.IEventHandler {
    network;
    tokenNames;
    logger = {};
    constructor(network, tokenNames) {
        super();
        this.network = network;
        this.tokenNames = tokenNames;
    }
    async handle(event) {
        if (this.tokenNames.includes(event.chain)) {
            // if logger for this specific token doesn't exist, create it - decreases computational cost of logging
            if (!this.logger[event.chain])
                this.logger[event.chain] =
                    logging_1.factory.getLogger((0, logging_1.addPrefix)(__filename, [`Erc${this.network.slice(3)}`, event.chain]));
            this.logger[event.chain].info(`Received event: ${JSON.stringify(event, null, 2)}`);
        }
        return null;
    }
}
exports.ErcLoggingHandler = ErcLoggingHandler;
