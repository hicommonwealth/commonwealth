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
const interfaces_1 = require("../../interfaces");
const Listener_1 = require("../../Listener");
const logging_1 = require("../../logging");
const subscribeFunc_1 = require("./subscribeFunc");
const processor_1 = require("./processor");
const storageFetcher_1 = require("./storageFetcher");
const subscriber_1 = require("./subscriber");
class Listener extends Listener_1.Listener {
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
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this._api = yield subscribeFunc_1.createApi(this._options.url, this._options.contractAddress, 10 * 1000, this._chain);
            }
            catch (error) {
                this.log.error(`Fatal error occurred while starting the API`);
                throw error;
            }
            try {
                this._processor = new processor_1.Processor(this._api, this._chain);
                this._subscriber = yield new subscriber_1.Subscriber(this._api, this._chain, this._verbose);
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
        });
    }
    subscribe() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._subscriber) {
                this.log.info(`Subscriber for ${this._chain} isn't initialized. Please run init() first!`);
                return;
            }
            // processed blocks missed during downtime
            if (!this._options.skipCatchup)
                yield this.processMissedBlocks();
            else
                this.log.info(`Skipping event catchup on startup!`);
            try {
                this.log.info(`Subscribing to Compound contract: ${this._chain}, on url ${this._options.url}`);
                yield this._subscriber.subscribe(this.processBlock.bind(this));
                this._subscribed = true;
            }
            catch (error) {
                this.log.error(`Subscription error: ${error.message}`);
            }
        });
    }
    updateContractAddress(address) {
        return __awaiter(this, void 0, void 0, function* () {
            if (address === this._options.contractAddress) {
                this.log.warn(`The contract address is already set to ${address}`);
                return;
            }
            this._options.contractAddress = address;
            yield this.init();
            if (this._subscribed === true)
                yield this.subscribe();
        });
    }
    processBlock(event) {
        return __awaiter(this, void 0, void 0, function* () {
            const { blockNumber } = event;
            if (!this._lastBlockNumber || blockNumber > this._lastBlockNumber) {
                this._lastBlockNumber = blockNumber;
            }
            const cwEvents = yield this._processor.process(event);
            // process events in sequence
            for (const evt of cwEvents)
                yield this.handleEvent(evt);
        });
    }
    processMissedBlocks() {
        return __awaiter(this, void 0, void 0, function* () {
            this.log.info(`Detected offline time, polling missed blocks...`);
            if (!this.discoverReconnectRange) {
                this.log.info(`Unable to determine offline range - No discoverReconnectRange function given`);
                return;
            }
            let offlineRange;
            try {
                // fetch the block of the last server event from database
                offlineRange = yield this.discoverReconnectRange(this._chain);
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
                const cwEvents = yield this.storageFetcher.fetch(offlineRange);
                for (const event of cwEvents) {
                    yield this.handleEvent(event);
                }
            }
            catch (error) {
                this.log.error(`Unable to fetch events from storage: ${error.message}`);
            }
        });
    }
    get options() {
        return this._options;
    }
}
exports.Listener = Listener;
//# sourceMappingURL=Listener.js.map