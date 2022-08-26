import models from '../database';
import {QueryTypes} from "sequelize";
import {EntityEventKind, eventToEntity, SupportedNetwork} from "chain-events/src";
import {ChainBase, ChainNetwork} from 'common-common/src/types';

async function main() {
  await models.sequelize.transaction(async (t) => {
    await models.sequelize.query(`
      CREATE TABLE IF NOT EXISTS entities_creation_events
      (
          entity_id INTEGER,
          chain VARCHAR(255),
          type VARCHAR(255),
          type_id VARCHAR(255),
          event_id INTEGER PRIMARY KEY,
          event_data jsonb
      );
  `, { transaction: t });

    // selects all chain-entities and the events that are in the first block associated with the entity
    let result = <any>(await models.sequelize.query(`
      SELECT CE.entity_id, C.id as chain, CEE.type, CEE.type_id, CE.id as event_id, CE.event_data, C.base, C.network
      FROM "ChainEvents" CE
               JOIN "ChainEventTypes" CET on CE.chain_event_type_id = CET.id
               JOIN "Chains" C on CET.chain = C.id
               JOIN "ChainEntities" CEE ON CEE.id = CE.entity_id
      WHERE CE.entity_id IS NOT NULL
        AND CE.block_number = (SELECT MIN(block_number) FROM "ChainEvents" CE2 WHERE CE2.entity_id = CE.entity_id);
  `, {type: QueryTypes.SELECT, raw: true, transaction: t}));

    // remove the entity/event pairs where the event is not an 'entity creation' event
    result = result.filter((row) => {
      let network: SupportedNetwork;
      if (row.base === ChainBase.Substrate)
        network = SupportedNetwork.Substrate;
      else if (row.network === ChainNetwork.Compound)
        network = SupportedNetwork.Compound;
      else if (row.network === ChainNetwork.Aave)
        network = SupportedNetwork.Aave;
      else if (row.network === ChainNetwork.Moloch)
        network = SupportedNetwork.Moloch;
      const temp = eventToEntity(network, row.event_data.kind);
      if (!temp) {
        return false;
      }
      const [entityKind, updateType] = temp;
      return updateType === EntityEventKind.Create;
    });

    // remove duplicates
    const unique_set = new Set();
    const final_result: any[] = [];
    for (const row of result) {
      if (unique_set.has(row.entity_id)) continue;
      else {
        unique_set.add(row.entity_id);
        final_result.push(row);
      }
    }

    // build and execute the query to update all the type_ids
    let query = `INSERT INTO entities_creation_events (entity_id, chain, type, type_id, event_id) VALUES`
    let index = 0;
    for (const row of final_result) {
      index += 1;
      query += `(${row.entity_id}, '${row.chain}', '${row.type}', '${row.type_id}', ${row.event_id})`;
      if (index !== final_result.length) query += ',';
    }
    query += `;`
    await models.sequelize.query(query, { type: QueryTypes.INSERT, raw: true, transaction: t});

    await models.sequelize.query(`
      UPDATE entities_creation_events
      SET event_data = CE.event_data
      FROM "ChainEvents" CE
      WHERE event_id = CE.id;
    `, {transaction: t});
  });
}

main().then(() => {
  console.log("Script finished successfully");
  process.exit(0)
}).catch((e) => {
  console.error(e);
  process.exit(1);
})
