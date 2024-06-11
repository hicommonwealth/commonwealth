'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      /*
       * Duplicate chain-events that did not create an entity (null entity or duplicated in same entity)
       */

      await queryInterface.sequelize.query(
        `
                CREATE TEMP TABLE ce_delete_null_entity AS
                SELECT id
                FROM (SELECT id,
                             entity_id,
                             ROW_NUMBER()
                             OVER (PARTITION BY chain_event_type_id, block_number, event_data, entity_id ORDER BY id) AS Row
                      FROM "ChainEvents") dups
                WHERE dups.row > 1;
            `,
        { transaction: t, logging: console.log }
      );

      await queryInterface.sequelize.query(
        `
                WITH notifications_to_delete AS (SELECT id
                                                 FROM "Notifications"
                                                 WHERE chain_event_id IN (SELECT * FROM ce_delete_null_entity))
                DELETE
                FROM "NotificationsRead"
                WHERE notification_id IN (SELECT * FROM "notifications_to_delete");
            `,
        { transaction: t, logging: console.log }
      );

      await queryInterface.sequelize.query(
        `
                DELETE
                FROM "Notifications"
                WHERE chain_event_id IN (SELECT * FROM ce_delete_null_entity);
            `,
        { transaction: t, logging: console.log }
      );

      await queryInterface.sequelize.query(
        `
                DELETE
                FROM "ChainEvents"
                WHERE id IN (SELECT * FROM ce_delete_null_entity);
            `,
        { transaction: t, logging: console.log }
      );

      await queryInterface.sequelize.query(
        `
                DROP TABLE ce_delete_null_entity;
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
