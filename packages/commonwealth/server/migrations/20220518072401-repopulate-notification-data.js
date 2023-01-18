'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `UPDATE "Notifications" AS N
           SET notification_data = row_to_json(B)::jsonb || jsonb_build_object('ChainEventType', CET)
           FROM (SELECT * FROM "ChainEvents") as B, (SELECT * FROM "ChainEventTypes") as CET
           WHERE N.category_id = 'chain-event' AND N.chain_event_id = B.id AND CET.id = B.chain_event_type_id;`
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      UPDATE "Notifications" AS N
      SET notification_data = ''
      WHERE N.category_id = 'chain-event';
    `);
  },
};
