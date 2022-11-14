"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Processor = void 0;
const interfaces_1 = require("../../interfaces");
const logging_1 = require("../../logging");
const types_1 = require("./types");
const type_parser_1 = require("./filters/type_parser");
const enricher_1 = require("./filters/enricher");
class Processor extends interfaces_1.IEventProcessor {
    _api;
    _enricherConfig;
    chain;
    constructor(_api, _enricherConfig = {}, chain) {
        super(_api);
        this._api = _api;
        this._enricherConfig = _enricherConfig;
        this.chain = chain;
    }
    _lastBlockNumber;
    get lastBlockNumber() {
        return this._lastBlockNumber;
    }
    /**
     * Parse events out of an substrate block and standardizes their format
     * for processing.
     *
     * @param block the block received for processing
     * @returns an array of processed events
     */
    async process(block) {
        const log = logging_1.factory.getLogger(logging_1.addPrefix(__filename, [
            interfaces_1.SupportedNetwork.Substrate,
            this.chain || block.versionName,
        ]));
        // cache block number if needed for disconnection purposes
        const blockNumber = +block.header.number;
        if (!this._lastBlockNumber || blockNumber > this._lastBlockNumber) {
            this._lastBlockNumber = blockNumber;
        }
        const applyFilters = async (data) => {
            const section = types_1.isEvent(data) ? data.section : data.method.section;
            const method = types_1.isEvent(data) ? data.method : data.method.method;
            const kind = type_parser_1.ParseType(block.versionName, block.versionNumber, section, method);
            if (kind !== null) {
                try {
                    const result = await enricher_1.Enrich(this._api, blockNumber, kind, data, this._enricherConfig);
                    return result;
                }
                catch (e) {
                    log.error(`Failed to enrich event. Block number: ${blockNumber}, Chain/Version Name: ${block.versionName}, Version Number: ${block.versionNumber}, Section: ${section}, Method: ${method}, Error Message: ${e.message}`);
                    return null;
                }
            }
            else {
                return null;
            }
        };
        const events = await Promise.all(block.events.map(({ event }) => applyFilters(event)));
        // remove unsuccessful extrinsics, only keep extrinsics that map to ExtrinsicSuccess events
        // cf: https://polkadot.js.org/docs/api/cookbook/blocks#how-do-i-map-extrinsics-to-their-events
        const successfulExtrinsics = block.extrinsics.filter((_extrinsic, index) => {
            const extrinsicEvents = block.events.filter((event) => event.phase &&
                event.phase.isApplyExtrinsic &&
                +event.phase.asApplyExtrinsic === index);
            // if the extrinsic involves any "success" events, then we keep it -- it may involve more than
            // that, though, as the result will list *all* events generated as a result of the extrinsic
            return (extrinsicEvents.findIndex((e) => e.event.method === 'ExtrinsicSuccess') !== -1);
        });
        const processedExtrinsics = await Promise.all(successfulExtrinsics.map((extrinsic) => applyFilters(extrinsic)));
        return [...events, ...processedExtrinsics].filter((e) => !!e); // remove null / unwanted events
    }
}
exports.Processor = Processor;
