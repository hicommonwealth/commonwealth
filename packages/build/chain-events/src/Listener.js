"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Listener = void 0;
const logging_1 = require("./logging");
let log;
// TODO: processBlock + processMissedBlocks can both be generalized and override in edge case listeners
// TODO: subscribe method can be implemented here and override in edge case (or use super.subscribe() in edge cases)
class Listener {
    eventHandlers;
    // events to be excluded regardless of handler (overrides handler specific excluded events
    globalExcludedEvents;
    storageFetcher;
    discoverReconnectRange;
    _subscriber;
    _processor;
    _api;
    _subscribed;
    _lastBlockNumber;
    _chain;
    _verbose;
    constructor(network, chain, verbose) {
        this._chain = chain;
        this.eventHandlers = {};
        this._verbose = !!verbose;
        this.globalExcludedEvents = [];
        log = logging_1.factory.getLogger(logging_1.addPrefix(__filename, [network, chain]));
    }
    async unsubscribe() {
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
    }
    async handleEvent(event) {
        let prevResult;
        event.chain = this._chain;
        event.received = Date.now();
        for (const key of Object.keys(this.eventHandlers)) {
            const eventHandler = this.eventHandlers[key];
            if (!this.globalExcludedEvents.includes(event.data.kind) &&
                !eventHandler.excludedEvents?.includes(event.data.kind)) {
                try {
                    prevResult = await eventHandler.handler.handle(event, prevResult);
                }
                catch (err) {
                    log.error(`Event handle failure: ${err.message}`);
                    break;
                }
            }
        }
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
