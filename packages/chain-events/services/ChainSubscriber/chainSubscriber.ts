import { factory, formatFilename } from 'common-common/src/logging';
import { Pool } from 'pg';
import _ from 'underscore';
import type { BrokerConfig } from 'rascal';
import { ChainBase, ChainNetwork } from 'common-common/src/types';
import { getRabbitMQConfig } from 'common-common/src/rabbitmq';
import { RascalPublications } from 'common-common/src/rabbitmq/types';
import Rollbar from 'rollbar';
import fetch from 'node-fetch';
import { StatsDController } from 'common-common/src/statsd';

import {
  IRabbitMqHandler,
  RabbitMqHandler,
} from '../ChainEventsConsumer/ChainEventHandlers';
import {
  CHAIN_EVENT_SERVICE_SECRET,
  CW_DATABASE_URI,
  CW_SERVER_URL,
  NUM_CHAIN_SUBSCRIBERS,
  RABBITMQ_URI,
  REPEAT_TIME,
  ROLLBAR_SERVER_TOKEN,
  CHAIN_SUBSCRIBER_INDEX,
  ROLLBAR_ENV,
} from '../config';

import {
  getListenerNames,
  manageErcListeners,
  manageRegularListeners,
} from './util';
import type { ChainAttributes, IListenerInstances } from './types';
import v8 from 'v8';

const log = factory.getLogger(formatFilename(__filename));

log.info(
  `Node Option max-old-space-size set to: ${JSON.stringify(
    v8.getHeapStatistics().heap_size_limit / 1000000000
  )} GB`
);

const listenerInstances: IListenerInstances = {};
let cachedChainsAndTokens;

/**
 * This function creates, updates, and deletes chain-event listeners based on the provided list of chainsAndTokens.
 */
export async function processChains(
  producer: IRabbitMqHandler,
  chainsAndTokens: ChainAttributes[],
  rollbar?: Rollbar
): Promise<IListenerInstances> {
  log.info('Starting scheduled process...');
  const activeListeners = getListenerNames(listenerInstances);
  if (activeListeners.length > 0) {
    log.info(`Active listeners: ${JSON.stringify(activeListeners)}`);
  } else {
    log.info('No active listeners');
  }

  const erc20Tokens = [];
  const erc721Tokens = [];
  const chains = []; // any listener that is not an erc20 or erc721 token and require independent listenerInstances
  for (const chain of chainsAndTokens) {
    StatsDController.get().increment('ce.should-exist-listeners', {
      chain: chain.id,
      network: chain.network,
      base: chain.base,
    });

    if (
      chain.network === ChainNetwork.ERC20 &&
      chain.base === ChainBase.Ethereum
    ) {
      erc20Tokens.push(chain);
    } else if (
      chain.network === ChainNetwork.ERC721 &&
      chain.base === ChainBase.Ethereum
    ) {
      erc721Tokens.push(chain);
    } else {
      chains.push(chain);
    }
  }

  // group the erc20s and erc721s by url so that we only create 1 listener/subscriber for each endpoint
  const erc20ByUrl = _.groupBy(erc20Tokens, (token) => token.ChainNode.url);
  const erc721ByUrl = _.groupBy(erc721Tokens, (token) => token.ChainNode.url);

  // this creates/updates/deletes a single listener in listenerInstances called 'erc20' or 'erc721' respectively
  await manageErcListeners(
    ChainNetwork.ERC20,
    erc20ByUrl,
    listenerInstances,
    producer,
    rollbar
  );
  await manageErcListeners(
    ChainNetwork.ERC721,
    erc721ByUrl,
    listenerInstances,
    producer,
    rollbar
  );

  await manageRegularListeners(chains, listenerInstances, producer, rollbar);

  for (const c of Object.keys(listenerInstances)) {
    if (await listenerInstances[c].isConnected())
      StatsDController.get().increment('ce.connection-active', { chain: c });
    else
      StatsDController.get().increment('ce.connection-inactive', { chain: c });

    StatsDController.get().increment('ce.existing-listeners', { chain: c });
  }

  log.info('Finished scheduled process.');

  return listenerInstances;
}

/**
 * Returns: an instance of RabbitMqHandler which sends events from the subscriber to the consumer, an instance of PG Pool
 * which is used to query the CW db directly, and an instance of rollbar for error reporting.
 */
export async function initSubscriberTools(): Promise<{
  rollbar: any;
  pool: any;
  producer: RabbitMqHandler;
}> {
  // begin process
  log.info('Initializing ChainEventsSubscriber');

  let rollbar;
  if (ROLLBAR_SERVER_TOKEN) {
    rollbar = new Rollbar({
      accessToken: ROLLBAR_SERVER_TOKEN,
      environment: ROLLBAR_ENV,
      captureUncaught: true,
      captureUnhandledRejections: true,
    });
  }

  let pool;
  // if CHAIN env var is set then we run the subscriber for only the specified chain
  // and we query the commonwealth db directly i.e. bypass the need to have the Commonwealth server running
  if (process.env.CHAIN) {
    pool = new Pool({
      connectionString: CW_DATABASE_URI,
      ssl:
        process.env.NODE_ENV !== 'production'
          ? false
          : {
              rejectUnauthorized: false,
            },
      max: 3,
    });

    pool.on('error', (err) => {
      log.error('Unexpected error on idle client', err);
    });
  }

  log.info(
    `Worker Number: ${CHAIN_SUBSCRIBER_INDEX}, Number of Workers: ${NUM_CHAIN_SUBSCRIBERS}`
  );

  const producer = new RabbitMqHandler(
    <BrokerConfig>getRabbitMQConfig(RABBITMQ_URI),
    RascalPublications.ChainEvents
  );
  try {
    await producer.init();
  } catch (e) {
    log.error('Fatal error occurred while starting the RabbitMQ producer', e);
    rollbar?.critical(
      'Fatal error occurred while starting the RabbitMQ producer',
      e
    );
  }

  return { producer, pool, rollbar };
}

/**
 * Retrieves the list of chains to listen to. There are 3 possible ways we can get the chains. Firstly, if the chain
 * object is provided by the user we return it. This is useful if you want to run a subscriber for a chain that does not
 * exist in the CW database. Secondly, provided the `CHAIN` env var we can query the CW DB directly. This is useful if you
 * want to run the subscriber for a chain that exists in the CW DB for testing (this method should never be used in
 * production). Lastly, we can request the chains we should listen to using the CW API. This is the preferred method of
 * operation in production.
 * @param pool
 * @param rollbar
 * @param chain
 */
export async function getSubscriberChainData(
  pool?: Pool,
  rollbar?: Rollbar,
  chain?: ChainAttributes
): Promise<ChainAttributes[]> {
  if (chain) {
    cachedChainsAndTokens = [chain];
    return cachedChainsAndTokens;
  } else if (process.env.CHAIN) {
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

    cachedChainsAndTokens = (await pool.query<ChainAttributes>(query)).rows;
    return cachedChainsAndTokens;
  } else {
    try {
      const url = new URL(`${CW_SERVER_URL}/api/getChainEventServiceData`);
      log.info(`Fetching CE data from CW at ${url}`);
      const data = {
        secret: CHAIN_EVENT_SERVICE_SECRET,
        num_chain_subscribers: NUM_CHAIN_SUBSCRIBERS,
        chain_subscriber_index: CHAIN_SUBSCRIBER_INDEX,
      };
      const res = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok)
        throw new Error(`HTTP Error Response: ${res.status} ${res.statusText}`);

      const jsonRes = await res.json();
      log.info(`Fetched chain-event service data: ${JSON.stringify(jsonRes)}`);
      if (jsonRes?.status >= 400) {
        throw new Error(jsonRes.error);
      }
      cachedChainsAndTokens = jsonRes.result;
      return cachedChainsAndTokens;
    } catch (e) {
      log.error('Could not fetch chain-event service data', e);
      rollbar?.critical('Could not fetch chain-event service data', e);
      if (
        Array.isArray(cachedChainsAndTokens) &&
        cachedChainsAndTokens.length > 0
      ) {
        log.info(`Using cached chains: ${cachedChainsAndTokens}`);
        return cachedChainsAndTokens;
      } else {
        log.info(`No cached chains. Retrying in ${REPEAT_TIME} minute(s)`);
        return;
      }
    }
  }
}

/**
 * Retrieves and processes the chains we need to be listening to. This function is especially useful for testing since
 * we can pass a fully populated chain object that may not exist in the database.
 */
export async function runSubscriberAsFunction(
  producer: IRabbitMqHandler,
  chain: ChainAttributes
) {
  const chains = await getSubscriberChainData(null, null, chain);
  return await processChains(producer, chains, null);
}

/**
 * Wrapper around runSubscriberAsFunction that always initializes pool and rollbar and runs runSubscriberAsFunction
 * at set intervals ([REPEAT_TIME] seconds). This function is used to run the subscriber in production from the Procfile
 * and also locally using the yarn commands.
 */
export async function runSubscriberAsServer() {
  let producer, pool, rollbar;
  try {
    ({ producer, pool, rollbar } = await initSubscriberTools());
    setInterval(
      runSubscriberAsFunction,
      REPEAT_TIME * 60000,
      producer,
      pool,
      rollbar
    );
  } catch (e) {
    log.error('Fatal error occurred', e);
    rollbar.critical('Fatal error occurred', e);
  }
}

export async function shutdownSubscriber() {
  log.info('Shutting down subscriber');
  Object.values(listenerInstances).forEach((listener) => {
    listener.unsubscribe();
  });
}

// Used in the Heroku Procfile + `yarn` commands -> only tests should bypass this
if (require.main === module) {
  runSubscriberAsServer();
}
