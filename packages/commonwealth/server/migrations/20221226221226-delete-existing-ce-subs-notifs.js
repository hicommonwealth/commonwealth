'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      // disable constraints for the duration of this transaction (speeds up migration)
      await queryInterface.sequelize.query(`
          CREATE INDEX idx_notifications_read_notification_id ON "NotificationsRead" (notification_id);
      `, { transaction: t, raw: true });

      await queryInterface.sequelize.query(`
          CREATE INDEX idx_notifications_category_id ON "Notifications" (category_id);
      `, { transaction: t, raw: true });

      await queryInterface.sequelize.query(`
          CREATE INDEX idx_subscriptions_category_id ON "Subscriptions" (category_id);
      `, { transaction: t, raw: true });

      console.log("Indexes created")

      // delete chain-event notification reads that are associated with chain-event notifications
      await queryInterface.sequelize.query(
        `
          DELETE FROM "NotificationsRead" nr
              USING "Notifications" n
          WHERE nr.notification_id = n.id AND n.category_id = 'chain-event';
      `,
        {
          transaction: t,
          raw: true,
          type: queryInterface.sequelize.QueryTypes.DELETE,
        }
      );

      console.log("NR done")

      // await queryInterface.sequelize.query(`
      //     DROP INDEX idx_notifications_category_id;
      // `, { transaction: t, raw: true });
      //
      // console.log("Index dropped")

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

      console.log("N done")

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

      await queryInterface.sequelize.query(`
          DROP INDEX idx_notifications_read_notification_id;
      `, { transaction: t, raw: true });

      await queryInterface.sequelize.query(`
          DROP INDEX idx_subscriptions_category_id;
      `, { transaction: t, raw: true });

      console.log("Indexes dropped")
    });
  },

  down: async (queryInterface, Sequelize) => {
    // irreversible
  },
};
