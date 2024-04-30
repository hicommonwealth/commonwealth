'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn(
        'Users',
        'selected_chain_id',
        'selected_community_id',
        {
          transaction,
        },
      );
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Users"
        RENAME CONSTRAINT "Users_selected_chain_id_fkey" TO "Users_selected_community_id_fkey"
      `,
        { transaction },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn(
        'Users',
        'selected_community_id',
        'selected_chain_id',
        {
          transaction,
        },
      );
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Users"
        RENAME CONSTRAINT "Users_selected_community_id_fkey" TO "Users_selected_chain_id_fkey"
      `,
        { transaction },
      );
    });
  },
};
