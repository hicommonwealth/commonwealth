'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      // delete chain-event notification reads that are associated with chain-event notifications
      await queryInterface.sequelize.query(
        `
        DELETE 
        FROM "NotificationsRead"
        WHERE notification_id IN (SELECT id FROM "Notifications" WHERE category_id = 'chain-event');
      `,
        {
          transaction: t,
          raw: true,
          type: queryInterface.sequelize.QueryTypes.DELETE,
        }
      );

      // delete chain-event notifications
      await queryInterface.sequelize.query(
        `
          DELETE
          FROM "Notifications"
          WHERE category_id = 'chain-event';
      `,
        {
          transaction: t,
          raw: true,
          type: queryInterface.sequelize.QueryTypes.DELETE,
        }
      );

      await queryInterface.sequelize.query(
        `
          DELETE
          FROM "Subscriptions"
          WHERE category_id = 'chain-event';
      `,
        {
          transaction: t,
          raw: true,
          type: queryInterface.sequelize.QueryTypes.DELETE,
        }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    // irreversible
  },
};
