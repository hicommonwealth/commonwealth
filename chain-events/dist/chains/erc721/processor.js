"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Processor = void 0;
/**
 * Processes ERC721 events.
 */
const interfaces_1 = require("../../interfaces");
const logging_1 = require("../../logging");
const type_parser_1 = require("./filters/type_parser");
const enricher_1 = require("./filters/enricher");
class Processor extends interfaces_1.IEventProcessor {
    constructor(_api) {
        super(_api);
        this._api = _api;
    }
    /**
     * Parse events out of an ethereum block and standardizes their format
     * for processing.
     * @param event
     * @param tokenName
     * @returns an array of processed events
     */
    process(event, tokenName) {
        return __awaiter(this, void 0, void 0, function* () {
            const log = logging_1.factory.getLogger(logging_1.addPrefix(__filename, [interfaces_1.SupportedNetwork.ERC721, tokenName]));
            const kind = type_parser_1.ParseType(event.event);
            if (!kind)
                return [];
            try {
                const cwEvent = yield enricher_1.Enrich(this._api, event.blockNumber, kind, event);
                cwEvent.chain = tokenName;
                return cwEvent ? [cwEvent] : [];
            }
            catch (e) {
                log.error(`Failed to enrich event. Block number: ${event.blockNumber}, Name/Kind: ${event.event}, Error Message: ${e.message}`);
                return [];
            }
        });
    }
}
exports.Processor = Processor;
//# sourceMappingURL=processor.js.map