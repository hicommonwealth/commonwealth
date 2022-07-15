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
 * @param ethNetworkUrl
 * @param governanceAddress
 * @param retryTimeMs
 * @param chain
 * @returns a promise resolving to an ApiPromise once the connection has been established
 */
function createApi(ethNetworkUrl, factoryAddress, retryTimeMs = 10 * 1000, chain) {
    return __awaiter(this, void 0, void 0, function* () {
        const log = logging_1.factory.getLogger(logging_1.addPrefix(__filename, [interfaces_1.SupportedNetwork.Commonwealth, chain]));
        const api = { factory: null, projects: [] };
        for (let i = 0; i < 3; ++i) {
            try {
                const provider = yield eth_1.createProvider(ethNetworkUrl, interfaces_1.SupportedNetwork.Commonwealth, chain);
                api.factory = contractTypes_1.IProjectBaseFactory__factory.connect(factoryAddress, provider);
                yield api.factory.deployed();
                // create subscriptions for all existing projects
                const nProjects = yield api.factory.numProjects();
                for (let projectN = 1; projectN <= nProjects; projectN++) {
                    const projectAddress = yield api.factory.projects(projectN);
                    const project = yield subscriber_1.constructProjectApi(api.factory, projectAddress);
                    api.projects.push(project);
                    /*
                      Do not subscribe to tokens for time being
            
                    project.bToken.on(
                      '*',
                      this._listener.bind(this, project.bToken.address, ContractType.bToken)
                    );
                    if (project.cToken && project.isCurated) {
                      project.cToken.on(
                        '*',
                        this._listener.bind(this, project.cToken.address, ContractType.cToken)
                      );
                    }
                    */
                }
                log.info('Connection successful!');
                return api;
            }
            catch (err) {
                log.error(`Commonwealth ${factoryAddress} at ${ethNetworkUrl} failure: ${err.message}`);
                yield sleep_promise_1.default(retryTimeMs);
                log.error('Retrying connection...');
            }
        }
        throw new Error(`[${interfaces_1.SupportedNetwork.Commonwealth} ${chain ? `::${chain}` : ''}]: Failed to start Commonwealth listener for ${factoryAddress} at ${ethNetworkUrl}`);
    });
}
exports.createApi = createApi;
/**
 * This is the main function for edgeware event handling. It constructs a connection
 * to the chain, connects all event-related modules, and initializes event handling.
 * @param options
 * @returns An active block subscriber.
 */
const subscribeEvents = (options) => __awaiter(void 0, void 0, void 0, function* () {
    const { chain, api, handlers, skipCatchup, discoverReconnectRange, verbose, } = options;
    const log = logging_1.factory.getLogger(logging_1.addPrefix(__filename, [interfaces_1.SupportedNetwork.Commonwealth, chain]));
    // helper function that sends an event through event handlers
    const handleEventFn = (event) => __awaiter(void 0, void 0, void 0, function* () {
        let prevResult = null;
        for (const handler of handlers) {
            try {
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
    const processor = new processor_1.Processor(api);
    const processEventFn = (event) => __awaiter(void 0, void 0, void 0, function* () {
        // retrieve events from block
        const cwEvents = yield processor.process(event);
        // process events in sequence
        for (const cwEvent of cwEvents) {
            yield handleEventFn(cwEvent);
        }
    });
    const subscriber = new subscriber_1.Subscriber(api, chain, verbose);
    // helper function that runs after we've been offline/the server's been down,
    // and attempts to fetch skipped events
    const pollMissedEventsFn = () => __awaiter(void 0, void 0, void 0, function* () {
        if (!discoverReconnectRange) {
            log.warn('No function to discover offline time found, skipping event catchup.');
            return;
        }
        log.info(`Fetching missed events since last startup of ${chain}...`);
        let offlineRange;
        try {
            offlineRange = yield discoverReconnectRange();
            if (!offlineRange) {
                log.warn('No offline range found, skipping event catchup.');
                return;
            }
        }
        catch (e) {
            log.error(`Could not discover offline range: ${e.message}. Skipping event catchup.`);
            return;
        }
        const fetcher = new storageFetcher_1.StorageFetcher(api);
        try {
            const cwEvents = yield fetcher.fetch(offlineRange);
            // process events in sequence
            for (const cwEvent of cwEvents) {
                yield handleEventFn(cwEvent);
            }
        }
        catch (e) {
            log.error(`Unable to fetch events from storage: ${e.message}`);
        }
    });
    if (!skipCatchup) {
        yield pollMissedEventsFn();
    }
    else {
        log.info('Skipping event catchup on startup!');
    }
    try {
        log.info(`Subscribing to contracts ${chain}...`);
        yield subscriber.subscribe(processEventFn);
    }
    catch (e) {
        log.error(`Subscription error: ${e.message}`);
    }
    return subscriber;
});
exports.subscribeEvents = subscribeEvents;
//# sourceMappingURL=subscribeFunc.js.map