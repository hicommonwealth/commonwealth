"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Processor = void 0;
/**
 * Processes Cosmos events.
 */
const interfaces_1 = require("../../interfaces");
const logging_1 = require("../../logging");
const type_parser_1 = require("./filters/type_parser");
const enricher_1 = require("./filters/enricher");
class Processor extends interfaces_1.IEventProcessor {
    _api;
    chain;
    constructor(_api, chain) {
        super(_api);
        this._api = _api;
        this.chain = chain;
    }
    /**
     * Parse events out of an ethereum block and standardizes their format
     * for processing.
     *
     * @param event
     * @returns an array of processed events
     */
    async process(event) {
        const log = logging_1.factory.getLogger((0, logging_1.addPrefix)(__filename, [interfaces_1.SupportedNetwork.Cosmos, this.chain]));
        const kind = (0, type_parser_1.ParseType)(event.message.typeUrl, this.chain);
        if (!kind)
            return [];
        try {
            const cwEvent = await (0, enricher_1.Enrich)(this._api, event.height, kind, event);
            return [cwEvent];
        }
        catch (e) {
            log.error(`Failed to enrich event. Block number: ${event.height}, Name/Kind: ${event.message.typeUrl}, Error Message: ${e.message}`);
            return [];
        }
    }
}
exports.Processor = Processor;
