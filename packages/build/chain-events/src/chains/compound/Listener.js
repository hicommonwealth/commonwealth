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
    constructor(chain, contractAddress, url, skipCatchup, verbose, discoverReconnectRange) {
        super(interfaces_1.SupportedNetwork.Compound, chain, verbose);
        this.log = logging_1.factory.getLogger(logging_1.addPrefix(__filename, [interfaces_1.SupportedNetwork.Compound, this._chain]));
        this._options = {
            url,
            skipCatchup: !!skipCatchup,
            contractAddress,
        };
        this._subscribed = false;
        this.discoverReconnectRange = discoverReconnectRange;
    }
    async init() {
        try {
            this._api = await subscribeFunc_1.createApi(this._options.url, this._options.contractAddress, 10 * 1000, this._chain);
        }
        catch (error) {
            this.log.error(`Fatal error occurred while starting the API`);
            throw error;
        }
        try {
            this._processor = new processor_1.Processor(this._api, this._chain);
            this._subscriber = await new subscriber_1.Subscriber(this._api, this._chain, this._verbose);
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
        if (!this._options.skipCatchup)
            await this.processMissedBlocks();
        else
            this.log.info(`Skipping event catchup on startup!`);
        try {
            this.log.info(`Subscribing to Compound contract: ${this._chain}, on url ${this._options.url}`);
            await this._subscriber.subscribe(this.processBlock.bind(this));
            this._subscribed = true;
        }
        catch (error) {
            this.log.error(`Subscription error: ${error.message}`);
        }
    }
    async updateContractAddress(address) {
        if (address === this._options.contractAddress) {
            this.log.warn(`The contract address is already set to ${address}`);
            return;
        }
        this._options.contractAddress = address;
        await this.init();
        if (this._subscribed === true)
            await this.subscribe();
    }
    async processBlock(event) {
        const { blockNumber } = event;
        if (!this._lastBlockNumber || blockNumber > this._lastBlockNumber) {
            this._lastBlockNumber = blockNumber;
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
            return;
        }
        let offlineRange;
        try {
            // fetch the block of the last server event from database
            offlineRange = await this.discoverReconnectRange(this._chain);
            if (!offlineRange) {
                this.log.warn('No offline range found, skipping event catchup.');
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
            const cwEvents = await this.storageFetcher.fetch(offlineRange);
            for (const event of cwEvents) {
                await this.handleEvent(event);
            }
        }
        catch (error) {
            this.log.error(`Unable to fetch events from storage: ${error.message}`);
        }
    }
    get options() {
        return this._options;
    }
}
exports.Listener = Listener;
