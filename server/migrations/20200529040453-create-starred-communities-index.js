'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addIndex('StarredCommunities', ['chain', 'community', 'user_id']);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeIndex('StarredCommunities', ['chain', 'community', 'user_id']);
  }
};
