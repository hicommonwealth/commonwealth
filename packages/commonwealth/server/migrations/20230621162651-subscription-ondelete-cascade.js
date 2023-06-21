'use strict';

// TODO: update all null count columns by zero as default
module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      let label = 'drop existing constraint';
      console.log(label);
      console.time(label);
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "NotificationsRead" DROP CONSTRAINT "NotificationsRead_subscription_id_fkey";
        `,
        { raw: true, transaction: t, logging: console.log }
      );
      console.timeEnd(label);

      label = 'Add delete cascade to subscription foreign key constraint';
      console.log(label);
      console.time(label);
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "NotificationsRead" ADD CONSTRAINT "NotificationsRead_subscription_id_fkey" FOREIGN KEY (subscription_id) REFERENCES "Subscriptions"(id) ON DELETE SET NULL;
        `,
        { raw: true, transaction: t, logging: console.log }
      );
      console.timeEnd(label);
    });
  },

  down: async (queryInterface, Sequelize) => {},
};
