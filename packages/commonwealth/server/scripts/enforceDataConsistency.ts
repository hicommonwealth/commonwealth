import { QueryTypes } from 'sequelize';
import models from '../database';

/**
 * This script is meant as the worst case scenario recovery tool or as a method of ensuring consistency without a trace
 * of a doubt. From the script we can fully rehydrate any cross-server data that was lost. This script can be used in
 * emergencies and/or as part of the regular release phase.
 *
 * To run this file as a script 2 arguments are needed. Example:
 * `ts-node enforceDataConsistency.ts run-as-script [Chain-event DB URI]`
 *
 * WARNING:
 * Requires having the dbLink extension created/enabled by a superuser on each of the involved databases
 * `create extension dblink;`
 * This script should be run while the queues are empty + the chain-event listeners are offline to avoid duplicate
 * data errors. For example if this script inserts a chain-event-type that is also in a queue, the queue processor will
 * throw when it attempts to insert and that message will be retried and eventually dead-lettered unnecessarily.
 *
 * @param ce_db_uri {string} The URI of the chain-events database to sync with
 * @param enforceEntities {boolean} A boolean indicating whether chain-event-entities should be synced
 */
export async function enforceDataConsistency(
  ce_db_uri: string,
  enforceEntities = true
) {
  // if the function is called with run-as-script i.e. yarn runEnforceDataConsistency ensure that CONFIRM=true is passed
  if (process.argv[2] === 'run-as-script' && process.env.CONFIRM != 'true') {
    console.warn(
      'This script makes changes to the database specified by the given database URI. If you are sure ' +
        "you want to do this run this script again with the env var 'CONFIRM=true'"
    );
    process.exit(0);
  }
  const chainEntitySyncQuery = `
      WITH existingCeIds AS (SELECT ce_id FROM "ChainEntityMeta")
      INSERT INTO "ChainEntityMeta" (ce_id, community_id, author, type_id)
      SELECT "AllChainEntities".id as ce_id, community_id, author, type_id
      FROM dblink('${ce_db_uri}', 'SELECT id, community_id, author, type_id FROM "ChainEntities";') as
                   "AllChainEntities"(id int, community_id varchar(255), author varchar(255), type_id varchar(255))
      WHERE "AllChainEntities".id NOT IN (SELECT * FROM existingCeIds)
      RETURNING ce_id;
  `;

  await models.sequelize.transaction(async (t) => {
    if (enforceEntities) {
      const result = await models.sequelize.query(chainEntitySyncQuery, {
        type: QueryTypes.INSERT,
        raw: true,
        transaction: t,
      });
      console.log('ChainEventEntities synced:', result);
    }
  });
}

// enables running the enforceDataConsistency function as a standalone script
if (process.argv[2] == 'run-as-script') {
  enforceDataConsistency(process.argv[3])
    .then(() => {
      console.log('Successfully synced the databases');
      process.exit(0);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
