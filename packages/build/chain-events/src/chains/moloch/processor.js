"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Processor = void 0;
/**
 * Processes Moloch events.
 */
const interfaces_1 = require("../../interfaces");
const logging_1 = require("../../logging");
const type_parser_1 = require("./filters/type_parser");
const enricher_1 = require("./filters/enricher");
class Processor extends interfaces_1.IEventProcessor {
    chain;
    _version;
    constructor(api, contractVersion, chain) {
        super(api);
        this.chain = chain;
        this._version = contractVersion;
    }
    /**
     * Parse events out of an edgeware block and standardizes their format
     * for processing.
     * @param event
     * @returns an array of processed events
     */
    async process(event) {
        const log = logging_1.factory.getLogger(logging_1.addPrefix(__filename, [interfaces_1.SupportedNetwork.Moloch, this.chain]));
        const kind = type_parser_1.ParseType(this._version, event.event, this.chain);
        if (!kind)
            return [];
        try {
            const cwEvent = await enricher_1.Enrich(this._version, this._api, event.blockNumber, kind, event);
            return [cwEvent];
        }
        catch (e) {
            log.error(`Failed to enrich event. Block number: ${event.blockNumber}, Name/Kind: ${event.event}, Error Message: ${e.message}`);
            return [];
        }
    }
}
exports.Processor = Processor;
