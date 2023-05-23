'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Addresses
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Addresses"
        ALTER COLUMN "ghost_address" SET DEFAULT false,
        ALTER COLUMN "ghost_address" SET NOT NULL;
      `,
        { transaction: t }
      );

      // ContractAbis
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "ContractAbis"
        ALTER COLUMN "abi" SET NOT NULL;
      `,
        { transaction: t }
      );

      // Notifications
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Notifications"
        ALTER COLUMN "notification_data" SET NOT NULL;
      `,
        { transaction: t }
      );

      // Notifications Read
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "NotificationsRead"
        ALTER COLUMN "is_read" SET DEFAULT false;
      `,
        { transaction: t }
      );

      // Rules
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Rules"
        ALTER COLUMN "updated_at" SET NOT NULL;
      `,
        { transaction: t }
      );

      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Threads"
        ALTER COLUMN "kind" SET NOT NULL;
      `,
        { transaction: t }
      );

      // default NULL::character varying not null;
      // above is the current constraint on the chain column
      // the default value is NULL (cast to a string which is redundant because NULL value adapts
      // to any data type) but the next constraint states NOT NULL thus preventing the default value
      // from ever being used -> drop default value since we don't want NULL anyway
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Threads" 
        ALTER COLUMN "chain" DROP DEFAULT;
      `,
        { transaction: t }
      );

      // Users
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Users"
        ALTER COLUMN "disableRichText" SET DEFAULT false,
        ALTER COLUMN "disableRichText" SET NOT NULL;
      `,
        { transaction: t }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {},
};
