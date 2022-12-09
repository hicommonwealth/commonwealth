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
        this.log = logging_1.factory.getLogger((0, logging_1.addPrefix)(__filename, [interfaces_1.SupportedNetwork.Substrate, this._chain]));
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
            this._api = await (0, index_1.createApi)(this._options.url, this._options.spec, this._chain);
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
        // processed blocks missed blocks in the background while the subscription is active
        if (!this.options.skipCatchup) {
            await this.processMissedBlocks();
        }
        else
            this.log.info(`Skipping event catchup on startup!`);
        try {
            this.log.info(`Subscribing to ${this._chain} on url ${this._options.url}`);
            await this._subscriber.subscribe(this.processBlock.bind(this));
            this._subscribed = true;
        }
        catch (error) {
            this.log.error(`Subscription error`, error.message);
            throw error;
        }
    }
    async processMissedBlocks() {
        const offlineRange = await this.processOfflineRange(this.log);
        if (!offlineRange)
            return;
        this.log.info(`Missed blocks: ${offlineRange.startBlock} to ${offlineRange.endBlock}`);
        try {
            const maxBlocksPerPoll = 100;
            let startBlock = offlineRange.startBlock;
            let endBlock;
            if (startBlock + maxBlocksPerPoll < offlineRange.endBlock)
                endBlock = startBlock + maxBlocksPerPoll;
            else
                endBlock = offlineRange.endBlock;
            while (endBlock <= offlineRange.endBlock) {
                const blocks = await this.getBlocks(startBlock, endBlock + 1);
                for (const block of blocks) {
                    await this.processBlock(block);
                }
                // stop loop when we have fetched all blocks
                if (endBlock === offlineRange.endBlock)
                    break;
                startBlock = endBlock + 1;
                if (endBlock + maxBlocksPerPoll <= offlineRange.endBlock)
                    endBlock += maxBlocksPerPoll;
                else
                    endBlock = offlineRange.endBlock;
            }
        }
        catch (error) {
            this.log.error(`Block polling failed after disconnect at block ${offlineRange.startBlock}`, error);
        }
        this.log.info(`Successfully processed block ${offlineRange.startBlock} to ${offlineRange.endBlock}`);
    }
    async getBlocks(startBlock, endBlock) {
        this.log.info(`Polling blocks ${startBlock} to ${endBlock}`);
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
        if (!this._lastCachedBlockNumber || blockNumber > this._lastCachedBlockNumber) {
            this._lastCachedBlockNumber = blockNumber;
        }
        const events = await this._processor.process(block);
        for (const event of events) {
            await this.handleEvent(event);
        }
    }
    get options() {
        return this._options;
    }
    async getLatestBlockNumber() {
        const header = await this._api.rpc.chain.getHeader();
        return +header.number;
    }
    async isConnected() {
        return this._api.isConnected;
    }
}
exports.Listener = Listener;
