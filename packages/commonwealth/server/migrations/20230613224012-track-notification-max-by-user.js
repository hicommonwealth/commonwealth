'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // ADD NEW COLUMNS to track MAX
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS max_notif_offset integer NOT NULL DEFAULT 0;
        `,
        { raw: true, transaction: t, logging: console.log }
      );

      // get max offset from NotificationsRead, and initialize new columns with current max
      await queryInterface.sequelize.query(
        `
        ;with maxOffsetByUser AS (
          SELECT user_id, max(id) as max_offset
          FROM "NotificationsRead"
          GROUP BY user_id
        )
        UPDATE "Users"
        SET max_notif_offset = mu.max_offset
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
        ALTER TABLE "Users" DROP COLUMN IF EXISTS max_notif_offset;
        `,
        { raw: true, transaction: t }
      );
    });
  },
};
