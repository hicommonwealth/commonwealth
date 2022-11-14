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
        this.log = logging_1.factory.getLogger(logging_1.addPrefix(__filename, [interfaces_1.SupportedNetwork.Aave, this._chain]));
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
            this._api = await subscribeFunc_1.createApi(this._options.url, this._options.govContractAddress, 10 * 1000, this._chain);
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
        }
    }
    async updateAddress() {
        // TODO
    }
    async processMissedBlocks() {
        this.log.info(`Detected offline time, polling missed blocks...`);
        if (!this.discoverReconnectRange) {
            this.log.info(`Unable to determine offline range - No discoverReconnectRange function given`);
        }
        let offlineRange;
        try {
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
    async processBlock(event) {
        const { blockNumber } = event;
        if (!this._lastBlockNumber || blockNumber > this._lastBlockNumber) {
            this._lastBlockNumber = blockNumber;
        }
        const cwEvents = await this._processor.process(event);
        for (const evt of cwEvents) {
            await this.handleEvent(evt);
        }
    }
    get options() {
        return this._options;
    }
}
exports.Listener = Listener;
