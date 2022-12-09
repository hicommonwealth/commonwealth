"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Listener = void 0;
const Listener_1 = require("../../Listener");
const interfaces_1 = require("../../interfaces");
const logging_1 = require("../../logging");
const subscribeFunc_1 = require("./subscribeFunc");
const subscriber_1 = require("./subscriber");
const processor_1 = require("./processor");
const storageFetcher_1 = require("./storageFetcher");
class Listener extends Listener_1.Listener {
    _options;
    log;
    constructor(chain, govContractAddress, url, skipCatchup, verbose, discoverReconnectRange) {
        super(interfaces_1.SupportedNetwork.Aave, chain, verbose);
        this.log = logging_1.factory.getLogger((0, logging_1.addPrefix)(__filename, [interfaces_1.SupportedNetwork.Aave, this._chain]));
        this._options = {
            url,
            govContractAddress,
            skipCatchup: !!skipCatchup,
        };
        this.discoverReconnectRange = discoverReconnectRange;
        this._subscribed = false;
    }
    async init() {
        try {
            this._api = await (0, subscribeFunc_1.createApi)(this._options.url, this._options.govContractAddress, 10 * 1000, this._chain);
        }
        catch (error) {
            this.log.error(`Fatal error occurred while starting the API`);
            throw error;
        }
        try {
            this._processor = new processor_1.Processor(this._api, this._chain);
            this._subscriber = new subscriber_1.Subscriber(this._api, this._chain, this._verbose);
            this.storageFetcher = new storageFetcher_1.StorageFetcher(this._api, this._chain);
        }
        catch (error) {
            this.log.error(`Fatal error occurred while starting the Processor, StorageFetcher and Subscriber`);
            throw error;
        }
    }
    async subscribe() {
        if (!this._subscriber) {
            this.log.info(`Subscriber for ${this._chain} isn't initialized. Please run init() first!`);
            return;
        }
        if (!this.options.skipCatchup)
            await this.processMissedBlocks();
        else
            this.log.info(`Skipping event catchup!`);
        try {
            this.log.info(`Subscribing to Aave contract: ${this._chain}, on url ${this._options.url}`);
            await this._subscriber.subscribe(this.processBlock.bind(this));
            this._subscribed = true;
        }
        catch (error) {
            this.log.error(`Subscription error: ${error.message}`);
            throw error;
        }
    }
    async updateAddress() {
        // TODO
    }
    async processMissedBlocks() {
        const offlineRange = await this.processOfflineRange(this.log);
        if (!offlineRange)
            return;
        this.log.info(`Missed blocks: ${offlineRange.startBlock} to ${offlineRange.endBlock}`);
        try {
            const maxBlocksPerPoll = 250;
            let startBlock = offlineRange.startBlock;
            let endBlock;
            if (startBlock + maxBlocksPerPoll < offlineRange.endBlock)
                endBlock = startBlock + maxBlocksPerPoll;
            else
                endBlock = offlineRange.endBlock;
            while (endBlock <= offlineRange.endBlock) {
                const cwEvents = await this.storageFetcher.fetch({ startBlock, endBlock });
                for (const event of cwEvents) {
                    await this.handleEvent(event);
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
            this.log.error(`Unable to fetch events from storage`, error);
        }
        this.log.info(`Successfully processed block ${offlineRange.startBlock} to ${offlineRange.endBlock}`);
    }
    async processBlock(event) {
        const { blockNumber } = event;
        if (!this._lastCachedBlockNumber || blockNumber > this._lastCachedBlockNumber) {
            this._lastCachedBlockNumber = blockNumber;
        }
        const cwEvents = await this._processor.process(event);
        for (const evt of cwEvents) {
            await this.handleEvent(evt);
        }
    }
    get options() {
        return this._options;
    }
    async getLatestBlockNumber() {
        return this._api.governance.provider.getBlockNumber();
    }
    async isConnected() {
        // force type to any because the Ethers Provider interface does not include the original
        // Web3 provider, yet it exists under provider.provider
        const provider = this._api.governance.provider;
        // WebSocket ReadyState - more info: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/readyState
        const readyState = provider.provider.connection._readyState === 1;
        const socketConnected = provider.provider.connected;
        const polling = provider.polling;
        return readyState && socketConnected && polling;
    }
}
exports.Listener = Listener;
