"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chainEventsSubscriberInitializer = exports.handleFatalListenerError = void 0;
const pg_1 = require("pg");
const underscore_1 = __importDefault(require("underscore"));
const types_1 = require("../../../common-common/src/types");
const rabbitmq_1 = require("../../../common-common/src/rabbitmq");
const ChainEventHandlers_1 = require("../ChainEventsConsumer/ChainEventHandlers");
const logging_1 = require("../../../common-common/src/logging");
const config_1 = require("../config");
const util_1 = require("./util");
const rollbar_1 = __importDefault(require("rollbar"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const statsd_1 = require("../../../common-common/src/statsd");
const log = logging_1.factory.getLogger((0, logging_1.formatFilename)(__filename));
const listenerInstances = {};
let allChainsAndTokens;
// object used to keep track of listener error counts
let listenerErrorCounts = {};
// an array of chain_ids that we will no longer create listeners for on every run
let bannedListeners = [];
// resets the error counts and banned listeners every 12 hours
setInterval(() => {
    listenerErrorCounts = {};
    bannedListeners = [];
}, 43200000);
function handleFatalListenerError(chain_id, error, rollbar) {
    log.error(`Listener for ${chain_id} threw an error`, error);
    rollbar?.critical(`Listener for ${chain_id} threw an error`, error);
    if (listenerErrorCounts[chain_id])
        listenerErrorCounts[chain_id] += 1;
    else
        listenerErrorCounts[chain_id] = 1;
    if (listenerErrorCounts[chain_id] > 5)
        bannedListeners.push(chain_id);
}
exports.handleFatalListenerError = handleFatalListenerError;
/**
 * This function manages all the chain listeners. It queries the database to get the most recent list of chains to
 * listen to and then creates, updates, or deletes the listeners.
 * @param producer {RabbitMqHandler} Used by the ChainEvents Listeners to push the messages to a queue
 * @param pool {Pool} Used by the function query the database
 * developing locally or when testing.
 * @param rollbar
 */
async function mainProcess(producer, pool, rollbar) {
    log.info('Starting scheduled process...');
    const activeListeners = (0, util_1.getListenerNames)(listenerInstances);
    if (activeListeners.length > 0) {
        log.info(`Active listeners: ${JSON.stringify(activeListeners)}`);
    }
    else {
        log.info('No active listeners');
    }
    if (process.env.CHAIN) {
        const selectedChain = process.env.CHAIN;
        // gets the data needed to start a single listener for the chain specified by the CHAIN environment variable
        // this query will ignore all network types, token types, contract types, as well has_chain_events_listener
        // use this ONLY if you know what you are doing (must be a compatible chain)
        const query = `
        SELECT C.id,
               C.substrate_spec,
               C2.address                                                              as contract_address,
               C.network,
               C.base,
               C.ce_verbose                                                            as verbose_logging,
               JSON_BUILD_OBJECT('id', CN.id, 'url', COALESCE(CN.private_url, CN.url)) as "ChainNode"
        FROM "Chains" C
                 JOIN "ChainNodes" CN on C.chain_node_id = CN.id
                 LEFT JOIN "CommunityContracts" CC on C.id = CC.chain_id
                 LEFT JOIN "Contracts" C2 on CC.contract_id = C2.id
        WHERE C.id = '${selectedChain}';
    `;
        allChainsAndTokens = (await pool.query(query)).rows;
    }
    else {
        try {
            const url = new URL(`${config_1.CW_SERVER_URL}/api/getChainEventServiceData`);
            log.info(`Fetching CE data from CW at ${url}`);
            const data = {
                secret: config_1.CHAIN_EVENT_SERVICE_SECRET,
                num_chain_subscribers: config_1.NUM_CHAIN_SUBSCRIBERS,
                chain_subscriber_index: config_1.CHAIN_SUBSCRIBER_INDEX
            };
            const res = await (0, node_fetch_1.default)(url, {
                method: 'POST',
                body: JSON.stringify(data),
                headers: { 'Content-Type': 'application/json' }
            });
            if (!res.ok)
                throw new Error(`HTTP Error Response: ${res.status} ${res.statusText}`);
            const jsonRes = await res.json();
            log.info(`Fetched chain-event service data: ${JSON.stringify(jsonRes)}`);
            if (jsonRes?.status >= 400) {
                throw new Error(jsonRes.error);
            }
            allChainsAndTokens = jsonRes.result;
        }
        catch (e) {
            log.error('Could not fetch chain-event service data', e);
            rollbar?.critical('Could not fetch chain-event service data', e);
            if (Array.isArray(allChainsAndTokens) && allChainsAndTokens.length > 0) {
                log.info(`Using cached chains: ${allChainsAndTokens}`);
            }
            else {
                log.info(`No cached chains. Retrying in ${config_1.REPEAT_TIME} minute(s)`);
                return;
            }
        }
    }
    const erc20Tokens = [];
    const erc721Tokens = [];
    const chains = []; // any listener that is not an erc20 or erc721 token and require independent listenerInstances
    for (const chain of allChainsAndTokens) {
        if (bannedListeners.includes(chain.id))
            continue;
        statsd_1.StatsDController.get().increment('ce.should-exist-listeners', { chain: chain.id, network: chain.network, base: chain.base });
        if (chain.network === types_1.ChainNetwork.ERC20 &&
            chain.base === types_1.ChainBase.Ethereum) {
            erc20Tokens.push(chain);
        }
        else if (chain.network === types_1.ChainNetwork.ERC721 &&
            chain.base === types_1.ChainBase.Ethereum) {
            erc721Tokens.push(chain);
        }
        else {
            chains.push(chain);
        }
    }
    // group the erc20s and erc721s by url so that we only create 1 listener/subscriber for each endpoint
    const erc20ByUrl = underscore_1.default.groupBy(erc20Tokens, (token) => token.ChainNode.url);
    const erc721ByUrl = underscore_1.default.groupBy(erc721Tokens, (token) => token.ChainNode.url);
    // this creates/updates/deletes a single listener in listenerInstances called 'erc20' or 'erc721' respectively
    await (0, util_1.manageErcListeners)(types_1.ChainNetwork.ERC20, erc20ByUrl, listenerInstances, producer, rollbar);
    await (0, util_1.manageErcListeners)(types_1.ChainNetwork.ERC721, erc721ByUrl, listenerInstances, producer, rollbar);
    await (0, util_1.manageRegularListeners)(chains, listenerInstances, producer, rollbar);
    for (const c of Object.keys(listenerInstances)) {
        if (await listenerInstances[c].isConnected())
            statsd_1.StatsDController.get().increment('ce.connection-active', { chain: c });
        else
            statsd_1.StatsDController.get().increment('ce.connection-inactive', { chain: c });
        statsd_1.StatsDController.get().increment('ce.existing-listeners', { chain: c });
    }
    for (const chain_id of bannedListeners) {
        statsd_1.StatsDController.get().increment('ce.banned-listeners', { chain: chain_id });
    }
    log.info('Finished scheduled process.');
    if (process.env.TESTING) {
        const listenerOptions = {};
        for (const chain of Object.keys(listenerInstances)) {
            listenerOptions[chain] = listenerInstances[chain].options;
        }
        log.info(`Listener Validation:${JSON.stringify(listenerOptions)}`);
    }
}
async function chainEventsSubscriberInitializer() {
    // begin process
    log.info('Initializing ChainEventsSubscriber');
    let rollbar;
    if (config_1.ROLLBAR_SERVER_TOKEN) {
        rollbar = new rollbar_1.default({
            accessToken: config_1.ROLLBAR_SERVER_TOKEN,
            environment: process.env.NODE_ENV,
            captureUncaught: true,
            captureUnhandledRejections: true,
        });
    }
    let pool;
    // if CHAIN env var is set then we run the subscriber for only the specified chain
    // and we query the commonwealth db directly i.e. bypass the need to have the Commonwealth server running
    if (process.env.CHAIN) {
        pool = new pg_1.Pool({
            connectionString: config_1.CW_DATABASE_URI,
            ssl: process.env.NODE_ENV !== 'production'
                ? false
                : {
                    rejectUnauthorized: false,
                },
            max: 3,
        });
        pool.on('error', (err, client) => {
            log.error('Unexpected error on idle client', err);
        });
    }
    log.info(`Worker Number: ${config_1.CHAIN_SUBSCRIBER_INDEX}, Number of Workers: ${config_1.NUM_CHAIN_SUBSCRIBERS}`);
    const producer = new ChainEventHandlers_1.RabbitMqHandler((0, rabbitmq_1.getRabbitMQConfig)(config_1.RABBITMQ_URI), rabbitmq_1.RascalPublications.ChainEvents);
    try {
        await producer.init();
    }
    catch (e) {
        log.error('Fatal error occurred while starting the RabbitMQ producer', e);
        rollbar?.critical('Fatal error occurred while starting the RabbitMQ producer', e);
    }
    return { producer, pool, rollbar };
}
exports.chainEventsSubscriberInitializer = chainEventsSubscriberInitializer;
if (process.argv[2] === 'run-as-script') {
    let producerInstance, poolInstance, rollbarInstance;
    chainEventsSubscriberInitializer()
        .then(({ producer, pool, rollbar }) => {
        producerInstance = producer;
        poolInstance = pool;
        rollbarInstance = rollbar;
        return mainProcess(producer, pool, rollbar);
    })
        .then(() => {
        // re-run this function every [REPEAT_TIME] minutes
        setInterval(mainProcess, config_1.REPEAT_TIME * 60000, producerInstance, poolInstance, rollbarInstance);
    })
        .catch((err) => {
        log.error('Fatal error occurred', err);
        rollbarInstance?.critical('Fatal error occurred', err);
    });
}
