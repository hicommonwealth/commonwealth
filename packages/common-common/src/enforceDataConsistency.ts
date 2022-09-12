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


function getDbURI(): { mainDB: string, chainEventsDB: string } {
  if (!process.env.DATABASE_URL || process.env.NODE_ENV === 'development') {
    return {
      mainDB: 'postgresql://commonwealth:edgeware@localhost/commonwealth',
      chainEventsDB: 'postgresql://commonwealth:edgeware@localhost/commonwealth_chain_events'
    }
  }

  if (process.env.HEROKU_APP_NAME === 'commonwealth') {
    return {
      mainDB: process.env.DATABASE_URL,
      chainEventsDB: process.env.CE_DATABASE_URL
    }
  } else if (process.env.HEROKU_APP_NAME === 'chain-events-staging') {
    // TODO: edit chain-events-staging app name here
    return {
      mainDB: process.env.MAIN_DATABASE_URL,
      chainEventsDB: process.env.DATABASE_URL
    }
  }
}
// Check that every ChainNode in Main is also in ChainEvents


/**
 * Check that every Chain in Main is also in ChainEvents. Assumes that the chainNodes associated with the newly added
 * chains already exist in ChainEvents i.e. run ChainNode sync first
 * @param mainDbURI
 * @param ceDbURI
 * @constructor
 */
async function Chain(mainDbURI: string, ceDbURI: string) {
  const client = new Client({
    connectionString: ceDbURI
  });
  await client.connect();

  const result = await client.query(`
      INSERT INTO "Chains"
      SELECT "AllChains".id,
             base,
             network,
             CN.id as chain_node_id,
             address    as contract_address,
             substrate_spec,
             ce_verbose as verbose_logging,
             active
      FROM dblink('postgresql://commonwealth:edgeware@localhost/commonwealth',
                  'SELECT "Chains".id,
                      base,
                      network,
                      private_url,
                      url,
                      address,
                      substrate_spec,
                      ce_verbose,
                      active
                  FROM "Chains"
                      JOIN "ChainNodes" CN on CN.id = "Chains".chain_node_id;')
               as "AllChains"(id int, base varchar(255), network varchar(255), private_url varchar(255), url varchar(255), address varchar(255),
                              substrate_spec jsonb, ce_verbose boolean, active boolean)
               JOIN "ChainNodes" CN ON CN.url = COALESCE("AllChains".private_url, "AllChains".url);
  `);
}


// Check that every ChainEntity in ChainEvents is also in Main
// Check that every ChainEvent created an equivalent ChainEventNotification


async function main() {
  const {mainDB, chainEventsDB} = getDbURI();

}

