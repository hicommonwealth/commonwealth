"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribeEvents = exports.createApi = void 0;
const sleep_promise_1 = __importDefault(require("sleep-promise"));
const eth_1 = require("../../eth");
const interfaces_1 = require("../../interfaces");
const logging_1 = require("../../logging");
const contractTypes_1 = require("../../contractTypes");
const subscriber_1 = require("./subscriber");
const processor_1 = require("./processor");
const storageFetcher_1 = require("./storageFetcher");
/**
 * Attempts to open an API connection, retrying if it cannot be opened.
 * @returns a promise resolving to an ApiPromise once the connection has been established
 * @param ethNetworkUrlOrProvider
 * @param governorAddress
 * @param retryTimeMs
 * @param chain
 */
async function createApi(ethNetworkUrlOrProvider, governorAddress, retryTimeMs = 10 * 1000, chain) {
    const ethNetworkUrl = typeof ethNetworkUrlOrProvider === 'string'
        ? ethNetworkUrlOrProvider
        : ethNetworkUrlOrProvider.connection.url;
    const log = logging_1.factory.getLogger((0, logging_1.addPrefix)(__filename, [interfaces_1.SupportedNetwork.Compound, chain]));
    for (let i = 0; i < 3; ++i) {
        try {
            const provider = typeof ethNetworkUrlOrProvider === 'string'
                ? await (0, eth_1.createProvider)(ethNetworkUrlOrProvider, interfaces_1.SupportedNetwork.Compound, chain)
                : ethNetworkUrlOrProvider;
            let contract;
            try {
                contract = contractTypes_1.GovernorAlpha__factory.connect(governorAddress, provider);
                await contract.deployed();
                await contract.guardian();
                log.info(`Found GovAlpha contract at ${contract.address}`);
            }
            catch (e) {
                contract = contractTypes_1.GovernorCompatibilityBravo__factory.connect(governorAddress, provider);
                await contract.deployed();
                log.info(`Found non-GovAlpha Compound contract at ${contract.address}, using GovernorCompatibilityBravo`);
            }
            log.info(`Connection successful!`);
            return contract;
        }
        catch (err) {
            log.error(`Compound contract: ${governorAddress} at url: ${ethNetworkUrl} failure: ${err.message}`);
            await (0, sleep_promise_1.default)(retryTimeMs);
            log.error(`Retrying connection...`);
        }
    }
    throw new Error(`[${interfaces_1.SupportedNetwork.Compound}${chain ? `::${chain}` : ''}]: Failed to start Compound listener for ${governorAddress} at ${ethNetworkUrl}`);
}
exports.createApi = createApi;
/**
 * This is the main function for edgeware event handling. It constructs a connection
 * to the chain, connects all event-related modules, and initializes event handling.
 *
 * @param url The edgeware chain endpoint to connect to.
 * @param handler An event handler object for processing received events.
 * @param skipCatchup If true, skip all fetching of "historical" chain data that may have been
 *                    emitted during downtime.
 * @param discoverReconnectRange A function to determine how long we were offline upon reconnection.
 * @returns An active block subscriber.
 */
const subscribeEvents = async (options) => {
    const { chain, api, handlers, skipCatchup, discoverReconnectRange, verbose, } = options;
    const log = logging_1.factory.getLogger((0, logging_1.addPrefix)(__filename, [interfaces_1.SupportedNetwork.Compound, chain]));
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
    const subscriber = new subscriber_1.Subscriber(api, chain, verbose);
    // helper function that runs after we've been offline/the server's been down,
    // and attempts to fetch skipped events
    const pollMissedEventsFn = async () => {
        if (!discoverReconnectRange) {
            log.warn('No function to discover offline time found, skipping event catchup.');
            return;
        }
        log.info(`Fetching missed events since last startup of ${chain}...`);
        let offlineRange;
        try {
            offlineRange = await discoverReconnectRange();
            if (!offlineRange) {
                log.warn('No offline range found, skipping event catchup.');
                return;
            }
        }
        catch (e) {
            log.error(`Could not discover offline range: ${e.message}. Skipping event catchup.`);
            return;
        }
        // defaulting to the governorAlpha contract provider, though could be any of the contracts
        const fetcher = new storageFetcher_1.StorageFetcher(api);
        try {
            const cwEvents = await fetcher.fetch(offlineRange);
            // process events in sequence
            for (const cwEvent of cwEvents) {
                await handleEventFn(cwEvent);
            }
        }
        catch (e) {
            log.error(`Unable to fetch events from storage: ${e.message}`);
        }
    };
    if (!skipCatchup) {
        await pollMissedEventsFn();
    }
    else {
        log.info('Skipping event catchup on startup!');
    }
    try {
        log.info(`Subscribing to Compound contracts ${chain}...`);
        await subscriber.subscribe(processEventFn);
    }
    catch (e) {
        log.error(`Subscription error: ${e.message}`);
    }
    return subscriber;
};
exports.subscribeEvents = subscribeEvents;
