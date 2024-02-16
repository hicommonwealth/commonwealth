'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
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
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        UPDATE "Notifications"
        SET notification_data = jsonb_set(
            notification_data::jsonb - 'author_chain', 
            '{author_community_id}', 
            notification_data::jsonb->'author_chain')::TEXT
        WHERE notification_data::jsonb ? 'author_chain';
      `,
        { transaction },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {},
};
