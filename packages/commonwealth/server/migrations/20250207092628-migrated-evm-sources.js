'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        UPDATE "EvmEventSources"
        SET created_at_block = 1,
            events_migrated = true;
      `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "EvmEventSources"
        ALTER COLUMN created_at_block SET NOT NULL,
        ALTER COLUMN events_migrated SET NOT NULL;
      `,
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
          ALTER TABLE "EvmEventSources"
              ALTER COLUMN created_at_block DROP NOT NULL,
              ALTER COLUMN events_migrated DROP NOT NULL;
      `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        UPDATE "EvmEventSources"
        SET created_at_block = NULL,
            events_migrated = NULL;
      `,
        { transaction },
      );
    });
  },
};
