'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      /**
       * Duplicate chain-events that created chain-entities
       */

      await queryInterface.sequelize.query(
        `
                CREATE TEMP TABLE chain_entities_to_delete AS
                SELECT id
                FROM (SELECT *,
                             row_number() over (PARTITION BY chain, type, type_id ORDER BY eventCount DESC) AS real_entity,
                             row_number() over (partition by chain, type, type_id ORDER BY id)      AS row,
                             row_number() over (partition by chain, type, type_id ORDER BY id DESC) AS reverse_row
                      FROM (SELECT *
                            FROM "ChainEntities"
                                     JOIN (SELECT entity_id, COUNT(*) AS eventCount
                                           FROM "ChainEvents"
                                           WHERE entity_id IS NOT NULL
                                           GROUP BY entity_id) AS ceCount
                                          ON ceCount.entity_id = id) AS dups) AS ce_ids
                WHERE ce_ids.row + ce_ids.reverse_row > 2 AND
                      real_entity != 1;
            `,
        { transaction: t, logging: console.log }
      );

      await queryInterface.sequelize.query(
        `
                CREATE TEMP TABLE chain_events_to_delete AS
                SELECT id
                FROM "ChainEvents"
                WHERE entity_id IN (SELECT * FROM "chain_entities_to_delete");
            `,
        { transaction: t, logging: console.log }
      );

      await queryInterface.sequelize.query(
        `
                WITH notifications_to_delete AS (SELECT id
                                                 FROM "Notifications"
                                                 WHERE chain_event_id IN (SELECT * FROM "chain_events_to_delete"))
                DELETE
                FROM "NotificationsRead"
                WHERE notification_id IN (SELECT * FROM notifications_to_delete);
            `,
        { transaction: t, logging: console.log }
      );

      await queryInterface.sequelize.query(
        `
                DELETE
                FROM "Notifications"
                WHERE chain_event_id IN (SELECT * FROM "chain_events_to_delete");
            `,
        { transaction: t, logging: console.log }
      );

      await queryInterface.sequelize.query(
        `
                DELETE
                FROM "ChainEvents"
                WHERE id IN (SELECT * FROM chain_events_to_delete);
            `,
        { transaction: t, logging: console.log }
      );

      await queryInterface.sequelize.query(
        `
                DELETE
                FROM "ChainEntities"
                WHERE id IN (SELECT * FROM chain_entities_to_delete);
            `,
        { transaction: t, logging: console.log }
      );

      await queryInterface.sequelize.query(
        `
                DROP TABLE chain_events_to_delete;
            `,
        { transaction: t, logging: console.log }
      );

      await queryInterface.sequelize.query(
        `
                DROP TABLE chain_entities_to_delete;
            `,
        { transaction: t, logging: console.log }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
