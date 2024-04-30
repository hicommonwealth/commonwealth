'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return await queryInterface.renameColumn(
      'CommunityStakes',
      'stake_scaler',
      'vote_weight',
    );
  },

  down: async (queryInterface, Sequelize) => {
    return await queryInterface.renameColumn(
      'CommunityStakes',
      'vote_weight',
      'stake_scaler',
    );
  },
};
