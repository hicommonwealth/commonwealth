'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        /**
        -- RACE CONDITIONS - OFFSET FIX EXISTING "NotificationsRead"(id)
        ;with tempNotificationReadCTE AS (
          SELECT nr.*, DENSE_RANK() OVER(PARTITION BY user_id ORDER BY notification_id ASC) as new_offset
          FROM "NotificationsRead" nr
        )
        Update "NotificationsRead"
        SET id=new_offset
        FROM tempNotificationReadCTE tr
        WHERE tr.notification_id="NotificationsRead".notification_id and tr.user_id="NotificationsRead".user_id;
        **/

        --ADD NEW COLUMN
        DROP TABLE IF EXISTS "NotificationsReadMax";
        ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS max_not_offset integer NOT NULL DEFAULT 0;
        ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS max_not_id integer NOT NULL DEFAULT 0;

        ;with maxOffsetByUser AS (
          SELECT user_id, max(id) as max_offset, max(notification_id) as max_not_id
          FROM "NotificationsRead"
          GROUP BY user_id
        )
        UPDATE "Users"
        SET max_not_offset = mu.max_offset
        , max_not_id = mu.max_not_id
        FROM maxOffsetByUser mu
        where mu.user_id = "Users".id
        `,
        { raw: true, transaction: t, logging: console.log }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        DROP TABLE IF EXISTS "NotificationsReadMax";
        ALTER TABLE "Users" DROP COLUMN IF EXISTS max_not_offset;
        ALTER TABLE "Users" DROP COLUMN IF EXISTS max_not_id;
        `,
        { raw: true, transaction: t }
      );
    });
  },
};
