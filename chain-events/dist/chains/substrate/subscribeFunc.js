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
exports.subscribeEvents = exports.createApi = void 0;
const api_1 = require("@polkadot/api");
const interfaces_1 = require("../../interfaces");
const logging_1 = require("../../logging");
const subscriber_1 = require("./subscriber");
const poller_1 = require("./poller");
const processor_1 = require("./processor");
/**
 * Attempts to open an API connection, retrying if it cannot be opened.
 * @param url websocket endpoing to connect to, including ws[s]:// and port
 * @param typeOverrides
 * @param chain
 * @returns a promise resolving to an ApiPromise once the connection has been established
 */
function createApi(url, typeOverrides = {}, chain) {
    return __awaiter(this, void 0, void 0, function* () {
        const log = logging_1.factory.getLogger(logging_1.addPrefix(__filename, [interfaces_1.SupportedNetwork.Substrate, chain]));
        for (let i = 0; i < 3; ++i) {
            const provider = new api_1.WsProvider(url, 0);
            let unsubscribe;
            const success = yield new Promise((resolve) => {
                unsubscribe = provider.on('connected', () => resolve(true));
                provider.on('error', () => {
                    if (i < 2)
                        log.warn(`An error occurred connecting to ${url} - retrying...`);
                    resolve(false);
                });
                provider.on('disconnected', () => resolve(false));
                provider.connect();
            });
            // construct API using provider
            if (success) {
                unsubscribe();
                return api_1.ApiPromise.create(Object.assign({ provider }, typeOverrides));
            }
            // TODO: add delay
        }
        throw new Error(`[${interfaces_1.SupportedNetwork.Substrate}${chain ? `::${chain}` : ''}]: Failed to connect to API endpoint at: ${url}`);
    });
}
exports.createApi = createApi;
/**
 * This is the main function for substrate event handling. It constructs a connection
 * to the chain, connects all event-related modules, and initializes event handling.
 * @param options
 * @returns An active block subscriber.
 */
const subscribeEvents = (options) => __awaiter(void 0, void 0, void 0, function* () {
    const { chain, api, handlers, skipCatchup, archival, startBlock, discoverReconnectRange, verbose, enricherConfig, } = options;
    const log = logging_1.factory.getLogger(logging_1.addPrefix(__filename, [interfaces_1.SupportedNetwork.Substrate, chain]));
    // helper function that sends an event through event handlers
    const handleEventFn = (event) => __awaiter(void 0, void 0, void 0, function* () {
        let prevResult = null;
        for (const handler of handlers) {
            try {
                event.chain = chain;
                event.received = Date.now();
                // pass result of last handler into next one (chaining db events)
                prevResult = yield handler.handle(event, prevResult);
            }
            catch (err) {
                log.error(`Event handle failure: ${err.message}`);
                break;
            }
        }
    });
    // helper function that sends a block through the event processor and
    // into the event handlers
    const processor = new processor_1.Processor(api, enricherConfig || {});
    const processBlockFn = (block) => __awaiter(void 0, void 0, void 0, function* () {
        // retrieve events from block
        const events = yield processor.process(block);
        // send all events through event-handlers in sequence
        for (const event of events)
            yield handleEventFn(event);
    });
    const subscriber = new subscriber_1.Subscriber(api, verbose);
    const poller = new poller_1.Poller(api);
    // if running in archival mode: run poller.archive with batch_size 50
    // then exit without subscribing.
    // TODO: should we start subscription?
    if (archival) {
        // default to startBlock 0
        const offlineRange = { startBlock: startBlock !== null && startBlock !== void 0 ? startBlock : 0 };
        log.info(`Executing in archival mode, polling blocks starting from: ${offlineRange.startBlock}`);
        yield poller.archive(offlineRange, 50, processBlockFn);
        return subscriber;
    }
    // helper function that runs after we've been offline/the server's been down,
    // and attempts to fetch events from skipped blocks
    const pollMissedBlocksFn = () => __awaiter(void 0, void 0, void 0, function* () {
        log.info('Detected offline time, polling missed blocks...');
        // grab the cached block immediately to avoid a new block appearing before the
        // server can do its thing...
        const { lastBlockNumber } = processor;
        // determine how large of a reconnect we dealt with
        let offlineRange;
        // first, attempt the provided range finding method if it exists
        // (this should fetch the block of the last server event from database)
        if (discoverReconnectRange) {
            offlineRange = yield discoverReconnectRange();
        }
        // compare with default range algorithm: take last cached block in processor
        // if it exists, and is more recent than the provided algorithm
        // (note that on first run, we wont have a cached block/this wont do anything)
        if (lastBlockNumber &&
            (!offlineRange ||
                !offlineRange.startBlock ||
                offlineRange.startBlock < lastBlockNumber)) {
            offlineRange = { startBlock: lastBlockNumber };
        }
        // if we can't figure out when the last block we saw was,
        // do nothing
        // (i.e. don't try and fetch all events from block 0 onward)
        if (!offlineRange || !offlineRange.startBlock) {
            log.warn('Unable to determine offline time range.');
            return;
        }
        try {
            const blocks = yield poller.poll(offlineRange);
            yield Promise.all(blocks.map(processBlockFn));
        }
        catch (e) {
            log.error(`Block polling failed after disconnect at block ${offlineRange.startBlock}`);
        }
    });
    if (!skipCatchup) {
        yield pollMissedBlocksFn();
    }
    else {
        log.info('Skipping event catchup on startup!');
    }
    try {
        log.info(`Subscribing to ${chain} endpoint...`);
        yield subscriber.subscribe(processBlockFn);
        // handle reconnects with poller
        api.on('connected', pollMissedBlocksFn);
    }
    catch (e) {
        log.error(`Subscription error: ${e.message}`);
    }
    return subscriber;
});
exports.subscribeEvents = subscribeEvents;
//# sourceMappingURL=subscribeFunc.js.map