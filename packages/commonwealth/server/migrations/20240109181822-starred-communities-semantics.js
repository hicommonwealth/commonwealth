'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn(
        'StarredCommunities',
        'chain',
        'community_id',
        {
          transaction,
        },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn(
        'StarredCommunities',
        'community_id',
        'chain',
        {
          transaction,
        },
      );
    });
  },
};
