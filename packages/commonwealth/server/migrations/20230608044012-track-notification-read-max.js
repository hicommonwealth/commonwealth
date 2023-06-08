'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // create new table - NotificationsReadMax
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        CREATE TABLE IF NOT EXISTS "NotificationsReadMax"(user_id integer, max_id integer);
        CREATE INDEX IF NOT EXISTS notifications_read_max_user_id ON "NotificationsReadMax"("user_id");

        INSERT INTO "NotificationsReadMax"(user_id, max_id)
        SELECT user_id, max(id)
        FROM "NotificationsRead"
        GROUP BY user_id
        `,
        { raw: true, transaction: t }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        DROP TABLE "NotificationsReadMax"
        `,
        { raw: true, transaction: t }
      );
    });
  },
};