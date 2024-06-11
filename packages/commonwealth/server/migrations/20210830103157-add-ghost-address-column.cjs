'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'Addresses',
      'ghost_address',
      Sequelize.BOOLEAN
    );
  },

  down: async (queryInterface) => {
    return queryInterface.removeColumn('Addresses', 'ghost_address');
  },
};
