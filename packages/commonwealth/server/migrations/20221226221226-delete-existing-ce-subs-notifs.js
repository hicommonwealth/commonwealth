'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      // disables foreign key checks i.e. triggers for the duration of the session (connection)
      await queryInterface.sequelize.query(`
        SET session_replication_role = 'replica';
      `, {transaction: t});

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

      // revert back to origin to re-enable foreign key checks for the session i.e. so following migrations have
      // foreign key checks
      await queryInterface.sequelize.query(`
        SET session_replication_role = 'origin';
      `, {transaction: t});
    });
  },

  down: async (queryInterface, Sequelize) => {
    // irreversible
  },
};
