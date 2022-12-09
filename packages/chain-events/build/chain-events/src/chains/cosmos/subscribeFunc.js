"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribeEvents = exports.createApi = void 0;
const stargate_1 = require("@cosmjs/stargate");
const tendermint_rpc_1 = require("@cosmjs/tendermint-rpc");
const sleep_promise_1 = __importDefault(require("sleep-promise"));
const interfaces_1 = require("../../interfaces");
const logging_1 = require("../../logging");
const subscriber_1 = require("./subscriber");
const processor_1 = require("./processor");
/**
 * Attempts to open an API connection, retrying if it cannot be opened.
 * @param url websocket endpoing to connect to, including ws[s]:// and port
 * @param typeOverrides
 * @param chain
 * @returns a promise resolving to an ApiPromise once the connection has been established
 */
async function createApi(url, retryTimeMs = 10 * 1000, chain) {
    const log = logging_1.factory.getLogger((0, logging_1.addPrefix)(__filename, [interfaces_1.SupportedNetwork.Cosmos, chain]));
    for (let i = 0; i < 3; ++i) {
        try {
            const tm = await tendermint_rpc_1.Tendermint34Client.connect(url);
            const lcd = stargate_1.QueryClient.withExtensions(tm, stargate_1.setupGovExtension, stargate_1.setupStakingExtension, stargate_1.setupBankExtension);
            return { tm, lcd };
        }
        catch (err) {
            log.error(`Cosmos chain at url: ${url} failure: ${err.message}`);
            await (0, sleep_promise_1.default)(retryTimeMs);
            log.error(`Retrying connection...`);
        }
    }
    throw new Error(`[${interfaces_1.SupportedNetwork.Cosmos}${chain ? `::${chain}` : ''}]: Failed to start Cosmos chain at ${url}`);
}
exports.createApi = createApi;
/**
 * This is the main function for substrate event handling. It constructs a connection
 * to the chain, connects all event-related modules, and initializes event handling.
 * @param options
 * @returns An active block subscriber.
 */
const subscribeEvents = async (options) => {
    const { chain, api, handlers, skipCatchup, discoverReconnectRange, verbose, pollTime, } = options;
    const log = logging_1.factory.getLogger((0, logging_1.addPrefix)(__filename, [interfaces_1.SupportedNetwork.Cosmos, chain]));
    // helper function that sends an event through event handlers
    const handleEventFn = async (event) => {
        let prevResult = null;
        for (const handler of handlers) {
            try {
                // pass result of last handler into next one (chaining db events)
                prevResult = await handler.handle(event, prevResult);
            }
            catch (err) {
                log.error(`Event handle failure: ${err.message}`);
                break;
            }
        }
    };
    // helper function that sends a block through the event processor and
    // into the event handlers
    const processor = new processor_1.Processor(api);
    const processEventFn = async (event) => {
        // retrieve events from block
        const cwEvents = await processor.process(event);
        // process events in sequence
        for (const cwEvent of cwEvents) {
            await handleEventFn(cwEvent);
        }
    };
    const subscriber = new subscriber_1.Subscriber(api, chain, pollTime, verbose);
    // helper function that runs after we've been offline/the server's been down,
    // and attempts to fetch skipped events
    const getDisconnectedRange = async () => {
        if (!discoverReconnectRange) {
            log.warn('No function to discover offline time found, skipping event catchup.');
            return {};
        }
        log.info(`Fetching missed events since last startup of ${chain}...`);
        try {
            const offlineRange = await discoverReconnectRange();
            if (!offlineRange) {
                log.warn('No offline range found, skipping event catchup.');
                return {};
            }
            return offlineRange;
        }
        catch (e) {
            log.error(`Could not discover offline range: ${e.message}. Skipping event catchup.`);
        }
        return {};
    };
    let disconnectedRange;
    if (!skipCatchup) {
        disconnectedRange = await getDisconnectedRange();
    }
    else {
        log.info('Skipping event catchup on startup!');
    }
    try {
        log.info(`Subscribing to Compound contracts ${chain}...`);
        await subscriber.subscribe(processEventFn, disconnectedRange);
    }
    catch (e) {
        log.error(`Subscription error: ${e.message}`);
    }
    return subscriber;
};
exports.subscribeEvents = subscribeEvents;
