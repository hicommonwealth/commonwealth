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
const subscriber_1 = require("./subscriber");
class Listener extends Listener_1.Listener {
    constructor(chain, tokenAddresses, url, tokenNames, enricherConfig, verbose) {
        super(interfaces_1.SupportedNetwork.ERC20, chain, verbose);
        this.log = logging_1.factory.getLogger(logging_1.addPrefix(__filename, [interfaces_1.SupportedNetwork.ERC20]));
        this._options = {
            url,
            tokenAddresses,
            tokenNames,
            enricherConfig: enricherConfig || {},
        };
        this._subscribed = false;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this._api = yield subscribeFunc_1.createApi(this._options.url, this._options.tokenAddresses, this._options.tokenNames, 10000);
            }
            catch (error) {
                this.log.error('Fatal error occurred while starting the API');
                throw error;
            }
            try {
                this._processor = new processor_1.Processor(this._api, this._options.enricherConfig);
                this._subscriber = new subscriber_1.Subscriber(this._api, this._chain, this._verbose);
            }
            catch (error) {
                this.log.error('Fatal error occurred while starting the Processor and Subscriber');
                throw error;
            }
        });
    }
    subscribe() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._subscriber) {
                this.log.info("Subscriber isn't initialized. Please run init() first!");
                return;
            }
            try {
                this.log.info(`Subscribing to the following token(s): ${this.options.tokenNames || '[token names not given!]'}, on url ${this._options.url}`);
                yield this._subscriber.subscribe(this.processBlock.bind(this));
                this._subscribed = true;
            }
            catch (error) {
                this.log.error(`Subscription error: ${error.message}`);
            }
        });
    }
    // override handleEvent to stop the chain from being added to event data
    // since the chain/token name is added to event data in the subscriber.ts
    // (since there are multiple tokens)
    handleEvent(event) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let prevResult;
            // eslint-disable-next-line guard-for-in
            for (const key in this.eventHandlers) {
                const eventHandler = this.eventHandlers[key];
                if (this.globalExcludedEvents.includes(event.data.kind) ||
                    ((_a = eventHandler.excludedEvents) === null || _a === void 0 ? void 0 : _a.includes(event.data.kind)))
                    // eslint-disable-next-line no-continue
                    continue;
                try {
                    prevResult = yield eventHandler.handler.handle(event, prevResult);
                }
                catch (err) {
                    this.log.error(`Event handle failure: ${err.message}`);
                    break;
                }
            }
        });
    }
    processBlock(event, tokenName) {
        return __awaiter(this, void 0, void 0, function* () {
            const cwEvents = yield this._processor.process(event, tokenName);
            // process events in sequence
            for (const e of cwEvents) {
                yield this.handleEvent(e);
            }
        });
    }
    get options() {
        return this._options;
    }
}
exports.Listener = Listener;
//# sourceMappingURL=Listener.js.map