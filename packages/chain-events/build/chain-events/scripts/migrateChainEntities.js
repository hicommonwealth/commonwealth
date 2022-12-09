"use strict";
/**
 * This script "migrates" chain entities (proposals) from the chain into the database, by first
 * querying events, and then attempting to fetch corresponding entities
 * from the chain, writing the results back into the database.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runEntityMigrations = void 0;
const types_1 = require("../../common-common/src/types");
const logging_1 = require("../../common-common/src/logging");
const src_1 = require("../src");
const database_1 = __importDefault(require("../services/database/database"));
const migration_1 = __importDefault(require("../services/ChainEventsConsumer/ChainEventHandlers/migration"));
const entityArchival_1 = __importDefault(require("../services/ChainEventsConsumer/ChainEventHandlers/entityArchival"));
const substrate_1 = require("../../commonwealth/shared/substrate");
const config_1 = require("../../commonwealth/server/config");
const rabbitmq_1 = require("../../common-common/src/rabbitmq");
const node_fetch_1 = __importDefault(require("node-fetch"));
const config_2 = require("../services/config");
const log = logging_1.factory.getLogger((0, logging_1.formatFilename)(__filename));
const CHAIN_ID = process.env.CHAIN_ID;
class HTTPResponseError extends Error {
    response;
    constructor(response) {
        super(`HTTP Error Response: ${response.status} ${response.statusText}`);
        this.response = response;
    }
}
async function fetchData(url, data) {
    try {
        const res = await (0, node_fetch_1.default)(url, {
            method: 'POST',
            body: JSON.stringify({ secret: config_2.CHAIN_EVENT_SERVICE_SECRET, ...data }),
            headers: { 'Content-Type': 'application/json' }
        });
        if (res.ok)
            return (await res.json()).result;
        throw new HTTPResponseError(res);
    }
    catch (e) {
        log.error(`Fetch to ${url} with data ${JSON.stringify(data)} failed.`);
        console.error(e);
        throw e;
    }
}
async function migrateChainEntity(chain, rmqController) {
    // 1. fetch the node and url of supported/selected chains
    log.info(`Fetching node info for ${chain}...`);
    if (!chain) {
        throw new Error('must provide chain');
    }
    // query one node for each supported chain
    const chainInstance = await fetchData(`${config_2.CW_SERVER_URL}/api/getChain`, { chain_id: chain });
    if (!chainInstance) {
        throw new Error('no chain found for chain entity migration');
    }
    const node = await fetchData(`${config_2.CW_SERVER_URL}/api/getChainNode`, { chain_node_id: chainInstance.chain_node_id });
    if (!node) {
        throw new Error('no nodes found for chain entity migration');
    }
    // 2. for each node, fetch and migrate chain entities
    log.info(`Fetching and migrating chain entities for: ${chain}`);
    try {
        const migrationHandler = new migration_1.default(database_1.default, rmqController, chain);
        const entityArchivalHandler = new entityArchival_1.default(database_1.default, rmqController, chain);
        let fetcher;
        const range = { startBlock: 0 };
        if (chainInstance.base === types_1.ChainBase.Substrate) {
            const nodeUrl = (0, substrate_1.constructSubstrateUrl)(node.private_url || node.url);
            console.log(chainInstance.substrate_spec);
            const api = await src_1.SubstrateEvents.createApi(nodeUrl, chainInstance.substrate_spec);
            fetcher = new src_1.SubstrateEvents.StorageFetcher(api);
        }
        else if (chainInstance.base === types_1.ChainBase.CosmosSDK) {
            const api = await src_1.CosmosEvents.createApi(node.private_url || node.url);
            fetcher = new src_1.CosmosEvents.StorageFetcher(api);
        }
        else if (chainInstance.network === types_1.ChainNetwork.Moloch) {
            // TODO: determine moloch API version
            // TODO: construct dater
            throw new Error('Moloch migration not yet implemented.');
        }
        else if (chainInstance.network === types_1.ChainNetwork.Compound) {
            const contracts = await fetchData(`${config_2.CW_SERVER_URL}/api/getChainContracts`, { chain_id: chain });
            const api = await src_1.CompoundEvents.createApi(contracts[0].ChainNode.private_url || contracts[0].ChainNode.url, contracts[0].address);
            fetcher = new src_1.CompoundEvents.StorageFetcher(api);
            range.startBlock = 0;
        }
        else if (chainInstance.network === types_1.ChainNetwork.Aave) {
            const contracts = await fetchData(`${config_2.CW_SERVER_URL}/api/getChainContracts`, { chain_id: chain });
            const api = await src_1.AaveEvents.createApi(contracts[0].ChainNode.private_url || contracts[0].ChainNode.url, contracts[0].address);
            fetcher = new src_1.AaveEvents.StorageFetcher(api);
            range.startBlock = 0;
        }
        else {
            throw new Error('Unsupported migration chain');
        }
        log.info('Fetching chain events...');
        const events = await fetcher.fetch(range, true);
        events.sort((a, b) => a.blockNumber - b.blockNumber);
        log.info(`Writing chain events to db... (count: ${events.length})`);
        for (const event of events) {
            try {
                // eslint-disable-next-line no-await-in-loop
                const dbEvent = await migrationHandler.handle(event);
                await entityArchivalHandler.handle(event, dbEvent);
            }
            catch (e) {
                log.error(`Event handle failure: ${e.message}`);
            }
        }
    }
    catch (e) {
        log.error(`Failed to fetch events for ${chain}: ${e.message}`);
    }
}
async function migrateChainEntities(rmqController) {
    const chains = await fetchData(`${config_2.CW_SERVER_URL}/api/getSubscribedChains`, {});
    for (const { id } of chains) {
        await migrateChainEntity(id, rmqController);
    }
}
async function runEntityMigrations(chainId) {
    // "all" means run for all supported chains, otherwise we pass in the name of
    // the specific chain to migrate
    log.info('Started migrating chain entities into the DB');
    let rmqController;
    try {
        rmqController = new rabbitmq_1.RabbitMQController((0, rabbitmq_1.getRabbitMQConfig)(config_1.RABBITMQ_URI));
        await rmqController.init();
    }
    catch (e) {
        log.error('Rascal consumer setup failed. Please check the Rascal configuration');
        // if rabbitmq fails the script should not continue
        process.exit(1);
    }
    try {
        if (CHAIN_ID || chainId)
            await migrateChainEntity(CHAIN_ID || chainId, rmqController);
        else
            await migrateChainEntities(rmqController);
        log.info('Finished migrating chain entities into the DB');
        process.exit(0);
    }
    catch (e) {
        console.error('Failed migrating chain entities into the DB: ', e.message);
        process.exit(1);
    }
}
exports.runEntityMigrations = runEntityMigrations;
if (process.argv[2] === 'run-as-script') {
    runEntityMigrations(process.argv[3]);
}
