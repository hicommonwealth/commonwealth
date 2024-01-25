'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('CommunityStakes', 'vote_weight', {
      type: Sequelize.NUMERIC,
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('CommunityStakes', 'vote_weight');
  },
};
