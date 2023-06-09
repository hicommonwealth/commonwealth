'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // create new table - NotificationsReadMax
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        /**
        -- RACE CONDITIONS - OFFSET FIX ESIXITING "NotificationsRead"(id)
        ;with tempNotificationReadCTE AS (
          SELECT nr.*, DENSE_RANK() OVER(PARTITION BY user_id ORDER BY notification_id ASC) as new_offset
          FROM "NotificationsRead" nr
        )
        Update "NotificationsRead"
        SET id=new_offset
        FROM tempNotificationReadCTE tr
        WHERE tr.notification_id="NotificationsRead".notification_id and tr.user_id="NotificationsRead".user_id;
        **/
        -- CREATE NEW TABLE
        DROP TABLE IF EXISTS "NotificationsReadMax";
        CREATE TABLE IF NOT EXISTS "NotificationsReadMax"(user_id integer, max_id integer);
        CREATE INDEX IF NOT EXISTS notifications_read_max_user_id ON "NotificationsReadMax"("user_id");

        INSERT INTO "NotificationsReadMax"(user_id, max_id)
        SELECT user_id, max(id)
        FROM "NotificationsRead"
        GROUP BY user_id;
        `,
        { raw: true, transaction: t, logging: console.log }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        DROP TABLE IF EXISTS "NotificationsReadMax"
        `,
        { raw: true, transaction: t }
      );
    });
  },
};