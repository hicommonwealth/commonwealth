'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameTable('Chains', 'Communities', {
        transaction,
      });
      await queryInterface.sequelize.query(
        `
        CREATE VIEW "Chains" AS SELECT * FROM "Communities";
      `,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `
        ALTER INDEX "Chains_pkey" RENAME TO "Communities_pkey";
      `,
        { transaction }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameTable('Communities', 'Chains', {
        transaction,
      });
      await queryInterface.sequelize.query(
        `
        CREATE VIEW "Chains" AS SELECT * FROM "Communities";
      `,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `
        ALTER INDEX "Chains_pkey" RENAME TO "Communities_pkey";
      `,
        { transaction }
      );
    });
  }
};