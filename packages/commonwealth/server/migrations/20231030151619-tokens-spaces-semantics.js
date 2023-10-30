'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn('Tokens', 'chain_id', 'community_id', {
        transaction,
      });
      await queryInterface.renameColumn('CommunitySnapshotSpace', 'chain_id', 'community_id', {
        transaction,
      });
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn('Tokens', 'community_id', 'chain_id', {
        transaction,
      });
      await queryInterface.renameColumn('CommunitySnapshotSpace', 'community_id', 'chain_id',{
        transaction,
      });
    });
  }
};
