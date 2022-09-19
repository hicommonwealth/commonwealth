import { Pool } from 'pg';
import _ from 'underscore';
import { BrokerConfig } from 'rascal';
import { ChainBase, ChainNetwork } from 'common-common/src/types';
import { RascalPublications, getRabbitMQConfig } from 'common-common/src/rabbitmq';
import { RabbitMqHandler } from '../ChainEventsConsumer/ChainEventHandlers/rabbitMQ';
import { factory, formatFilename } from 'common-common/src/logging';
import {
  DATABASE_URI,
  NUM_WORKERS,
  RABBITMQ_URI,
  REPEAT_TIME,
  ROLLBAR_SERVER_TOKEN,
  WORKER_NUMBER,
} from '../config';
import {
  getListenerNames,
  manageErcListeners,
  manageRegularListeners,
} from './util';
import { IListenerInstances } from './types';
import Rollbar from 'rollbar';
import models from '../database/database';
import { QueryTypes } from 'sequelize';

const log = factory.getLogger(formatFilename(__filename));

const listenerInstances: IListenerInstances = {};
let pool: Pool;
let producer: RabbitMqHandler;
let rollbar: Rollbar;

/**
 * This function manages all the chain listeners. It queries the database to get the most recent list of chains to
 * listen to and then creates, updates, or deletes the listeners.
 * @param producer {RabbitMqHandler} Used by the ChainEvents Listeners to push the messages to a queue
 * @param pool {Pool} Used by the function query the database
 */
async function mainProcess(
  producer: RabbitMqHandler,
  pool: Pool,
) {
  // TODO: post this data somewhere?
  log.info("Starting scheduled process...")
  const activeListeners = getListenerNames(listenerInstances);
  if (activeListeners.length > 0) {
    log.info(`Active listeners: ${JSON.stringify(activeListeners)}`);
  } else {
    log.info("No active listeners");
  }


  // selects the chain data needed to create the listeners for the current chainSubscriber
  const allChainsAndTokens: any = await models.sequelize.query(`
      WITH allChains AS (
          SELECT *, ROW_NUMBER() OVER (ORDER BY id) AS index FROM "Chains" WHERE active = True
      ) SELECT allChains.id,
               allChains.substrate_spec,
               allChains.contract_address,
               allChains.network,
               allChains.base,
               allChains.verbose_logging,
               JSON_BUILD_OBJECT('id', "ChainNodes".id, 'url', "ChainNodes".url) as "ChainNode"
      FROM allChains
               JOIN "ChainNodes" ON allChains.chain_node_id = "ChainNodes".id
      WHERE MOD(allChains.index, ?) = ?;
  `, { replacements: [NUM_WORKERS, WORKER_NUMBER], raw: true, type: QueryTypes.SELECT });

  const erc20Tokens = [];
  const erc721Tokens = [];
  const chains = []; // any listener that is not an erc20 or erc721 token and require independent listenerInstances
  for (const chain of allChainsAndTokens) {
    if (chain.network === ChainNetwork.ERC20 && chain.base === ChainBase.Ethereum) {
      erc20Tokens.push(chain);
    } else if (chain.network === ChainNetwork.ERC721 && chain.base === ChainBase.Ethereum) {
      erc721Tokens.push(chain);
    } else {
      chains.push(chain);
    }
  }

  // group the erc20s and erc721s by url so that we only create 1 listener/subscriber for each endpoint
  const erc20ByUrl = _.groupBy(erc20Tokens, (token) => token.ChainNode.url);
  const erc721ByUrl = _.groupBy(erc721Tokens, (token) => token.ChainNode.url);

  // this creates/updates/deletes a single listener in listenerInstances called 'erc20' or 'erc721' respectively
  await manageErcListeners(ChainNetwork.ERC20, erc20ByUrl, listenerInstances, producer, rollbar);
  await manageErcListeners(ChainNetwork.ERC721, erc721ByUrl, listenerInstances, producer, rollbar);

  await manageRegularListeners(chains, listenerInstances, pool, producer, rollbar);

  log.info('Finished scheduled process.');
  if (process.env.TESTING) {
    const listenerOptions = {};
    for (const chain of Object.keys(listenerInstances)) {
      listenerOptions[chain] = listenerInstances[chain].options;
    }
    log.info(`Listener Validation:${JSON.stringify(listenerOptions)}`);
  }
}

async function initializer(): Promise<void> {
  // begin process
  log.info('Initializing ChainEventsSubscriber');

  rollbar = new Rollbar({
    accessToken: ROLLBAR_SERVER_TOKEN,
    environment: process.env.NODE_ENV,
    captureUncaught: true,
    captureUnhandledRejections: true,
  });

  // setup sql client pool
  pool = new Pool({
    connectionString: DATABASE_URI,
    ssl: process.env.NODE_ENV !== 'production' ? false : {
      rejectUnauthorized: false,
    },
    max: 3,
  });

  pool.on('error', (err, client) => {
    log.error('Unexpected error on idle client', err);
  });

  log.info(`Worker Number: ${WORKER_NUMBER}, Number of Workers: ${NUM_WORKERS}`);

  producer = new RabbitMqHandler(<BrokerConfig>getRabbitMQConfig(RABBITMQ_URI), RascalPublications.ChainEvents);
  try {
    await producer.init();
  } catch (e) {
    log.error("Fatal error occurred while starting the RabbitMQ producer", e);
    rollbar.critical("Fatal error occurred while starting the RabbitMQ producer", e);
  }
}

initializer()
  .then(() => {
    return mainProcess(producer, pool);
  })
  .then(() => {
    // re-run this function every [REPEAT_TIME] minutes
    setInterval(
      mainProcess,
      REPEAT_TIME * 60000,
      producer,
      pool,
    );
  })
  .catch((err) => {
    log.error("Fatal error occurred", err);
    rollbar?.critical("Fatal error occurred", err);
  });
