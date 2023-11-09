'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn('Tokens', 'chain_id', 'eth_chain_id', {
        transaction,
      });
      await queryInterface.renameColumn(
        'CommunitySnapshotSpaces',
        'chain_id',
        'community_id',
        {
          transaction,
        },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn('Tokens', 'eth_chain_id', 'chain_id', {
        transaction,
      });
      await queryInterface.renameColumn(
        'CommunitySnapshotSpaces',
        'community_id',
        'chain_id',
        {
          transaction,
        },
      );
    });
  },
};
