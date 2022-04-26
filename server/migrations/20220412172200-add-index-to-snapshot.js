'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addIndex('Chains', ['snapshot']);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeIndex('Chains', ['snapshot']);
  }
};
