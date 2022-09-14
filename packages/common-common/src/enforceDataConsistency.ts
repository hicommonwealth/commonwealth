/**
 * This script is meant as the worst case scenario recovery tool or as a method of ensuring consistency without a trace
 * of a doubt. From the script we can fully rehydrate any cross-server data that was lost. This script can be used in
 * emergencies and/or as part of the regular release phase.
 *
 * WARNING:
 * Requires having the dbLink extension created/enabled by a superuser on each of the involved databases `create extension dblink;`
 * Requires having CE_DATABASE_URL defined in the main service
 * Requires having MAIN_DATABASE_URL defined in the chain-events service
 */
import {Client} from "pg";

function getDbURI(): { mainDbUri: string, chainEventsDbUri: string } {
  if (!process.env.DATABASE_URL || process.env.NODE_ENV === 'development') {
    return {
      mainDbUri: 'postgresql://commonwealth:edgeware@localhost/commonwealth',
      chainEventsDbUri: 'postgresql://commonwealth:edgeware@localhost/commonwealth_chain_events'
    }
  }

  if (process.env.HEROKU_APP_NAME === 'commonwealth') {
    return {
      mainDbUri: process.env.DATABASE_URL,
      chainEventsDbUri: process.env.CE_DATABASE_URL
    }
  } else if (process.env.HEROKU_APP_NAME === 'chain-events-staging') {
    // TODO: edit chain-events-staging app name here
    return {
      mainDbUri: process.env.MAIN_DATABASE_URL,
      chainEventsDbUri: process.env.DATABASE_URL
    }
  }
}

// Check that every ChainNode in Main is also in ChainEvents


/**
 * Check that every Chain in Main is also in ChainEvents. Assumes that the chainNodes associated with the newly added
 * chains already exist in ChainEvents i.e. run ChainNode sync first
 * @constructor
 */
async function chainSync(mainDbUri: string, chainEventsDbUri: string) {
  const ceClient = new Client({
    connectionString: chainEventsDbUri
  });
  await ceClient.connect();

  const result = await ceClient.query(`
      INSERT INTO "Chains"
      SELECT "AllChains".id,
             base,
             network,
             CN.id   as chain_node_id,
             address as contract_address,
             substrate_spec
      FROM dblink(${mainDbUri},
                  'SELECT "Chains".id,
                      base,
                      network,
                      private_url,
                      url,
                      address,
                      substrate_spec
                  FROM "Chains"
                      JOIN "ChainNodes" CN on CN.id = "Chains".chain_node_id;')
               as "AllChains"(id int, base varchar(255), network varchar(255), private_url varchar(255),
                              url varchar(255),
                              address varchar(255),
                              substrate_spec jsonb)
               JOIN "ChainNodes" CN ON CN.url = COALESCE("AllChains".private_url, "AllChains".url)
      ON CONFLICT DO UPDATE SET base             = "AllChains".base,
                                network          = "AllChains".network,
                                chain_node_id    = COALESCE("AllChains".private_url, "AllChains".url),
                                contract_address = "AllChains".address,
                                substrate_spec   = "AllChains".substrate_spec;
  `);
}

async function chainEventTypeSync(mainDbUri: string, chainEventsDbUri: string) {
  const mainClient = new Client({
    connectionString: mainDbUri
  });
  await mainClient.connect();

  const result = await mainClient.query(`
      INSERT INTO "ChainEventTypes"
      SELECT "AllCeTypes".id
      FROM dbLINK(${chainEventsDbUri},
                  'SELECT id FROM "ChainEventTypes";') as "AllCeTypes"(id varchar(255))
      ON CONFLICT DO NOTHING;
  `);
}

async function chainEntitySync(mainDbUri: string, chainEventsDbUri: string) {
  const mainClient = new Client({
    connectionString: mainDbUri
  });
  await mainClient.connect();

  const result = await mainClient.query(`
      INSERT INTO "ChainEntities"
      SELECT "AllChainEntities".id as ce_id, chain, author
      FROM dblink(${chainEventsDbUri}, 'SELECT id, chain, author FROM "ChainEntities";') as "AllChainEntities"(id int, chain varchar(255), author varchar(255))
      ON CONFLICT DO UPDATE SET ce_id  = "AllChainEntities".id,
                                chain  = "AllChainEntities".chain,
                                author = "AllChainEntities".author;
  `);
}


// Check that every ChainEntity in ChainEvents is also in Main
// Check that every ChainEvent created an equivalent ChainEventNotification


async function main() {
  const {mainDbUri, chainEventsDbUri} = getDbURI();

}

