'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      /**
       * Duplicate entities with non-duplicate events
       */

      /**
       * create the duplicate_entities table that contains all duplicate entities joined with the events that
       * created them as well as the number of events associated with each entity and an index indicating which entity
       * is the 'real' entity for each duplicate entity pair (index = 1 means that is the 'real' entity)
       */
      await queryInterface.sequelize.query(`
          WITH temp as (
              SELECT
                  CE1.id as entity_id,
                  CE1.chain,
                  CE1.type,
                  CE1.type_id,
                  CE1.thread_id,
                  CE1.completed,
                  CE1.updated_at,
                  ece.event_id,
                  ece.event_data,
                  (SELECT COUNT(*) FROM "ChainEvents" ce WHERE CE1.id = ce.entity_id) as event_count
              FROM "ChainEntities" CE1
                       JOIN "entities_creation_events" ece ON CE1.id = ece.entity_id
              WHERE (SELECT COUNT(*)
                     FROM "ChainEntities" CE2
                     WHERE CE1.chain = CE2.chain
                       AND CE1.type = CE2.type
                       AND CE1.type_id = CE2.type_id
                       AND CE1.author IS NOT DISTINCT FROM CE2.author) > 1
          ORDER BY created_at
              )
          SELECT
              *,
              row_number() over (PARTITION BY temp.type, temp.type_id ORDER BY temp.event_count DESC) as index
          INTO "duplicate_entities"
          FROM temp;
            `, {transaction: t});

      await queryInterface.sequelize.query(`
        DELETE
        FROM "ChainEvents"
        WHERE entity_id IN (SELECT entity_id FROM "duplicate_entities" WHERE index = 2);
      `, {transaction: t});

      await queryInterface.sequelize.query(`
        DELETE
        FROM "ChainEntities"
        WHERE id IN (SELECT entity_id FROM "duplicate_entities" WHERE index = 2);
      `, {transaction: t});
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
