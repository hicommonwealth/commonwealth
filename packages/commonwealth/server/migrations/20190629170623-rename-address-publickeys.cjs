'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    // return queryInterface.renameColumn('Addresses', 'public_key', 'address');
    return new Promise((resolve) => resolve());
  },

  down: (queryInterface, Sequelize) => {
    // return queryInterface.renameColumn('Addresses', 'address', 'public_key');
    return new Promise((resolve) => resolve());
  },
};
