'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      UPDATE "Notifications"
      SET notification_data =
              CASE
                  WHEN notification_data::jsonb ? 'chain_id' THEN
                      jsonb_set(notification_data::jsonb - 'chain_id', '{community_id}', notification_data::jsonb->'chain_id')
                  WHEN notification_data::jsonb ? 'chain' THEN
                      jsonb_set(notification_data::jsonb - 'chain', '{community_id}', notification_data::jsonb->'chain')
                  ELSE
                      notification_data::jsonb
                  END::text
      WHERE notification_data::jsonb ? 'chain_id' OR notification_data::jsonb ? 'chain';
    `);
  },

  down: async (queryInterface, Sequelize) => {},
};
