"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Listener = void 0;
const interfaces_1 = require("../../interfaces");
const Listener_1 = require("../../Listener");
const logging_1 = require("../../logging");
const subscribeFunc_1 = require("./subscribeFunc");
const processor_1 = require("./processor");
const storageFetcher_1 = require("./storageFetcher");
const subscriber_1 = require("./subscriber");
class Listener extends Listener_1.Listener {
    _options;
    log;
    constructor(chain, url, skipCatchup, pollTime, verbose, discoverReconnectRange) {
        super(interfaces_1.SupportedNetwork.Cosmos, chain, verbose);
        this.log = logging_1.factory.getLogger((0, logging_1.addPrefix)(__filename, [interfaces_1.SupportedNetwork.Cosmos, this._chain]));
        this._options = {
            url,
            skipCatchup: !!skipCatchup,
            pollTime,
        };
        this._subscribed = false;
        this.discoverReconnectRange = discoverReconnectRange;
    }
    async init() {
        try {
            this._api = await (0, subscribeFunc_1.createApi)(this._options.url, 10 * 1000, this._chain);
        }
        catch (error) {
            this.log.error(`Fatal error occurred while starting the API`);
            throw error;
        }
        try {
            this._processor = new processor_1.Processor(this._api, this._chain);
            this._subscriber = new subscriber_1.Subscriber(this._api, this._chain, this._options.pollTime, this._verbose);
        }
        catch (error) {
            this.log.error(`Fatal error occurred while starting the Processor, and Subscriber`);
            throw error;
        }
        try {
            this.storageFetcher = new storageFetcher_1.StorageFetcher(this._api, this._chain);
        }
        catch (error) {
            this.log.error(`Fatal error occurred while starting the Ethereum dater and storage fetcher`);
            throw error;
        }
    }
    async subscribe() {
        if (!this._subscriber) {
            this.log.info(`Subscriber for ${this._chain} isn't initialized. Please run init() first!`);
            return;
        }
        // processed blocks missed during downtime
        let offlineRange;
        if (!this._options.skipCatchup) {
            offlineRange = await this.processMissedBlocks();
        }
        else
            this.log.info(`Skipping event catchup on startup!`);
        try {
            this.log.info(`Subscribing to Cosmos chain: ${this._chain}, on url ${this._options.url}`);
            await this._subscriber.subscribe(this.processBlock.bind(this), offlineRange);
            this._subscribed = true;
        }
        catch (error) {
            this.log.error(`Subscription error: ${error.message}`);
            throw error;
        }
    }
    async updateUrl(url) {
        if (url === this._options.url) {
            this.log.warn(`The chain URL is already set to ${url}`);
            return;
        }
        this._options.url = url;
        await this.init();
        if (this._subscribed === true)
            await this.subscribe();
    }
    async processBlock(event) {
        const { height } = event;
        if (!this._lastCachedBlockNumber || height > this._lastCachedBlockNumber) {
            this._lastCachedBlockNumber = height;
        }
        const cwEvents = await this._processor.process(event);
        // process events in sequence
        for (const evt of cwEvents)
            await this.handleEvent(evt);
    }
    async processMissedBlocks() {
        const offlineRange = await this.processOfflineRange(this.log);
        if (!offlineRange)
            return;
        return offlineRange;
    }
    get options() {
        return this._options;
    }
    async getLatestBlockNumber() {
        return (await this._api.tm.block()).block.header.height;
    }
    async isConnected() {
        // cosmos querying is polling/HTTP based so there is no
        // long-running WebSocket connection we can check the status for
        // this function will be deprecated when we switch all listeners
        // to HTTP polling
        return true;
    }
}
exports.Listener = Listener;
