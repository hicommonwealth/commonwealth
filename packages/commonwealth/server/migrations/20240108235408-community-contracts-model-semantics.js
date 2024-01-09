'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn(
        'CommunityContracts',
        'chain_id',
        'community_id',
        {
          transaction,
        },
      );
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "CommunityContracts"
        RENAME CONSTRAINT "CommunityContracts_chain_id_fkey" TO "CommunityContracts_community_id_fkey"
      `,
        { transaction },
      );
      await queryInterface.addIndex('CommunityContracts', {
        fields: ['community_id'],
        name: 'community_contracts_community_id',
        unique: true,
        transaction,
      });
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn(
        'CommunityContracts',
        'community_id',
        'chain_id',
        {
          transaction,
        },
      );
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "CommunityContracts"
        RENAME CONSTRAINT "CommunityContracts_community_id_fkey" TO "CommunityContracts_chain_id_fkey"
      `,
        { transaction },
      );
    });
  },
};
