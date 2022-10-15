/**
 * This script is meant as the worst case scenario recovery tool or as a method of ensuring consistency without a trace
 * of a doubt. From the script we can fully rehydrate any cross-server data that was lost. This script can be used in
 * emergencies and/or as part of the regular release phase.
 *
 * WARNING:
 * Requires having the dbLink extension created/enabled by a superuser on each of the involved databases `create extension dblink;`
 */
import models from '../database';


export async function enforceDataConsistency(
  ce_db_uri?: string,
  enforceTypes?: boolean,
  enforceEntities?: boolean
) {
  // if the function is called with run-as-script i.e. yarn runEnforceDataConsistency ensure that CONFIRM=true is passed
  if (process.argv[2] === 'run-as-script' && process.env.confirm != 'true') {
    console.warn("This script makes changes to the database specified by DATABASE_URI. If you are sure" +
      "you want to do this run this script again with the env var 'CONFIRM=true'");
    process.exit(0);
  }

  // must provide the chain-events database uri in one form or another
  if (!process.env.CE_DB_URI && !ce_db_uri) {
    console.error("CE_DB_URI must be defined to run this script. All changes in the db specified by CE_DB_URI will be" +
      "reflected in the db specified by DATABASE_URI.")
    process.exit(1)
  }

  // if not run as a script then at least one of the enforced datatypes must be true
  if (process.argv[2] != 'run-as-script' && !enforceTypes && !enforceEntities && !enforceEventNotifications) {
    throw new Error("At least one of enforceTypes, enforceEntities, enforceEventNotifications must be true");
  }

  const CE_DB_URI = process.env.CE_DB_URI || ce_db_uri;

  const chainEventTypeSync = `
      WITH existingIds AS (SELECT id FROM "ChainEventTypes")
      INSERT
      INTO "ChainEventTypes"
      SELECT "NewCETypes".id
      FROM dblink('${CE_DB_URI}',
                  'SELECT id FROM "ChainEventTypes"') as "NewCETypes"(id varchar(255))
      WHERE "NewCETypes".id NOT IN (SELECT * FROM existingIds);
  `;

  const chainEntitySync = `
      WITH existingCeIds AS (SELECT ce_id FROM "ChainEntityMeta")
      INSERT INTO "ChainEntityMeta" (ce_id, chain, author)
      SELECT "AllChainEntities".id as ce_id, chain, author
      FROM dblink('${CE_DB_URI}',
                  'SELECT id, chain, author FROM "ChainEntities";') as "AllChainEntities"(id int, chain varchar(255), author varchar(255))
      WHERE "AllChainEntities".id NOT IN (SELECT * FROM existingCeIds);
  `;

  await models.sequelize.transaction(async (t) => {
    if (enforceTypes) await models.sequelize.query(chainEventTypeSync, {transaction: t});
    if (enforceEntities) await models.sequelize.query(chainEntitySync, {transaction: t});
  });
}

// lets script run as
if (process.argv[2] == 'run-as-script') {
  enforceDataConsistency();
}

