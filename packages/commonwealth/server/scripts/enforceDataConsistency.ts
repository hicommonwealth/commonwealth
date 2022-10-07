/**
 * This script is meant as the worst case scenario recovery tool or as a method of ensuring consistency without a trace
 * of a doubt. From the script we can fully rehydrate any cross-server data that was lost. This script can be used in
 * emergencies and/or as part of the regular release phase.
 *
 * WARNING:
 * Requires having the dbLink extension created/enabled by a superuser on each of the involved databases `create extension dblink;`
 */
import {DATABASE_URI} from "../config";
import models from '../database';

async function main() {
  if (process.env.confirm != 'true') {
    console.warn("This script makes changes to the database specified by DATABASE_URI. If you are sure" +
      "you want to do this run this script again with the env var 'CONFIRM=true'");
    process.exit(0);
  }

  if (!process.env.CE_DB_URI) {
    console.error("CE_DB_URI must be defined to run this script. All changes in the db specified by CE_DB_URI will be" +
      "reflected in the db specified by DATABASE_URI.")
    process.exit(1)
  }

  const CE_DB_URI = process.env.CE_DB_URI;

  const chainEventTypeSync = `
      INSERT INTO "ChainEventTypes"
      SELECT "AllCeTypes".id
      FROM dbLINK(${CE_DB_URI},
                  'SELECT id FROM "ChainEventTypes";') as "AllCeTypes"(id varchar(255))
      ON CONFLICT DO NOTHING;
`;

  const chainEntitySync = `
      INSERT INTO "ChainEntities"
      SELECT "AllChainEntities".id as ce_id, chain, author
      FROM dblink(${CE_DB_URI},
                  'SELECT id, chain, author FROM "ChainEntities";') as "AllChainEntities"(id int, chain varchar(255), author varchar(255))
      ON CONFLICT DO UPDATE SET ce_id  = "AllChainEntities".id,
                                chain  = "AllChainEntities".chain,
                                author = "AllChainEntities".author;
`;

  const ceNotificationSync = `
      INSERT INTO "Notifications"
      SELECT jsonb_build_object('id', "ALE".id, 'entity_id', "ALE".entity_id, 'created_at', "ALE".created_at,
                                'event_data', "ALE".event_data, 'updated_at', "ALE".updated_at, 'block_number',
                                "ALE".block_number,
                                'ChainEventType',
                                jsonb_build_object('id', "ALE".chain_event_type_id, 'chain', "ALE".chain,
                                                   'event_name', "ALE".event_name, 'event_network',
                                                   "ALE".event_network), 'chain_event_type_id',
                                "ALE".chain_event_type_id) as notification_data,
             CURRENT_TIMESTAMP                             as created_at,
             CURRENT_TIMESTAMP                             as updated_at,
             "ALE".id                                      as chain_event_id,
             "ALE".chain                                   as chain_id,
             'chain-event'                                 as category_id
      FROM dblink(${CE_DB_URI},
                  'SELECT CE.id, CE.block_number, CE.event_data, CE.entity_id, CE.created_at, CE.updated_at,
                      CET.id as chain_event_type_id, CET.event_network, CET.event_name, CET.chain
                  FROM "ChainEvents" CE JOIN "ChainEventTypes" CET ON CE.chain_event_type_id = CET.id')
               as "ALE"(id int, block_number int, event_data jsonb, entity_id int, created_at timestamp with time zone,
                        updated_at timestamp with time zone, chain_event_type_id varchar(255),
                        event_network varchar(255),
                        event_name varchar(255), chain varchar(255))
      ON CONFLICT DO NOTHING;
`;

  await models.sequelize.transaction(async (t) => {
    await models.sequelize.query(chainEventTypeSync, {transaction: t});
    await models.sequelize.query(chainEntitySync, {transaction: t});
    await models.sequelize.query(ceNotificationSync, {transaction: t});
  });
}

main();

