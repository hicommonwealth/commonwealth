'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addIndex('StarredCommunities', [
        'chain',
        'community',
        'user_id',
      ]);
    } catch (e) {
      return;
    }
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeIndex('StarredCommunities', [
      'chain',
      'community',
      'user_id',
    ]);
  },
};
