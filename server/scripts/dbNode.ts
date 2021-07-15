// TODO: change imports to chain-events when new chain-events package is ready to be included as a dependency
import { listeners, startProducer } from '../src/listener';
import { createListener } from '../src/listener/createListener';
import { deleteListener, getRabbitMQConfig } from '../src/listener/util';
import { factory, formatFilename } from '../src/logging';
import { StorageFetcher } from '../src/chains/substrate';
import Identity from '../src/identity';
import { Pool } from 'pg';
import _ from 'underscore';
import { producer } from '../src/listener';
import format from 'pg-format';

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

// TODO: API-WS from infinitely attempting reconnection i.e. mainnet1
async function dbNodeProcess() {
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
  // TODO: fork off listeners as their own processes if needed (requires major changes to listener/handler structure)
  for (const chain of myChainData) {
    // start listeners that aren't already active
    if (!listeners[chain.id]) {
      log.info(`Starting listener for ${chain.id}...`);
      await createListener(chain.id, {
        archival: false,
        url: chain.url,
        spec: chain.spec,
        skipCatchup: false
      });
    }
    // restart the listener if specs were updated
    else {
      if (!_.isEqual(chain.spec, listeners[chain.id].args.spec)) {
        log.info(`Spec for ${chain} changed... restarting listener`);
        deleteListener(chain.id);
        await createListener(chain.id, {
          archival: false,
          url: chain.url,
          spec: chain.spec,
          skipCatchup: false
        });
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

    // initialize storage fetcher if it doesn't exist
    if (!listeners[chain.id].storageFetcher)
      listeners[chain.id].storageFetcher = new StorageFetcher(
        listeners[chain.id].subscriber.api
      );

    // get identity events
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
startProducer(getRabbitMQConfig(rbbtMqConfig))
  .then(() => {
    return dbNodeProcess();
  })
  .then(() => {
    // first run may take some time so start the clock after its done
    setInterval(dbNodeProcess, REPEAT_TIME * 60000);
  });
