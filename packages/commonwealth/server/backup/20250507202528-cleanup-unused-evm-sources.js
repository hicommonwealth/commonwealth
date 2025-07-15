'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        DELETE FROM "EvmEventSources"
        WHERE contract_address IN (
          SELECT contest_address
          FROM "ContestManagers"
          WHERE cancelled = true OR ended = true
        );
        `,
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    // This migration cannot be reversed as it deletes data
  },
};
