'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('Addresses', 'public_key', 'address');
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('Addresses', 'address', 'public_key');
  }
};
