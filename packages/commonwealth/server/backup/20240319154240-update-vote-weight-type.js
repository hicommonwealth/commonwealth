'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('CommunityStakes', 'vote_weight', {
      type: Sequelize.INTEGER,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('CommunityStakes', 'vote_weight', {
      type: Sequelize.NUMERIC,
    });
  },
};
