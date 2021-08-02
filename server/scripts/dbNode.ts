import { factory, formatFilename } from '../../shared/logging';
import Identity from '../eventHandlers/pgIdentity';
import { Pool } from 'pg';
import _ from 'underscore';
import format from 'pg-format';
import {
  createListener,
  chainSupportedBy,
  SubstrateTypes,
  SubstrateListener
} from '@commonwealth/chain-events';
import {
  RabbitMqHandler,
} from 'ce-rabbitmq-plugin';
import { DATABASE_URI, HANDLE_IDENTITY } from '../config'
import RabbitMQConfig from '../util/rabbitmq/RabbitMQConfig';
console.log(RabbitMQConfig)

const log = factory.getLogger(formatFilename(__filename));

// TODO: RollBar error reporting
// TODO: change console logging to log
// TODO: if listener start fails revert hasChainEventsListener to false in db

// env var
const WORKER_NUMBER: number = Number(process.env.WORKER_NUMBER) || 0;
const NUM_WORKERS: number = Number(process.env.NUM_WORKERS) || 1;

// The number of minutes to wait between each run -- rounded to the nearest whole number
export const REPEAT_TIME = Math.round(Number(process.env.REPEAT_TIME)) || 10;

async function handleFatalError(error: Error, chain?: string, type?: string): Promise<void> {
  log.error(String(error));
}

// stores all the listeners a dbNode has active
const listeners: { [key: string]: any} = {};
// TODO: skipCatchup behavior fix?
// TODO: error handling for pg queries
// TODO: API-WS from infinitely attempting reconnection i.e. mainnet1
async function mainProcess(producer: RabbitMqHandler) {
  const pool = new Pool({
    connectionString: DATABASE_URI
  });

  pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    // TODO: handle this
  });

  let query = `SELECT "Chains"."id", "substrate_spec", "url", "address", "base" FROM "Chains" JOIN "ChainNodes" ON "Chains"."id"="ChainNodes"."chain" WHERE "Chains"."has_chain_events_listener"='true';`;

  const allChains = (await pool.query(query)).rows;
  const myChainData = allChains.filter(
    (chain, index) => index % NUM_WORKERS === WORKER_NUMBER
  );

  // delete listeners for chains that are no longer assigned to this node
  const myChains = myChainData.map(row => row.id)
  Object.keys(listeners).forEach((chain) => {
    if (!myChains.includes(chain)) {
      listeners[chain].unsubscribe();
      listeners[chain] = null;
    }
  })

  // initialize listeners first (before dealing with identity)
  for (const chain of myChainData) {
    // start listeners that aren't already active - this means for any duplicate chain nodes
    // it will start a listener for the first successful chain node url in the db
    if (!listeners[chain.id]) {
      log.info(`Starting listener for ${chain.id}...`);
      try {
        listeners[chain.id] = await createListener(chain.id, {
            Erc20TokenAddresses: [chain.address],
            archival: false,
            url: chain.url,
            spec: chain.substrate_spec,
            skipCatchup: false,
            verbose: false,
            enricherConfig: { balanceTransferThresholdPermill: 1_000 },// 0.1% of total issuance
          },
          true,
          chain.base
        );
      } catch (error) {
        await handleFatalError(error, chain, 'listener-startup');
        continue;
      }

      // if chain is a substrate chain add the excluded events
      let excludedEvents = [];
      if (chainSupportedBy(chain.id, SubstrateTypes.EventChains))
        excludedEvents = [
          SubstrateTypes.EventKind.Reward,
          SubstrateTypes.EventKind.TreasuryRewardMinting,
          SubstrateTypes.EventKind.TreasuryRewardMintingV2,
          SubstrateTypes.EventKind.HeartbeatReceived
        ];

      // add the rabbitmq handler for this chain
      listeners[chain.id].eventHandlers['rabbitmq'] = {
        handler: producer,
        excludedEvents
      };

      try {
        // subscribe to the chain to begin listening for events
        await listeners[chain.id].subscribe();
      } catch (error) {
        await handleFatalError(error, chain.id, 'listener-subscribe')
      }
    }
    // restart the listener if specs were updated (only substrate chains)
    else if (
      chain.base == 'substrate' &&
      !_.isEqual(chain.spec, (<SubstrateListener>listeners[chain.id]).options.spec)
    ) {
      log.info(`Spec for ${chain} changed... restarting listener`);
      try {
        await (<SubstrateListener>listeners[chain.id]).updateSpec(chain.spec);
      } catch (error) {
        await handleFatalError(error, chain.id, 'update-spec')
      }
    }
  }

  if (HANDLE_IDENTITY == null) {
    await pool.end();
    log.info(`Finished scheduled process.`);
    if (process.env.TESTING) {
      const listenerOptions = {}
      for (const chain in listeners) listenerOptions[chain] = listeners[chain].options
      console.log(`Listener Validation:${JSON.stringify(listenerOptions)}`)
    }
    return;
  }

  // loop through chains again this time dealing with identity
  for (const chain of myChainData) {
    // skip chains that aren't Substrate chains
    if (chain.base != 'substrate') continue;

    log.info(`Fetching identities on ${chain.id}`);

    let identitiesToFetch;
    try {
      // fetch identities to fetch on this chain
      query = format(
        `SELECT * FROM "IdentityCaches" WHERE "chain"=%L;`,
        chain.id
      );
      identitiesToFetch = (await pool.query(query)).rows.map(
        (c) => c.address
      );
    } catch (error) {
      await handleFatalError(error, chain.id, 'get-identity-cache');
      continue;
    }


    // if no identities are cached go to next chain
    if (identitiesToFetch.length == 0) {
      log.info(`No identities to fetch for ${chain.id}`);
      continue;
    }

    let identityEvents;
    try {
      // get identity events using the storage fetcher
      identityEvents = await listeners[
        chain.id
        ].storageFetcher.fetchIdentities(identitiesToFetch);
    } catch (error) {
      await handleFatalError(error, chain.id, 'fetch-chain-identities');
      continue;
    }


    // if no identity events are found the go to next chain
    if (identityEvents.length == 0) {
      log.info(`No identity events for ${chain.id}`);
      continue;
    }

    if (HANDLE_IDENTITY === 'handle') {
      // initialize identity handler
      const identityHandler = new Identity(chain.id, pool);

      await Promise.all(
        identityEvents.map((e) => identityHandler.handle(e, null))
      );
    } else if (HANDLE_IDENTITY === 'publish') {
      for (const event of identityEvents) {
        event.chain = chain.id; // augment event with chain
        await producer.publish(event, 'identityPub');
      }
    }

    // clear the identity cache for this chain
    try {
      query = format(`DELETE FROM "IdentityCaches" WHERE "chain"=%L;`, chain.id);
      await pool.query(query);
    } catch (error) {
      await handleFatalError(error, chain.id, 'clear-identity-cache');
      continue;
    }

    log.info(`Identity cache for ${chain.id} cleared`);
  }

  await pool.end();
  log.info('Finished scheduled process.');
  if (process.env.TESTING) {
    const listenerOptions = {}
    for (const chain in listeners) listenerOptions[chain] = listeners[chain].options
    console.log(`Listener Validation:${JSON.stringify(listenerOptions)}`)
  }
  return;
}

// begin process
log.info('db-node initialization');

const producer = new RabbitMqHandler(RabbitMQConfig);
producer
  .init()
  .then(() => {
    return mainProcess(producer);
  })
  .then(() => {
    setInterval(mainProcess, REPEAT_TIME * 60000, producer);
  })
  .catch((err) => {
    // TODO: any error caught here is critical - no events will be produced
    handleFatalError(err, null, 'unknown');
  })

// export async function getTokenLists() {
//   let data: any = await Promise.all(
//     tokenListUrls.map((url) =>
//       fetch(url)
//         .then((o) => o.json())
//         .catch((e) => console.error(e))
//     )
//   );
//   data = data.map((o) => o && o.tokens).flat();
//   data = data.filter((o) => o); //remove undefined
//   return data;
// }

// export async function getSubstrateSpecs(chain: EventSupportingChainT) {
//   let url: string = `${process.env.SUBSTRATE_SPEC_ENDPOINT ||
//     'http://localhost:8080/api/getSubstrateSpec'}?chain=${chain}`;
//
//   console.log(`Getting ${chain} spec at url ${url}`);
//
//   let data: any = await fetch(url)
//     .then((res) => res.json())
//     .then((json) => json.result)
//     .catch((err) => console.error(err));
//
//   return data;
// }

// let tokens = await getTokenLists();
// let tokenAddresses = tokens.map((o) => o.address);
// const api = await Erc20Events.createApi(listenerArg.url, tokenAddresses);
