'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Chains', 'terms', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      default: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Chains', 'terms');
  }
};
