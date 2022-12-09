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
    _lastCachedBlockNumber;
    _chain;
    _verbose;
    constructor(network, chain, verbose) {
        this._chain = chain;
        this.eventHandlers = {};
        this._verbose = !!verbose;
        this.globalExcludedEvents = [];
        log = logging_1.factory.getLogger((0, logging_1.addPrefix)(__filename, [network, chain]));
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
    get lastCachedBlockNumber() {
        return this._lastCachedBlockNumber;
    }
    async processOfflineRange(log) {
        log.info(`Detected offline time, polling missed blocks...`);
        if (!this.discoverReconnectRange) {
            log.info(`Unable to determine offline range - No discoverReconnectRange function given`);
        }
        // fetch the block number of the last event from database
        let offlineRange = await this.discoverReconnectRange(this._chain);
        if (this._lastCachedBlockNumber && (!offlineRange.startBlock ||
            offlineRange.startBlock < this._lastCachedBlockNumber)) {
            log.info(`Using cached block number ${this._lastCachedBlockNumber}`);
            offlineRange = { startBlock: this._lastCachedBlockNumber };
        }
        // do nothing if we don't have an existing event in the database/cache
        // (i.e. don't try and fetch all events from block 0 onward)
        if (!offlineRange.startBlock) {
            log.warn(`Unable to determine offline time range.`);
            return;
        }
        if (!offlineRange.endBlock) {
            offlineRange.endBlock = await this.getLatestBlockNumber();
            log.info(`Current endBlock: ${offlineRange.endBlock}`);
        }
        // limit max number of blocks to 500
        if (offlineRange.endBlock - offlineRange.startBlock > 500) {
            log.info(`Attempting to poll ${offlineRange.endBlock - offlineRange.startBlock} blocks, reducing query size to ${500}.`);
            offlineRange.startBlock = offlineRange.endBlock - 500;
        }
        return offlineRange;
    }
}
exports.Listener = Listener;
