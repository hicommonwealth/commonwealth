"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribeEvents = exports.createApi = void 0;
const sleep_promise_1 = __importDefault(require("sleep-promise"));
const underscore_1 = __importDefault(require("underscore"));
const eth_1 = require("../../eth");
const interfaces_1 = require("../../interfaces");
const logging_1 = require("../../logging");
const contractTypes_1 = require("../../contractTypes");
const subscriber_1 = require("./subscriber");
const processor_1 = require("./processor");
/**
 * Attempts to open an API connection, retrying if it cannot be opened.
 * @param ethNetworkUrl
 * @param tokenAddresses
 * @param tokenNames
 * @param retryTimeMs
 * @returns a promise resolving to an ApiPromise once the connection has been established

 */
async function createApi(ethNetworkUrl, tokenAddresses, tokenNames, retryTimeMs = 10 * 1000) {
    const log = logging_1.factory.getLogger(logging_1.addPrefix(__filename, [interfaces_1.SupportedNetwork.ERC721]));
    for (let i = 0; i < 3; ++i) {
        try {
            const provider = await eth_1.createProvider(ethNetworkUrl, interfaces_1.SupportedNetwork.ERC721);
            log.info(`Connection to ${ethNetworkUrl} successful!`);
            const tokenContracts = tokenAddresses.map((o) => contractTypes_1.ERC721__factory.connect(o, provider));
            const deployResults = { provider, tokens: [] };
            for (const [contract, tokenName] of underscore_1.default.zip(tokenContracts, tokenNames)) {
                try {
                    await contract.deployed();
                    deployResults.tokens.push({
                        contract,
                        tokenName,
                    });
                }
                catch (err) {
                    log.error(`Error loading token ${contract.address} (${tokenName}): ${err.message}`);
                }
            }
            return deployResults;
        }
        catch (err) {
            log.error(`Erc721 at ${ethNetworkUrl} failure: ${err.message}`);
            await sleep_promise_1.default(retryTimeMs);
            log.error('Retrying connection...');
        }
    }
    throw new Error(`[${interfaces_1.SupportedNetwork.ERC721}]: Failed to start the ERC721 listener for ${tokenAddresses} at ${ethNetworkUrl}`);
}
exports.createApi = createApi;
/**
 * This is the main function for edgeware event handling. It constructs a connection
 * to the chain, connects all event-related modules, and initializes event handling.
 * @param options
 * @returns An active block subscriber.
 */
const subscribeEvents = async (options) => {
    const { chain, api, handlers, verbose } = options;
    const log = logging_1.factory.getLogger(logging_1.addPrefix(__filename, [interfaces_1.SupportedNetwork.ERC721]));
    // helper function that sends an event through event handlers
    const handleEventFn = async (event, tokenName) => {
        event.chain = tokenName || chain;
        event.received = Date.now();
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
    const processEventFn = async (event, tokenName) => {
        // retrieve events from block
        const cwEvents = await processor.process(event);
        // process events in sequence
        for (const cwEvent of cwEvents) {
            await handleEventFn(cwEvent, tokenName);
        }
    };
    const subscriber = new subscriber_1.Subscriber(api, chain, verbose);
    // helper function that runs after we've been offline/the server's been down,
    // and attempts to fetch skipped events
    try {
        log.info(`Subscribing to ERC721 contracts ${chain}...`);
        await subscriber.subscribe(processEventFn);
    }
    catch (e) {
        log.error(`Subscription error: ${e.message}`);
    }
    return subscriber;
};
exports.subscribeEvents = subscribeEvents;
