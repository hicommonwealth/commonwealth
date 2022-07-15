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
exports.Listener = void 0;
const logging_1 = require("./logging");
let log;
// TODO: processBlock + processMissedBlocks can both be generalized and override in edge case listeners
// TODO: subscribe method can be implemented here and override in edge case (or use super.subscribe() in edge cases)
class Listener {
    constructor(network, chain, verbose) {
        this._chain = chain;
        this.eventHandlers = {};
        this._verbose = !!verbose;
        this.globalExcludedEvents = [];
        log = logging_1.factory.getLogger(logging_1.addPrefix(__filename, [network, chain]));
    }
    unsubscribe() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._subscriber) {
                log.warn(`Subscriber isn't initialized. Please run init() first!`);
                return;
            }
            if (!this._subscribed) {
                log.warn(`The listener is not subscribed`);
                return;
            }
            this._subscriber.unsubscribe();
            this._subscribed = false;
        });
    }
    handleEvent(event) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let prevResult;
            event.chain = this._chain;
            event.received = Date.now();
            for (const key of Object.keys(this.eventHandlers)) {
                const eventHandler = this.eventHandlers[key];
                if (!this.globalExcludedEvents.includes(event.data.kind) &&
                    !((_a = eventHandler.excludedEvents) === null || _a === void 0 ? void 0 : _a.includes(event.data.kind))) {
                    try {
                        prevResult = yield eventHandler.handler.handle(event, prevResult);
                    }
                    catch (err) {
                        log.error(`Event handle failure: ${err.message}`);
                        break;
                    }
                }
            }
        });
    }
    get chain() {
        return this._chain;
    }
    get subscribed() {
        return this._subscribed;
    }
    get lastBlockNumber() {
        return this._lastBlockNumber;
    }
}
exports.Listener = Listener;
//# sourceMappingURL=Listener.js.map