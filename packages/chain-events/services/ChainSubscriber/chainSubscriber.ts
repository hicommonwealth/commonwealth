import { factory, formatFilename } from 'common-common/src/logging';
import { Pool } from 'pg';
import _ from 'underscore';
import type { BrokerConfig } from 'rascal';
import { ChainBase, ChainNetwork } from 'common-common/src/types';
import {
  RascalPublications,
  getRabbitMQConfig,
} from 'common-common/src/rabbitmq';
import Rollbar from 'rollbar';
import fetch from 'node-fetch';
import { StatsDController } from 'common-common/src/statsd';

import { RabbitMqHandler } from '../ChainEventsConsumer/ChainEventHandlers';
import {
  CHAIN_EVENT_SERVICE_SECRET,
  CW_DATABASE_URI,
  CW_SERVER_URL,
  NUM_CHAIN_SUBSCRIBERS,
  RABBITMQ_URI,
  REPEAT_TIME,
  ROLLBAR_SERVER_TOKEN,
  CHAIN_SUBSCRIBER_INDEX, ROLLBAR_ENV,
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
let allChainsAndTokens;

// object used to keep track of listener error counts
let listenerErrorCounts: { [chain: string]: number } = {};
// an array of chain_ids that we will no longer create listeners for on every run
let bannedListeners: string[] = [];
// resets the error counts and banned listeners every 12 hours
setInterval(() => {
  listenerErrorCounts = {};
  bannedListeners = [];
}, 43200000);

export function handleFatalListenerError(
  chain_id: string,
  error: Error,
  rollbar?: Rollbar
): void {
  log.error(`Listener for ${chain_id} threw an error`, error);
  rollbar?.critical(`Listener for ${chain_id} threw an error`, error);

  if (listenerErrorCounts[chain_id]) listenerErrorCounts[chain_id] += 1;
  else listenerErrorCounts[chain_id] = 1;

  if (listenerErrorCounts[chain_id] > 5) bannedListeners.push(chain_id);
}

/**
 * This function manages all the chain listeners. It queries the database to get the most recent list of chains to
 * listen to and then creates, updates, or deletes the listeners.
 * @param producer {RabbitMqHandler} Used by the ChainEvents Listeners to push the messages to a queue
 * @param pool {Pool} Used by the function query the database
 * developing locally or when testing.
 * @param rollbar
 */
async function mainProcess(
  producer: RabbitMqHandler,
  pool: Pool,
  rollbar?: Rollbar
) {
  log.info('Starting scheduled process...');
  const activeListeners = getListenerNames(listenerInstances);
  if (activeListeners.length > 0) {
    log.info(`Active listeners: ${JSON.stringify(activeListeners)}`);
  } else {
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

    allChainsAndTokens = (await pool.query<ChainAttributes>(query)).rows;
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
      allChainsAndTokens = jsonRes.result;
    } catch (e) {
      log.error('Could not fetch chain-event service data', e);
      rollbar?.critical('Could not fetch chain-event service data', e);
      if (Array.isArray(allChainsAndTokens) && allChainsAndTokens.length > 0) {
        log.info(`Using cached chains: ${allChainsAndTokens}`);
      } else {
        log.info(`No cached chains. Retrying in ${REPEAT_TIME} minute(s)`);
        return;
      }
    }
  }

  const erc20Tokens = [];
  const erc721Tokens = [];
  const chains = []; // any listener that is not an erc20 or erc721 token and require independent listenerInstances
  for (const chain of allChainsAndTokens) {
    if (bannedListeners.includes(chain.id)) continue;

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

  for (const chain_id of bannedListeners) {
    StatsDController.get().increment('ce.banned-listeners', {
      chain: chain_id,
    });
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

export async function chainEventsSubscriberInitializer(): Promise<{
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
      setInterval(
        mainProcess,
        REPEAT_TIME * 60000,
        producerInstance,
        poolInstance,
        rollbarInstance
      );
    })
    .catch((err) => {
      log.error('Fatal error occurred', err);
      rollbarInstance?.critical('Fatal error occurred', err);
    });
}
