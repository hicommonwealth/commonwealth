"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Listener = void 0;
const interfaces_1 = require("../../interfaces");
const Listener_1 = require("../../Listener");
const logging_1 = require("../../logging");
const subscribeFunc_1 = require("./subscribeFunc");
const processor_1 = require("./processor");
const subscriber_1 = require("./subscriber");
class Listener extends Listener_1.Listener {
    _options;
    log;
    constructor(chain, tokenAddresses, url, tokenNames, verbose) {
        super(interfaces_1.SupportedNetwork.ERC721, chain, verbose);
        this.log = logging_1.factory.getLogger(logging_1.addPrefix(__filename, [interfaces_1.SupportedNetwork.ERC721]));
        this._options = {
            url,
            tokenAddresses,
            tokenNames,
        };
        this._subscribed = false;
    }
    async init() {
        try {
            this._api = await subscribeFunc_1.createApi(this._options.url, this._options.tokenAddresses, this._options.tokenNames, 10000);
        }
        catch (error) {
            this.log.error('Fatal error occurred while starting the API');
            throw error;
        }
        try {
            this._processor = new processor_1.Processor(this._api);
            this._subscriber = new subscriber_1.Subscriber(this._api, this._chain, this._verbose);
        }
        catch (error) {
            this.log.error('Fatal error occurred while starting the Processor and Subscriber');
            throw error;
        }
    }
    async subscribe() {
        if (!this._subscriber) {
            this.log.info("Subscriber isn't initialized. Please run init() first!");
            return;
        }
        try {
            this.log.info(`Subscribing to the following token(s): ${this.options.tokenNames || '[token names not given!]'}, on url ${this._options.url}`);
            await this._subscriber.subscribe(this.processBlock.bind(this));
            this._subscribed = true;
        }
        catch (error) {
            this.log.error(`Subscription error: ${error.message}`);
        }
    }
    // override handleEvent to stop the chain from being added to event data
    // since the chain/token name is added to event data in the subscriber.ts
    // (since there are multiple tokens)
    async handleEvent(event) {
        let prevResult;
        // eslint-disable-next-line guard-for-in
        for (const key in this.eventHandlers) {
            const eventHandler = this.eventHandlers[key];
            if (this.globalExcludedEvents.includes(event.data.kind) ||
                eventHandler.excludedEvents?.includes(event.data.kind))
                // eslint-disable-next-line no-continue
                continue;
            try {
                prevResult = await eventHandler.handler.handle(event, prevResult);
            }
            catch (err) {
                this.log.error(`Event handle failure: ${err.message}`);
                break;
            }
        }
    }
    async processBlock(event, tokenName) {
        const cwEvents = await this._processor.process(event, tokenName);
        // process events in sequence
        for (const e of cwEvents) {
            await this.handleEvent(e);
        }
    }
    get options() {
        return this._options;
    }
}
exports.Listener = Listener;
