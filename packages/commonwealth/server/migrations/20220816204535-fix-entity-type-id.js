'use strict';

module.exports = {
  // WARNING: irreversible migration
  up: async (queryInterface, Sequelize) => {
    // convert existing type_id's of chain-entities to the hash of the event_data
    // of the chain-event that created the entity
    await queryInterface.sequelize.query(`
      UPDATE "ChainEntities"
      SET type_id = MD5(updated.event_data::TEXT)
      FROM (SELECT CE.id, CE.event_data, CE.entity_id FROM (
              SELECT id, event_data, entity_id,
              ROW_NUMBER() OVER(PARTITION BY entity_id ORDER BY block_number) AS Row
              FROM "ChainEvents"
              WHERE entity_id IS NOT NULL) as CE
          WHERE CE.Row = 1
      ) as updated
      WHERE "ChainEntities".id = updated.entity_id;
    `);

    // delete any chain-entity that has a type_id that isn't the MD5 hash of
    // its event_data. This is equivalent to deleting all the chain-entities that
    // don't have any associated chain-events
    await queryInterface.sequelize.query(`
      DELETE FROM "ChainEntities" WHERE length(type_id) != 32;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // IRREVERSIBLE
  }
};
