"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Listener = void 0;
const interfaces_1 = require("../../interfaces");
const Listener_1 = require("../../Listener");
const logging_1 = require("../../logging");
const index_1 = require("./index");
// TODO: archival support
class Listener extends Listener_1.Listener {
    _options;
    _poller;
    log;
    constructor(chain, url, spec, archival, startBlock, skipCatchup, enricherConfig, verbose, discoverReconnectRange) {
        super(interfaces_1.SupportedNetwork.Substrate, chain, verbose);
        this.log = logging_1.factory.getLogger(logging_1.addPrefix(__filename, [interfaces_1.SupportedNetwork.Substrate, this._chain]));
        this._options = {
            archival: !!archival,
            startBlock: startBlock ?? 0,
            url,
            spec: spec || {},
            skipCatchup: !!skipCatchup,
            enricherConfig: enricherConfig || {},
        };
        this.discoverReconnectRange = discoverReconnectRange;
        this._subscribed = false;
    }
    async init() {
        try {
            this._api = await index_1.createApi(this._options.url, this._options.spec, this._chain);
            this._api.on('connected', this.processMissedBlocks);
        }
        catch (error) {
            this.log.error(`Fatal error occurred while starting the API`);
            throw error;
        }
        try {
            this._poller = new index_1.Poller(this._api, this._chain);
            this._processor = new index_1.Processor(this._api, this._options.enricherConfig, this._chain);
            this.storageFetcher = new index_1.StorageFetcher(this._api, this._chain);
            this._subscriber = await new index_1.Subscriber(this._api, this._verbose, this._chain);
        }
        catch (error) {
            this.log.error(`Fatal error occurred while starting the Poller, Processor, Subscriber, and Fetcher`);
            throw error;
        }
    }
    async subscribe() {
        if (!this._subscriber) {
            this.log.warn(`Subscriber isn't initialized. Please run init() first!`);
            return;
        }
        // processed blocks missed during downtime
        if (!this.options.skipCatchup)
            await this.processMissedBlocks();
        else
            this.log.info(`Skipping event catchup on startup!`);
        try {
            this.log.info(`Subscribing to ${this._chain} on url ${this._options.url}`);
            await this._subscriber.subscribe(this.processBlock.bind(this));
            this._subscribed = true;
        }
        catch (error) {
            this.log.error(`Subscription error`, error.message);
        }
    }
    async processMissedBlocks() {
        this.log.info(`Detected offline time, polling missed blocks...`);
        if (!this.discoverReconnectRange) {
            this.log.info(`Unable to determine offline range - No discoverReconnectRange function given`);
            return;
        }
        let offlineRange;
        try {
            // fetch the block of the last server event from database
            offlineRange = await this.discoverReconnectRange(this._chain);
            if (!offlineRange) {
                this.log.warn(`No offline range found, skipping event catchup.`);
                return;
            }
        }
        catch (error) {
            this.log.error(`Could not discover offline range: ${error.message}. Skipping event catchup.`);
            return;
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
            return;
        }
        try {
            const blocks = await this.getBlocks(offlineRange.startBlock, offlineRange.endBlock);
            await Promise.all(blocks.map(this.processBlock, this));
        }
        catch (error) {
            this.log.error(`Block polling failed after disconnect at block ${offlineRange.startBlock}`, error);
        }
    }
    async getBlocks(startBlock, endBlock) {
        return this._poller.poll({ startBlock, endBlock });
    }
    async updateSpec(spec) {
        // set the new spec
        this._options.spec = spec;
        // restart api with new spec
        await this.init();
        if (this._subscribed === true)
            await this.subscribe();
    }
    async updateUrl(url) {
        this._options.url = url;
        // restart api with new url
        await this.init();
        if (this._subscribed === true)
            await this.subscribe();
    }
    async processBlock(block) {
        // cache block number if needed for disconnection purposes
        const blockNumber = +block.header.number;
        if (!this._lastBlockNumber || blockNumber > this._lastBlockNumber) {
            this._lastBlockNumber = blockNumber;
        }
        const events = await this._processor.process(block);
        for (const event of events) {
            await this.handleEvent(event);
        }
    }
    get options() {
        return this._options;
    }
}
exports.Listener = Listener;
