/* eslint-disable no-continue */
import fetch from 'node-fetch';
import { Pool } from 'pg';
import _ from 'underscore';
import format from 'pg-format';
import {
  createListener,
  SubstrateTypes,
  SubstrateEvents,
  IEventHandler,
  CWEvent,
  LoggingHandler,
  SupportedNetwork,
} from 'chain-events/src';

import { BrokerConfig } from 'rascal';
import { ChainBase, ChainNetwork, ChainType } from 'common-common/src/types';
import { addPrefix, factory, formatFilename } from 'common-common/src/logging';
import { RabbitMqHandler } from '../eventHandlers/rabbitMQ';
import { DATABASE_URI } from '../config';
import RabbitMQConfig from '../util/rabbitmq/RabbitMQConfig';

const log = factory.getLogger(formatFilename(__filename));

// TODO: RollBar error reporting

// The number of minutes to wait between each run -- rounded to the nearest whole number
const REPEAT_TIME = Math.round(Number(process.env.REPEAT_TIME)) || 1;

// counts the number of errors occurring for each chain
// - resets every 24 hours (to remove any temporary connection errors)
// this is only meant to stop a chain from repeatedly causing errors every REPEAT_TIME
let chainErrors: { [chain: string]: number } = {};

// counts the number of mainProcess runs
let runCount = 0;

// stores all the listeners a dbNode has active
const listeners: { [key: string]: any } = {};

const generalLogger = new LoggingHandler();

// any fatal error is handle through here
async function handleFatalError(
  error: Error,
  pool,
  chain?: string,
  type?: string
): Promise<void> {
  switch (type) {
    case 'rabbitmq':
      log.error(`Rascal broker setup failed. Check the Rascal configuration file for errors.\n${error.stack}`);
      // TODO: shutdown dyno with heroku api
      process.exit(1);
      break;
    default:
      log.error(`${chain ? `[${chain}]: ` : ''} ${error.message}`);

      if (chain && chain.indexOf('erc20') === -1 && chainErrors[chain] >= 4) {
        listeners[chain].unsubscribe();
        delete listeners[chain];

        // TODO: email notification for this
        const query = format(
          'UPDATE "Chains" SET "has_chain_events_listener"=\'false\' WHERE "id"=%L',
          chain
        );
        try {
          pool.query(query);
        } catch (err) {
          log.fatal(`Unable to disable ${chain}`);
        }
      } else if (chain) ++chainErrors[chain];
      break;
  }
}

class ErcLoggingHandler extends IEventHandler {
  private logger = {}
  constructor(public network: ChainNetwork, public tokenNames: string[]) {
    super();
  }
  public async handle(event: CWEvent): Promise<undefined> {
    if (this.tokenNames.includes(event.chain)) {
      // if logger for this specific token doesn't exist, create it - decreases computational cost of logging
      if (!this.logger[event.chain])
        this.logger[event.chain] =
          factory.getLogger(addPrefix(__filename, [`Erc${this.network.slice(3)}`, event.chain]));

      this.logger[event.chain].info(`Received event: ${JSON.stringify(event, null, 2)}`);
    }
    return null;
  }
}

// the function that executes every REPEAT_TIME
async function mainProcess(
  producer: RabbitMqHandler,
  erc20Logger: ErcLoggingHandler,
  erc721Logger: ErcLoggingHandler,
  pool: Pool,
  workerNumber: number,
  numWorkers: number
) {
  // reset the chainError counts at the end of every day
  if (runCount > 1440 / REPEAT_TIME) {
    runCount = 1;
    chainErrors = {};
  } else {
    ++runCount;
  }

  const activeChains: string[] = Object.keys(listeners).map((listenerName): string => {
    if (!listenerName.startsWith(ChainNetwork.ERC20) &&
      !listenerName.startsWith(ChainNetwork.ERC721)) return listenerName;
    else {
      return listeners[listenerName].options.tokenNames;
    }
  });
  if (activeChains.length > 0)
    log.info(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      `Starting scheduled process. Active chains: ${JSON.stringify(activeChains.flat())}`
    );

  let query =`
  SELECT
    c."id",
    c."substrate_spec",
    cn."url",
    cn."private_url",
    con.address as "address",
    c."base",
    c."type",
    c."network",
    c."ce_verbose"
  FROM "Chains" c 
    JOIN "ChainNodes" cn
      ON c.chain_node_id = cn.id
    LEFT JOIN "CommunityContracts" cc
      ON cc.chain_id = c.id
    LEFT JOIN "Contracts" con
      ON con.id = cc.contract_id
  WHERE c."has_chain_events_listener" = true;`
  //   AND (con.type IN ('marlin-testnet', 'aave', 'compound') OR
  //     (c.base = 'substrate' AND c.type ='chain'));
  // `;
  const allChains = (await pool.query(query)).rows;

  // gets the chains specific to this node
  let myChainData = allChains.filter(
    (chain, index) => index % numWorkers === workerNumber
  );

  // passed to listeners that support it
  const discoverReconnectRange = async (chain: string) => {
    let latestBlock;
    try {
      // eslint-disable-next-line max-len
      const eventTypes = (
        await pool.query(
          format('SELECT "id" FROM "ChainEventTypes" WHERE "chain"=%L', chain)
        )
      ).rows.map((obj) => obj.id);
      if (eventTypes.length === 0) {
        log.info(
          `[${chain}]: No events in database to get last block number from`
        );
        return { startBlock: null };
      }
      // eslint-disable-next-line max-len
      latestBlock = (
        await pool.query(
          format(
            'SELECT MAX("block_number") FROM "ChainEvents" WHERE "chain_event_type_id" IN (%L)',
            eventTypes
          )
        )
      ).rows;
    } catch (error) {
      log.warn(
        `[${chain}]: An error occurred while discovering offline time range`,
        error
      );
    }
    if (
      latestBlock &&
      latestBlock.length > 0 &&
      latestBlock[0] &&
      latestBlock[0].max
    ) {
      const lastEventBlockNumber = latestBlock[0].max;
      log.info(
        `[${chain}]: Discovered chain event in db at block ${lastEventBlockNumber}.`
      );
      return { startBlock: lastEventBlockNumber + 1 };
    } else {
      return { startBlock: null };
    }
  };

  // group erc20 and erc721 tokens together by URL in order to minimize number of listeners
  const erc20Tokens = myChainData.filter(
    (chain) =>
      chain.network === ChainNetwork.ERC20 && chain.type === ChainType.Token && chain.base === ChainBase.Ethereum
  ).map((chain) => {
    // replace url with private_url if available
    chain.url = chain.private_url || chain.url;
    return chain;
  });

  const erc721Tokens = myChainData.filter(
    (chain) =>
      chain.network === ChainNetwork.ERC721 && chain.type === ChainType.Token && chain.base === ChainBase.Ethereum
  ).map((chain) => {
    // replace url with private_url if available
    chain.url = chain.private_url || chain.url;
    return chain;
  });

  const erc20ByUrl = _.groupBy(erc20Tokens, 'url');
  const erc721ByUrl = _.groupBy(erc721Tokens, 'url');

  async function createErcListener(network: ChainNetwork,
    groupedTokens: _.Dictionary<any[]>, logger: ErcLoggingHandler) {

    for (const [url, tokens] of Object.entries(groupedTokens)) {
      const tokenKey = `${network}_${url}`;
      const ercTokenAddresses = tokens.map((chain) => chain.address);
      const ercTokenNames = tokens.map((chain) => chain.id);

      let supportedNetwork: SupportedNetwork;
      switch(network) {
        case ChainNetwork.ERC20:
          supportedNetwork = SupportedNetwork.ERC20;
          break;
        case ChainNetwork.ERC721:
          supportedNetwork = SupportedNetwork.ERC721;
          break;
        default:
          break;
      }

      // update the names of the tokens whose events should be logged by the ercLoggers
      logger.tokenNames = tokens
        .filter((chain) => chain.ce_verbose)
        .map((chain) => chain.id);

      // don't start a new erc20 listener if it is causing errors
      if (!chainErrors[tokenKey] || chainErrors[tokenKey] < 4) {
        // start a listener if: it doesn't exist yet OR it exists but the tokens have changed
        if (
          tokens.length > 0 &&
          (!listeners[tokenKey] ||
            (listeners[tokenKey] &&
              !_.isEqual(
                ercTokenAddresses,
                listeners[tokenKey].options.tokenAddresses
              )))
        ) {
          // clear the listener if it already exists and the tokens have changed
          if (listeners[tokenKey]) {
            listeners[tokenKey].unsubscribe();
            delete listeners[tokenKey];
          }

          // start a listener
          log.info(`Starting listener for ${ercTokenNames}...`);
          try {
            listeners[tokenKey] = await createListener(
              network,
              supportedNetwork,
              {
                url,
                tokenAddresses: ercTokenAddresses,
                tokenNames: ercTokenNames,
                verbose: false,
              }
            );

            // add the rabbitmq handler for this chain
            listeners[tokenKey].eventHandlers['rabbitmq'] = { handler: producer };
            listeners[tokenKey].eventHandlers['logger'] = { handler: logger };
          } catch (error) {
            delete listeners[tokenKey];
            await handleFatalError(error, pool, tokenKey, 'listener-startup');
          }

          // if listener has started at this point then subscribe
          if (listeners[tokenKey]) {
            try {
              // subscribe to the chain to begin listening for events
              await listeners[tokenKey].subscribe();
            } catch (error) {
              await handleFatalError(error, pool, tokenKey, 'listener-subscribe');
            }
          }
        } else if (listeners[tokenKey] && tokens.length === 0) {
          // delete the listener if there are no tokens to listen to
          log.info(`[${tokenKey}]: Deleting ${network} listener...`);
          listeners[tokenKey].unsubscribe();
          delete listeners[tokenKey];
        }
      } else {
        log.fatal(
          `[${tokenKey}]: There are outstanding errors that need to be resolved
            before creating a new ${network} listener!`
        );
      }
    }
  }

  createErcListener(ChainNetwork.ERC20, erc20ByUrl, erc20Logger);
  createErcListener(ChainNetwork.ERC721, erc721ByUrl, erc721Logger);

  // remove erc tokens from myChainData
  myChainData = myChainData.filter(
    (chain) =>
      chain.type !== ChainType.Token || chain.base !== ChainBase.Ethereum
  );

  // delete listeners for chains that are no longer assigned to this node (skip erc20 and erc721)
  const myChains = myChainData.map((row) => row.id);
  Object.keys(listeners).forEach((chain) => {
    if (!myChains.includes(chain) && !chain.startsWith(ChainNetwork.ERC20) && !chain.startsWith(ChainNetwork.ERC721)) {
      log.info(`[${chain}]: Deleting chain...`);
      if (listeners[chain]) listeners[chain].unsubscribe();
      delete listeners[chain];
    }
  });

  // initialize listeners first (before dealing with identity)
  for (const chain of myChainData) {
    // start listeners that aren't already created or subscribed - this means for any duplicate chain nodes
    // it will start a listener for the first successful chain node url in the db
    if (!listeners[chain.id] || !listeners[chain.id].subscribed) {
      log.info(`Starting listener for ${chain.id}...`);

      // base is used to override built-in event chains in chain-events - only used for substrate chains in this case
      // NOTE: All erc20 tokens (type='token' base='ethereum') are removed at this point
      let network: SupportedNetwork;
      if (chain.base === ChainBase.Substrate)
        network = SupportedNetwork.Substrate;
      else if (chain.network === ChainNetwork.Compound)
        network = SupportedNetwork.Compound;
      else if (chain.network === ChainNetwork.Aave)
        network = SupportedNetwork.Aave;
      else if (chain.network === ChainNetwork.Moloch)
        network = SupportedNetwork.Moloch;

      try {
        listeners[chain.id] = await createListener(chain.id, network, {
          address: chain.address,
          archival: false,
          url: chain.private_url || chain.url,
          spec: chain.substrate_spec,
          skipCatchup: false,
          verbose: false, // using this will print event before chain is added to it
          enricherConfig: { balanceTransferThresholdPermill: 10_000 },
          discoverReconnectRange
        });
      } catch (error) {
        delete listeners[chain.id];
        await handleFatalError(error, pool, chain.id, 'listener-startup');
        continue;
      }

      // if chain is a substrate chain add the excluded events
      let excludedEvents = [];
      if (network === SupportedNetwork.Substrate)
        excludedEvents = [
          SubstrateTypes.EventKind.Reward,
          SubstrateTypes.EventKind.TreasuryRewardMinting,
          SubstrateTypes.EventKind.TreasuryRewardMintingV2,
          SubstrateTypes.EventKind.HeartbeatReceived,
        ];

      // add the rabbitmq handler for this chain
      listeners[chain.id].eventHandlers['rabbitmq'] = {
        handler: producer,
        excludedEvents,
      };

      try {
        // subscribe to the chain to begin listening for events
        await listeners[chain.id].subscribe();
      } catch (error) {
        await handleFatalError(error, pool, chain.id, 'listener-subscribe');
      }
    } else if (
      chain.base === ChainBase.Substrate &&
      !_.isEqual(
        chain.substrate_spec,
        (<SubstrateEvents.Listener>listeners[chain.id]).options.spec
      )
    ) {
      // restart the listener if specs were updated (only substrate chains)
      log.info(`Spec for ${chain.id} changed... restarting listener`);
      try {
        await (<SubstrateEvents.Listener>listeners[chain.id]).updateSpec(
          chain.substrate_spec
        );
      } catch (error) {
        await handleFatalError(error, pool, chain.id, 'update-spec');
      }
    }

    // add the logger if it is needed and isn't already added
    if (chain.ce_verbose && !listeners[chain.id].eventHandlers['logger']) {
      listeners[chain.id].eventHandlers['logger'] = {
        handler: generalLogger,
      };
    }

    // delete the logger if it is active but ce_verbose is false
    if (listeners[chain.id].eventHandlers['logger'] && !chain.ce_verbose)
      listeners[chain.id].eventHandlers['logger'] = null;
  }

  // loop through chains that have active listeners again this time dealing with identity
  for (const chain of myChainData) {
    // skip chains that aren't Substrate chains
    if (chain.base !== ChainBase.Substrate) continue;

    if (!listeners[chain.id]) {
      log.warn(
        `There is no active listener for ${chain.id} - cannot fetch identity`
      );
      continue;
    }

    log.info(`Fetching identities on ${chain.id}`);

    let identitiesToFetch;
    try {
      // fetch identities to fetch on this chain
      query = format(
        'SELECT * FROM "IdentityCaches" WHERE "chain"=%L;',
        chain.id
      );
      identitiesToFetch = (await pool.query(query)).rows.map((c) => c.address);
    } catch (error) {
      await handleFatalError(error, pool, chain.id, 'get-identity-cache');
      continue;
    }

    // if no identities are cached go to next chain
    if (identitiesToFetch.length === 0) {
      log.info(`No identities to fetch for ${chain.id}`);
      continue;
    }

    let identityEvents;
    try {
      // get identity events using the storage fetcher
      identityEvents = await listeners[chain.id].storageFetcher.fetchIdentities(
        identitiesToFetch
      );
    } catch (error) {
      await handleFatalError(error, pool, chain.id, 'fetch-chain-identities');
      continue;
    }

    // if no identity events are found the go to next chain
    if (identityEvents.length === 0) {
      log.info(`No identity events for ${chain.id}`);
      continue;
    }

    for (const event of identityEvents) {
      event.chain = chain.id; // augment event with chain
      await producer.publish(event, 'SubstrateIdentityEventsPublication');
    }

    // clear the identity cache for this chain
    try {
      query = format(
        'DELETE FROM "IdentityCaches" WHERE "chain"=%L;',
        chain.id
      );
      await pool.query(query);
    } catch (error) {
      await handleFatalError(error, pool, chain.id, 'clear-identity-cache');
      continue;
    }

    log.info(`Identity cache for ${chain.id} cleared`);
  }

  log.info('Finished scheduled process.');
  if (process.env.TESTING) {
    const listenerOptions = {};
    for (const chain of Object.keys(listeners)) {
      listenerOptions[chain] = listeners[chain].options;
    }
    log.info(`Listener Validation:${JSON.stringify(listenerOptions)}`);
  }
}

let pool, producer, numWorkers, workerNumber, erc20Logger, erc721Logger;
async function initializer(): Promise<void> {
  // begin process
  log.info('db-node initialization');

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

  // these requests cannot work locally
  if ((process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') && process.env.USE_SLIDER_SCALING === 'true') {
    log.info('Connecting to Heroku API');
    // get all dyno's list
    const res = await fetch(
      `https://api.heroku.com/apps/${process.env.HEROKU_APP_NAME}/dynos`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.HEROKU_API_TOKEN}`,
          Accept: 'application/vnd.heroku+json; version=3',
        },
      }
    );

    if (!res.ok) {
      log.info(`${res.status}, ${res.statusText}`);
      throw new Error('Could not get dynoList');
    }

    const dynoList = await res.json();

    if (!dynoList || dynoList.length === 0) {
      throw new Error("No dyno's detected");
    }

    // removes any dyno's that aren't ceNodes
    const ceNodes = dynoList.filter((dyno) => dyno.name.includes('ceNode'));

    // sort CeNode dyno's by their id
    ceNodes.sort((first, second) => {
      if (first.id > second.id) return 1;
      else if (first.id < second.id) return -1;
      return 0;
    });

    workerNumber = ceNodes
      .map((dyno) => dyno.id)
      .indexOf(process.env.HEROKU_DYNO_ID);
    numWorkers = ceNodes.length;

    let mostRecentDate = new Date(ceNodes[0].created_at);
    let newestDyno = ceNodes[0];
    for (const dyno of ceNodes) {
      const dynoCreated = new Date(dyno.created_at);
      if (mostRecentDate > dynoCreated) {
        mostRecentDate = dynoCreated;
        newestDyno = dyno;
      }
    }

    if (
      numWorkers !== Number(process.env.NUM_WORKERS) &&
      newestDyno.id === process.env.HEROKU_DYNO_ID // prevents race condition by only allowing the most recently created dyno to update the config vars
    ) {
      const result = await fetch(
        `https://api.heroku.com/apps/${process.env.HEROKU_APP_NAME}/config-vars`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${process.env.HEROKU_API_TOKEN}`,
            Accept: 'application/vnd.heroku+json; version=3',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            NUM_WORKERS: numWorkers,
          }),
        }
      );
      if (!result.ok) {
        log.info(`${result.status}, ${result.statusText}`);
        throw new Error('Could not update the config var - overlap may occur');
      }
    }
  } else {
    workerNumber = process.env.WORKER_NUMBER ? Number(process.env.WORKER_NUMBER) : 0;
    numWorkers = process.env.NUM_WORKERS ? Number(process.env.NUM_WORKERS) : 1;
  }

  log.info(`Worker Number: ${workerNumber}\tNumber of Workers: ${numWorkers}`);

  producer = new RabbitMqHandler(<BrokerConfig>RabbitMQConfig, 'ChainEventsHandlersPublication');
  erc20Logger = new ErcLoggingHandler(ChainNetwork.ERC20, []);
  erc721Logger = new ErcLoggingHandler(ChainNetwork.ERC20, []);
  try {
    await producer.init();
  } catch (e) {
    handleFatalError(e, pool, null, 'rabbitmq')
  }
}

initializer()
  .then(() => {
    return mainProcess(producer, erc20Logger, erc721Logger, pool, workerNumber, numWorkers);
  })
  .then(() => {
    setInterval(
      mainProcess,
      REPEAT_TIME * 60000,
      producer,
      erc20Logger,
      erc721Logger,
      pool,
      workerNumber,
      numWorkers
    );
  })
  .catch((err) => {
    // TODO: any error caught here is critical - no events will be produced
    handleFatalError(err, pool, null, null);
  });
