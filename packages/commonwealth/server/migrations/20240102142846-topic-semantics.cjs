'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn('Topics', 'chain_id', 'community_id', {
        transaction,
      });
      await queryInterface.sequelize.query(
        `
        ALTER INDEX "OffchainThreadCategories_pkey" RENAME TO "Topics_pkey";
      `,
        { transaction },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn('Topics', 'community_id', 'chain_id', {
        transaction,
      });
      await queryInterface.sequelize.query(
        `
        ALTER INDEX "Topics_pkey" RENAME TO "OffchainThreadCategories_pkey";
      `,
        { transaction },
      );
    });
  },
};
