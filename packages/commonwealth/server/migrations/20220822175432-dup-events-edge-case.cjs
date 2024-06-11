'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      /**
       * duplicate chain-events one that references an entity and another that doesn't
       */

      await queryInterface.sequelize.query(
        `
                select *
                INTO temp_ce
                FROM (SELECT id,
                             chain_event_type_id,
                             block_number,
                             event_data,
                             entity_id,
                             ROW_NUMBER()
                             OVER (PARTITION BY chain_event_type_id, block_number, event_data ORDER BY id)      AS Row,
                             ROW_NUMBER()
                             OVER (PARTITION BY chain_event_type_id, block_number, event_data ORDER BY id DESC) AS ReverseRow
                      FROM "ChainEvents") dups
                WHERE dups.row + reverseRow > 2
                  AND entity_id IS NULL;
            `,
        { transaction: t, logging: console.log }
      );

      await queryInterface.sequelize.query(
        `
                WITH notiifcations_to_delete AS (SELECT id
                                                 FROM "Notifications"
                                                 WHERE chain_event_id IN (SELECT id FROM temp_ce))
                DELETE
                FROM "NotificationsRead"
                WHERE notification_id IN (SELECT * FROM notiifcations_to_delete);
            `,
        { transaction: t, logging: console.log }
      );

      await queryInterface.sequelize.query(
        `
                DELETE
                FROM "Notifications"
                WHERE chain_event_id IN (SELECT id FROM temp_ce);
            `,
        { transaction: t, logging: console.log }
      );

      await queryInterface.sequelize.query(
        `
                DELETE
                FROM "ChainEvents"
                WHERE id IN (SELECT id FROM temp_ce);
            `,
        { transaction: t, logging: console.log }
      );

      await queryInterface.sequelize.query(
        `
                DROP TABLE temp_ce;
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
