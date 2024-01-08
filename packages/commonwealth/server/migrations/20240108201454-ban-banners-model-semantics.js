'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn('Bans', 'chain_id', 'community_id', {
        transaction,
      });

      await queryInterface.sequelize.query(
        `
        ALTER INDEX "bans_chain_id" RENAME TO "bans_community_id"
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Bans"
        RENAME CONSTRAINT "Bans_chain_id_fkey" RENAME TO "Bans_community_id_fkey"
      `,
        { transaction },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn('Bans', 'community_id', 'chain_id', {
        transaction,
      });

      await queryInterface.sequelize.query(
        `
        ALTER INDEX "bans_community_id" RENAME TO "bans_chain_id"
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Bans"
        RENAME CONSTRAINT "Bans_community_id_fkey" RENAME TO "Bans_chain_id_fkey"
      `,
        { transaction },
      );
    });
  },
};
