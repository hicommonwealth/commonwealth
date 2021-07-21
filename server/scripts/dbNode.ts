// TODO: change imports to chain-events when new chain-events package is ready to be included as a dependency
import { factory, formatFilename } from '../../shared/logging';
import Identity from '../eventHandlers/pgIdentity';
import { Pool } from 'pg';
// @ts-ignore
import _ from 'underscore';
import format from 'pg-format';

import {
  createListener,
  chainSupportedBy,
  SubstrateTypes,
  getRabbitMQConfig,
  RabbitMqHandler
} from '@commonwealth/new-chain-events';

const log = factory.getLogger(formatFilename(__filename));
export const WORKER_NUMBER: number = Number(process.env.WORKER_NUMBER) || 0;
export const NUM_WORKERS: number = Number(process.env.NUM_WORKERS) || 1;
export const DATABASE_URI =
  !process.env.DATABASE_URL || process.env.NODE_ENV === 'development'
    ? 'postgresql://commonwealth:edgeware@localhost/commonwealth'
    : process.env.DATABASE_URL;

const envIden = process.env.HANDLE_IDENTITY;
export const HANDLE_IDENTITY =
  envIden === 'publish' || envIden === 'handle' ? envIden : null;

// The number of minutes to wait between each run -- rounded to the nearest whole number
export const REPEAT_TIME = Math.round(Number(process.env.REPEAT_TIME)) || 10;

// stores all the listeners a dbNode has active
const listeners: any[] = [];

// TODO: API-WS from infinitely attempting reconnection i.e. mainnet1
async function mainProcess(producer: RabbitMqHandler) {
  const pool = new Pool({
    connectionString: DATABASE_URI
  });

  pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    // TODO: handle this
  });

  let query = `SELECT "Chains"."id", "substrate_spec", "url", "ChainNodes"."chain" FROM "Chains" JOIN "ChainNodes" ON "Chains"."id"="ChainNodes"."chain" WHERE "Chains"."has_chain_events_listener"='true';`;

  const allChains = (await pool.query(query)).rows;
  const myChainData = allChains.filter(
    (chain, index) => index % NUM_WORKERS === WORKER_NUMBER
  );

  // initialize listeners first (before dealing with identity)
  for (const chain of myChainData) {
    // start listeners that aren't already active
    if (!listeners[chain.id]) {
      log.info(`Starting listener for ${chain.id}...`);
      listeners[chain.id] = await createListener(chain.id, {
        archival: false,
        url: chain.url,
        spec: chain.spec,
        skipCatchup: false,
        verbose: false,
        enricherConfig: { balanceTransferThresholdPermill: 1_000 } // 0.1% of total issuance
      });

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

      // subscribe to the chain to begin listening for events
      await listeners[chain.id].subscribe();
    }
    // restart the listener if specs were updated (only substrate chains)
    else {
      if (
        chainSupportedBy(chain.id, SubstrateTypes.EventChains) &&
        !_.isEqual(chain.spec, listeners[chain.id].options.spec)
      ) {
        log.info(`Spec for ${chain} changed... restarting listener`);
        await listeners[chain.id].updateSpec(chain.spec);
      }
    }
  }

  if (HANDLE_IDENTITY == null) {
    await pool.end();
    log.info('Finished scheduled process.');
    return;
  }

  // loop through chains again this time dealing with identity
  for (const chain of myChainData) {
    // skip chains that aren't Substrate chains
    if (!chainSupportedBy(chain.id, SubstrateTypes.EventChains)) continue;

    log.info(`Fetching identities on ${chain.id}`);
    // fetch identities to fetch on this chain
    query = format(
      `SELECT * FROM "IdentityCaches" WHERE "chain"=%L;`,
      chain.id
    );
    const identitiesToFetch = (await pool.query(query)).rows.map(
      (c) => c.address
    );

    // if no identities are cached go to next chain
    if (identitiesToFetch.length == 0) {
      log.info(`No identities to fetch for ${chain.id}`);
      continue;
    }
    // get identity events using the storage fetcher
    let identityEvents = await listeners[
      chain.id
    ].storageFetcher.fetchIdentities(identitiesToFetch);

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

    query = format(`DELETE FROM "IdentityCaches" WHERE "chain"=%L;`, chain.id);
    await pool.query(query);

    log.info(`Identity cache for ${chain.id} cleared`);
  }

  await pool.end();
  log.info('Finished scheduled process.');
  return;
}

// begin process
log.info('db-node initialization');

// if we need to publish identity events to a queue use the appropriate config file
let rbbtMqConfig =
  HANDLE_IDENTITY == 'publish' ? './WithIdentityQueueConfig.json' : null;
const producer = new RabbitMqHandler(getRabbitMQConfig(rbbtMqConfig));
producer
  .init()
  .then(() => {
    return mainProcess(producer);
  })
  .then(() => {
    setInterval(mainProcess, REPEAT_TIME * 60000, producer);
  });

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
