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
        this.log = logging_1.factory.getLogger(logging_1.addPrefix(__filename, [interfaces_1.SupportedNetwork.Cosmos, this._chain]));
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
            this._api = await subscribeFunc_1.createApi(this._options.url, 10 * 1000, this._chain);
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
        if (!this._lastBlockNumber || height > this._lastBlockNumber) {
            this._lastBlockNumber = height;
        }
        const cwEvents = await this._processor.process(event);
        // process events in sequence
        for (const evt of cwEvents)
            await this.handleEvent(evt);
    }
    async processMissedBlocks() {
        this.log.info(`Detected offline time, polling missed blocks...`);
        if (!this.discoverReconnectRange) {
            this.log.info(`Unable to determine offline range - No discoverReconnectRange function given`);
            return null;
        }
        // TODO: what to do about this offline range code for Cosmos?
        let offlineRange;
        try {
            // fetch the block of the last server event from database
            offlineRange = await this.discoverReconnectRange(this._chain);
            if (!offlineRange) {
                this.log.warn('No offline range found, skipping event catchup.');
                return null;
            }
        }
        catch (error) {
            this.log.error(`Could not discover offline range: ${error.message}. Skipping event catchup.`);
            return null;
        }
        // compare with default range algorithm: take last cached block in processor
        // if it exists, and is more recent than the provided algorithm
        // (note that on first run, we wont have a cached block/this wont do anything)
        if (this._lastBlockNumber &&
            (!offlineRange ||
                !offlineRange.startBlock ||
                offlineRange.startBlock < this._lastBlockNumber)) {
            offlineRange = { startBlock: this._lastBlockNumber };
        }
        // if we can't figure out when the last block we saw was,
        // do nothing
        // (i.e. don't try and fetch all events from block 0 onward)
        if (!offlineRange || !offlineRange.startBlock) {
            this.log.warn(`Unable to determine offline time range.`);
            return null;
        }
        return offlineRange;
    }
    get options() {
        return this._options;
    }
}
exports.Listener = Listener;
